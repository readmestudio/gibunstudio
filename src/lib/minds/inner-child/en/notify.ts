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
import { getManualReport } from "@/lib/minds/inner-child/en/manual-report-store";
import { isManualReportExpired } from "@/lib/minds/inner-child/en/manual-reports";

/**
 * 고객에게 그대로 전달되는 링크는 **항상 정식 도메인**이어야 한다.
 *
 * NEXT_PUBLIC_SITE_URL 은 로컬(.env.local = localhost:3000)이나 프리뷰 값이 들어올 수 있고,
 * 실제로 Vercel prod 에 `gibunstudio.vercel.app`(전 라우트 404)이 박혀 있어서 슬랙에 찍힌
 * 리포트 링크가 전부 죽어 있었다. env 는 별도로 고쳐야 하지만, 정식 도메인이 아닌 값은
 * 여기서 무시해 같은 사고가 반복되지 않게 한다.
 */
const CANONICAL_SITE_URL = "https://gibunstudio.com";

function customerSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return CANONICAL_SITE_URL;
  try {
    const { hostname } = new URL(raw);
    if (hostname === "gibunstudio.com" || hostname.endsWith(".gibunstudio.com")) {
      return raw.replace(/\/+$/, "");
    }
  } catch {
    // 파싱 불가한 값 — 정식 도메인으로 떨어진다.
  }
  return CANONICAL_SITE_URL;
}

const SITE_URL = customerSiteUrl();

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
    link: `${SITE_URL}/inner-child/en/r/${leadId}`,
    fullLink: `${SITE_URL}/inner-child/en/full/${leadId}`,
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
  const headline = c.expired
    ? `✉️ *[EN] 유료 리포트 재요청* — 원고는 있는데 *7일 만료가 지났어요*. 연장이 필요합니다`
    : c.hasReport
      ? `✉️ *[EN] 유료 리포트 재요청* — 원고가 이미 있어요. 아래 링크만 회신하면 끝`
      : `✉️ *[EN] 유료 리포트 요청 접수* — 원고를 써서 링크로 보내주세요`;

  // 상태별로 운영자가 할 일이 다르다 — 메시지 안에 그 한 줄만 넣는다.
  const nextStep = c.expired
    ? `• *다음 순서:* \`LEAD_ID=${p.leadId} EXTEND_ONLY=1 node scripts/put-en-manual-report.js\` → 링크 회신`
    : c.hasReport
      ? null
      : `• *다음 순서:* ① Lead 로 응답 조회 → ② 원고(JSON) 작성 → ③ \`LEAD_ID=${p.leadId} REPORT_FILE=… SEND_EMAIL=1 node scripts/put-en-manual-report.js\` — 저장+메일 발송까지 한 번에(배포 불필요) · 절차: \`docs/EN_REPORT_DELIVERY.md\``;

  const linkState = c.expired
    ? " ⏳ 만료됨(지금은 만료 안내가 뜸)"
    : c.hasReport
      ? " ✅ 준비됨"
      : " ⚠️ 원고 없음(지금은 '준비 중' 안내가 뜸)";

  await send(headline, `✉️ [EN] 리포트 요청: ${p.email}`, [
    `• *Email:* ${p.email}`,
    `• *Type:* ${c.childName ?? "(알 수 없음)"}`,
    c.fullLink ? `• *보낼 링크:* ${c.fullLink}${linkState}` : null,
    c.link ? `• *Free result:* ${c.link}` : null,
    p.leadId ? `• *Lead:* \`${p.leadId}\`` : null,
    nextStep,
  ]);
}
