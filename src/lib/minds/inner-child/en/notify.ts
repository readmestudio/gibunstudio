/**
 * 영어 퍼널(/inner-child/en) 운영자 슬랙 알림 — 단계별.
 *
 * 한국어 notify.ts 의 영어판. 같은 봇·같은 채널(SLACK_OPEN_NOTIFY_CHANNEL)을 쓰되,
 * 모든 메시지에 🌍 [EN] 접두를 달아 한국어 퍼널 신호와 눈으로 즉시 구분되게 한다.
 * KR notify.ts / track 라우트는 건드리지 않는다(무회귀) — EN 은 전용 라우트로 분리.
 *
 * 단계:
 *   ⓪ test_start     — 랜딩 "Take the free 3-min test" 클릭
 *   ① reached_paywall — 무료 리포트를 다 읽고 잠금(페이월) 도달
 *   ② request_click   — "Request the full report · $9.90" 클릭(요청 모달 오픈)
 *   ③ report_request  — 이메일 제출(실제 요청 접수) ← 가장 중요, 수동 발송 트리거
 *
 * 운영 정책(KR 과 동일): 모두 fire-and-forget. 호출부는 after() 로 감싼다.
 * 실패는 sendSlackMessage 내부에서 silent — 알림이 사용자 흐름을 막지 않는다.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSlackMessage, SLACK_OPEN_NOTIFY_CHANNEL } from "@/lib/slack";
import { getSavedFreeReport } from "@/lib/minds/inner-child/free-report-store";
import { getEnTypeCard } from "@/lib/minds/inner-child/en/type-cards";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://gibunstudio.com";

/** KST 타임스탬프 컨텍스트(모든 알림 하단 공통). */
function timeContext() {
  return {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `📅 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (KST) · /inner-child/en`,
      },
    ],
  };
}

interface EnLeadContext {
  label: string; // 사람이 읽는 리드 식별
  childName: string | null; // 배정된 유형(있으면)
  link: string | null; // 무료 결과 링크
}

/** 리드 id 로 식별 정보 + 유형 + 결과링크를 모은다. 실패해도 알림은 나간다. */
async function enLeadContext(leadId: string | null): Promise<EnLeadContext> {
  if (!leadId) return { label: "익명 방문자", childName: null, link: null };

  let email: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("minds_leads")
      .select("email")
      .eq("id", leadId)
      .maybeSingle();
    email = (data?.email as string | null) ?? null;
  } catch {
    // 조회 실패 — 익명으로 표기.
  }

  let childName: string | null = null;
  try {
    const blob = await getSavedFreeReport(leadId);
    const schemaId = blob?.score_result?.primary_child?.schema_id;
    if (schemaId) childName = getEnTypeCard(schemaId)?.child_name ?? schemaId;
  } catch {
    // 블롭 없음(테스트 시작 시점) — 정상.
  }

  return {
    label: email ? `${email} (EN)` : "익명 방문자 (EN)",
    childName,
    link: `${SITE_URL}/inner-child/en/r/${leadId}`,
  };
}

/** 공통 전송기 — 제목 + 부가 줄들을 받아 블록으로 조립해 보낸다. */
async function send(headline: string, plain: string, lines: (string | null)[]) {
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: plain,
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: [headline, ...lines.filter(Boolean)].join("\n") },
      },
      timeContext(),
    ],
  });
}

/* ── ⓪ 테스트 시작 ── */
export async function notifyEnTestStart(p: { leadId: string | null }): Promise<void> {
  const c = await enLeadContext(p.leadId);
  await send(
    `🌍 *[EN] 테스트 시작* — "Take the free 3-min test" 클릭`,
    `🌍 [EN] 테스트 시작: ${c.label}`,
    [`• ${c.label}`],
  );
}

/* ── ① 페이월 도달(무료 리포트 완독) ── */
export async function notifyEnReachedPaywall(p: { leadId: string | null }): Promise<void> {
  const c = await enLeadContext(p.leadId);
  await send(
    `🎬 *[EN] 페이월 도달* — 무료 리포트를 끝까지 읽었어요`,
    `🎬 [EN] 페이월 도달: ${c.label}`,
    [`• ${c.label}`, c.childName ? `• *Type:* ${c.childName}` : null, c.link ? `• ${c.link}` : null],
  );
}

/* ── ② 요청 CTA 클릭($9.90 요청 모달 오픈) ── */
export async function notifyEnRequestClick(p: { leadId: string | null }): Promise<void> {
  const c = await enLeadContext(p.leadId);
  await send(
    `🔥 *[EN] 유료 리포트 요청 버튼 클릭* — "Request the full report · $9.90"`,
    `🔥 [EN] 요청 버튼 클릭: ${c.label}`,
    [`• ${c.label}`, c.childName ? `• *Type:* ${c.childName}` : null, c.link ? `• ${c.link}` : null],
  );
}

/* ── ③ 이메일 제출(요청 접수) — 수동 발송 트리거 ── */
export async function notifyEnReportRequest(p: {
  leadId: string;
  email: string;
}): Promise<void> {
  const c = await enLeadContext(p.leadId || null);
  await send(
    `✉️ *[EN] 유료 리포트 요청 접수* — 영문 리포트를 수동으로 작성·발송해 주세요`,
    `✉️ [EN] 리포트 요청: ${p.email}`,
    [
      `• *Email:* ${p.email}`,
      `• *Type:* ${c.childName ?? "(알 수 없음)"}`,
      c.link ? `• *Free result:* ${c.link}` : null,
      p.leadId ? `• *Lead:* \`${p.leadId}\`` : null,
    ],
  );
}
