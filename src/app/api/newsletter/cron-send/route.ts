import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, getFromAddress, getSiteUrl } from "@/lib/newsletter/resend-client";
import { buildWeeklyEmail } from "@/lib/newsletter/email-templates";
import type { Essay } from "@/lib/essays/data";

/**
 * GET /api/newsletter/cron-send
 *
 * Vercel Cron(vercel.json)에서 매주 목요일 호출.
 * Vercel Cron은 기본 GET 메서드로 호출하며 `Authorization: Bearer ${CRON_SECRET}`
 * 헤더를 자동 주입. 수동 호출 시에도 동일한 Bearer 토큰으로 인증 가능.
 *
 * 동작:
 * 1. 인증 검증
 * 2. newsletter_send_at 가 오늘 이하이고 본문이 있는 에세이 중 가장 오래된 것 선택
 *    (아직 발송되지 않은 건만). 어드민이 예약한 것만 자동 발송 대상.
 * 3. 오늘 해당 에세이가 이미 발송됐는지 확인 (DB unique index로 이중 방어)
 * 4. 활성 구독자 조회
 * 5. 각 구독자에게 개별 발송 (Resend API, 구독자별 해지 토큰 포함)
 * 6. 발송 이력 기록
 *
 * 응답: { sent, failed, skipped?, reason? }
 */

// Vercel Cron 호출은 최대 60초 제한. 구독자 수가 늘어나면 큐로 옮겨야 함.
export const maxDuration = 60;

const BATCH_SIZE = 50; // Resend batch 최대 100, 여유 있게 50씩
const DRY_RUN_HEADER = "x-newsletter-dry-run";

export async function GET(req: Request) {
  // 인증
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = req.headers.get(DRY_RUN_HEADER) === "true";

  const admin = createAdminClient();
  const todayUtcIso = new Date().toISOString().slice(0, 10);

  // 예약된 에세이 중 아직 발송되지 않은 가장 오래된 것 한 건
  // - newsletter_send_at <= today : 예약 시점 도달
  // - body IS NOT NULL / not empty : 본문 필수 (검증 편의상 서버에서 한 번 더 체크)
  // - 이미 newsletter_sends 에 기록된 slug 는 제외 (한 에세이당 1회만 자동 발송)
  const { data: sentRows } = await admin
    .from("newsletter_sends")
    .select("essay_slug");
  const alreadySentSet = new Set(
    (sentRows ?? []).map((r) => r.essay_slug).filter((s): s is string => !!s)
  );

  const { data: scheduledRows, error: scheduledError } = await admin
    .from("essays")
    .select(
      "slug, title, preview, published_at, illustration, cover_image, body, newsletter_send_at"
    )
    .not("newsletter_send_at", "is", null)
    .lte("newsletter_send_at", todayUtcIso)
    .order("newsletter_send_at", { ascending: true });

  if (scheduledError) {
    console.error("[newsletter/cron-send] 예약 에세이 조회 실패:", scheduledError);
    return NextResponse.json({ error: "DB 조회 실패" }, { status: 500 });
  }

  const pending = (scheduledRows ?? []).find(
    (r) => !!r.body?.trim() && !alreadySentSet.has(r.slug)
  );

  if (!pending) {
    return NextResponse.json(
      { skipped: true, reason: "발송 대상 예약 에세이가 없습니다." },
      { status: 200 }
    );
  }

  const essay: Essay = {
    slug: pending.slug,
    title: pending.title,
    preview: pending.preview,
    publishedAt: pending.published_at,
    illustration: pending.illustration,
    coverImage: pending.cover_image,
    body: pending.body,
    newsletterSendAt: pending.newsletter_send_at,
  };

  // 중복 발송 체크 — sent_on(UTC 기준 DATE, generated column)과 비교
  // DB에 newsletter_sends_dedupe_idx (essay_slug, sent_on) unique index가
  // 이중 방어 역할을 하므로, 이 SELECT 체크는 깨끗한 응답을 위한 1차 필터.
  const { data: duplicate } = await admin
    .from("newsletter_sends")
    .select("id")
    .eq("essay_slug", essay.slug)
    .eq("sent_on", todayUtcIso)
    .maybeSingle();

  if (duplicate) {
    return NextResponse.json(
      { skipped: true, reason: `'${essay.slug}' 오늘 이미 발송됨` },
      { status: 200 }
    );
  }

  // 활성 구독자 조회
  const { data: subscribers, error: subError } = await admin
    .from("newsletter_subscribers")
    .select("id, email, unsubscribe_token")
    .eq("status", "active");

  if (subError) {
    console.error("[newsletter/cron-send] 구독자 조회 실패:", subError);
    return NextResponse.json({ error: "DB 조회 실패" }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json(
      { skipped: true, reason: "활성 구독자가 없습니다." },
      { status: 200 }
    );
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      essay: { slug: essay.slug, title: essay.title },
      recipientCount: subscribers.length,
    });
  }

  const essayUrl = `${getSiteUrl()}/essays/${essay.slug}`;
  const from = getFromAddress();
  const resend = getResend();

  let successCount = 0;
  let failureCount = 0;
  const errors: Array<{ email: string; error: string }> = [];
  const sentSubscriberIds: string[] = [];

  // 배치 단위로 발송 (Resend batch API)
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);
    const payload = batch.map((sub) => {
      const unsubscribeUrl = `${getSiteUrl()}/api/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
      const mail = buildWeeklyEmail({ essay, essayUrl, unsubscribeUrl });
      return {
        from,
        to: sub.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    try {
      const { data, error } = await resend.batch.send(payload);
      if (error) throw error;
      successCount += data?.data?.length ?? batch.length;
      // 성공 간주 ID 수집 (last_sent_at 업데이트용)
      sentSubscriberIds.push(...batch.map((s) => s.id));
    } catch (err) {
      failureCount += batch.length;
      const msg = err instanceof Error ? err.message : String(err);
      for (const sub of batch) {
        errors.push({ email: sub.email, error: msg });
      }
      console.error("[newsletter/cron-send] 배치 발송 실패:", msg);
    }
  }

  // 발송 이력 기록
  await admin.from("newsletter_sends").insert({
    essay_slug: essay.slug,
    recipient_count: subscribers.length,
    success_count: successCount,
    failure_count: failureCount,
    error_log: errors.length > 0 ? errors : null,
  });

  // 성공한 구독자들의 last_sent_at 업데이트
  if (sentSubscriberIds.length > 0) {
    await admin
      .from("newsletter_subscribers")
      .update({ last_sent_at: new Date().toISOString() })
      .in("id", sentSubscriberIds);
  }

  return NextResponse.json({
    sent: successCount,
    failed: failureCount,
    essay: { slug: essay.slug, title: essay.title },
  });
}
