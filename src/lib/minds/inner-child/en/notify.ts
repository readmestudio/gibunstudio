/**
 * 영어 퍼널(/inner-child/en) 운영자 슬랙 알림 — 단계별.
 *
 * 한국어 notify.ts 의 영어판. 같은 봇·같은 채널(SLACK_OPEN_NOTIFY_CHANNEL)을 쓰되,
 * 모든 메시지에 🌍 [EN] 접두를 달아 한국어 퍼널 신호와 눈으로 즉시 구분되게 한다.
 * KR notify.ts / track 라우트는 건드리지 않는다(무회귀) — EN 은 전용 라우트로 분리.
 *
 * 단계:
 *   ⓪ test_start      — 랜딩 "Take the free 3-min test" 클릭
 *   ⓪½ free_report_ready — 설문 완료·무료 리포트 생성(리포트가 열린 순간, 서버 권위 신호)
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
import { getManualReport } from "@/lib/minds/inner-child/en/manual-report-store";
import { isManualReportExpired } from "@/lib/minds/inner-child/en/manual-reports";
import { enFreeResultLink, enFullReportLink } from "@/lib/minds/inner-child/en/site-url";

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
  fullLink: string | null; // 손원고 유료 리포트가 열릴 주소(= 고객에게 보낼 링크)
  hasReport: boolean; // 원고가 이미 있나(재요청·중복 판별)
  expired: boolean; // 원고는 있는데 7일 만료가 지났나(재발급 필요)
}

/** 리드 id 로 식별 정보 + 유형 + 결과링크를 모은다. 실패해도 알림은 나간다. */
async function enLeadContext(leadId: string | null): Promise<EnLeadContext> {
  if (!leadId) {
    return {
      label: "익명 방문자",
      childName: null,
      link: null,
      fullLink: null,
      hasReport: false,
      expired: false,
    };
  }

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

  // 원고 유무·만료(DB) — 조회가 실패해도 "없음"으로 두고 알림은 그대로 내보낸다.
  let hasReport = false;
  let expired = false;
  try {
    const manual = await getManualReport(leadId);
    hasReport = manual !== null;
    expired = manual !== null && isManualReportExpired(manual);
  } catch {
    // 조회 실패 — 원고 없음으로 표기.
  }

  return {
    label: email ? `${email} (EN)` : "익명 방문자 (EN)",
    childName,
    link: enFreeResultLink(leadId),
    fullLink: enFullReportLink(leadId),
    hasReport,
    expired,
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

/* ── ⓪½ 무료 리포트 생성(설문 완료) — 시작과 페이월 사이의 공백을 메운다 ──
 * test_start(브라우저)와 reached_paywall(브라우저 스크롤) 사이엔 신호가 없었다.
 * 이 알림은 설문을 끝내야만 호출되는 서버 라우트(free-report)에서 발사되므로,
 * "설문을 안 끝냄" vs "끝내고 리포트를 안 읽음" 을 슬랙만으로 구분하게 해준다.
 * 위기 응답도 설문 완료지만 페이월로 안 가므로(전문기관 안내) 🆘 로 따로 표기한다. */
export async function notifyEnFreeReportReady(p: {
  leadId: string | null;
  crisis?: boolean;
}): Promise<void> {
  const c = await enLeadContext(p.leadId);
  if (p.crisis) {
    await send(
      `🆘 *[EN] 무료 리포트(위기 감지)* — 설문 완료·전문기관 안내 렌더(LLM 스킵)`,
      `🆘 [EN] 무료 리포트(위기): ${c.label}`,
      [`• ${c.label}`, c.link ? `• ${c.link}` : null],
    );
    return;
  }
  await send(
    `📖 *[EN] 무료 리포트 생성* — 설문 완료, 리포트가 열렸어요`,
    `📖 [EN] 무료 리포트 생성: ${c.label}`,
    [`• ${c.label}`, c.childName ? `• *Type:* ${c.childName}` : null, c.link ? `• ${c.link}` : null],
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

/* ── ③ 이메일 제출(요청 접수) — 자동 생성·발송 파이프라인 시작 ── */
export async function notifyEnReportRequest(p: {
  leadId: string;
  email: string;
}): Promise<void> {
  const c = await enLeadContext(p.leadId || null);
  // 원고가 이미 있으면 자동 재발송(재생성 안 함). 만료된 수동 원고는 자동 연장하지 않는다
  // (운영자가 쓴 원고를 덮어쓰면 안 되므로) — 그 경우만 수동 연장 안내를 남긴다.
  const headline = c.expired
    ? `✉️ *[EN] 유료 리포트 재요청* — 원고가 *7일 만료됨*. 자동 연장은 안 합니다(수동 원고일 수 있음)`
    : c.hasReport
      ? `✉️ *[EN] 유료 리포트 재요청* — 이미 생성된 리포트를 자동 재발송합니다`
      : `✉️ *[EN] 유료 리포트 요청 접수* — 자동 생성·발송을 시작합니다(완료 알림이 뒤따릅니다)`;

  const nextStep = c.expired
    ? `• *수동 연장:* \`LEAD_ID=${p.leadId} EXTEND_ONLY=1 node scripts/put-en-manual-report.js\` → 링크 회신`
    : null;

  const linkState = c.expired
    ? " ⏳ 만료됨"
    : c.hasReport
      ? " ✅ 준비됨(재발송)"
      : " ⏳ 생성 중";

  await send(headline, `✉️ [EN] 리포트 요청: ${p.email}`, [
    `• *Email:* ${p.email}`,
    `• *Type:* ${c.childName ?? "(알 수 없음)"}`,
    c.fullLink ? `• *링크:* ${c.fullLink}${linkState}` : null,
    c.link ? `• *Free result:* ${c.link}` : null,
    p.leadId ? `• *Lead:* \`${p.leadId}\`` : null,
    nextStep,
  ]);
}

/* ── ④ 자동 생성·발송 결과 — 성공/실패 ── */
export async function notifyEnReportSent(p: {
  leadId: string;
  email: string;
  ok: boolean;
  reason?: string;
}): Promise<void> {
  const c = await enLeadContext(p.leadId || null);
  if (p.ok) {
    await send(
      `✅ *[EN] 유료 리포트 자동 발송 완료* — 메일이 나갔어요`,
      `✅ [EN] 리포트 발송 완료: ${p.email}`,
      [
        `• *Email:* ${p.email}`,
        `• *Type:* ${c.childName ?? "(알 수 없음)"}`,
        c.fullLink ? `• *링크:* ${c.fullLink}` : null,
        p.leadId ? `• *Lead:* \`${p.leadId}\`` : null,
      ],
    );
    return;
  }
  await send(
    `⚠️ *[EN] 유료 리포트 자동 생성/발송 실패* — 수동 처리가 필요합니다`,
    `⚠️ [EN] 리포트 실패: ${p.email}`,
    [
      `• *Email:* ${p.email}`,
      `• *Type:* ${c.childName ?? "(알 수 없음)"}`,
      p.reason ? `• *사유:* ${p.reason}` : null,
      c.fullLink ? `• *링크:* ${c.fullLink}` : null,
      p.leadId
        ? `• *수동 대안:* ① Lead 응답 조회 → ② 원고 작성 → ③ \`LEAD_ID=${p.leadId} REPORT_FILE=… node scripts/put-en-manual-report.js\` · \`docs/EN_REPORT_DELIVERY.md\``
        : null,
    ],
  );
}
