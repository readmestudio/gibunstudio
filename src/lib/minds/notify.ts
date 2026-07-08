/**
 * /minds 깔때기(funnel) 운영자 슬랙 알림 — 한곳 모음.
 *
 * 워크북 대기신청 알림(`api/waitlist/signup`)과 같은 봇(SLACK_BOT_TOKEN)·같은 채널
 * (SLACK_OPEN_NOTIFY_CHANNEL = C0AFVFCTZGS)로 보낸다. 여기 함수들은 전환 깔때기의
 * 각 단계에서 운영자가 실시간으로 흐름을 보도록 신호를 쏜다.
 *
 * 운영 정책(slack.ts 와 동일):
 *  - 모두 fire-and-forget. 호출부는 `after(() => notifyXxx(...))` 로 감싸 응답을
 *    막지 않게 한다(Vercel 서버리스가 응답 직후 컨텍스트를 끊는 걸 회피).
 *  - 실패는 sendSlackMessage 내부에서 silent. 알림은 부가 기능이라 사용자 흐름을
 *    절대 막지 않는다.
 *
 * 단계:
 *   ⓪ 테스트 시작(랜딩 클릭)  notifyMindsTestStart
 *   ① 카카오 로그인          notifyMindsLogin
 *   ② 배역표(Final) 도달     notifyMindsReachedPaywall
 *   ③ "관계 해설 리포트" CTA 클릭  notifyMindsCheckoutClick
 *   ④ 카카오/네이버 결제 시작 notifyMindsPaymentStart
 *   ⑤ 실제 구매 완료         notifyMindsPurchaseComplete
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendSlackMessage, SLACK_OPEN_NOTIFY_CHANNEL } from "@/lib/slack";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/**
 * 퍼널 변형. /minds(다섯 배역)와 /inner-child(내면 아이)는 같은 봇·같은 채널·같은
 * 알림 함수를 공유하되, 어느 깔때기에서 온 신호인지 라벨로만 구분한다.
 */
export type FunnelVariant = "minds" | "inner_child";

/** 변형 → 사람이 읽는 퍼널 경로 라벨. 미지정/기본은 현행 /minds 그대로. */
function funnelLabel(variant?: FunnelVariant): string {
  return variant === "inner_child" ? "/inner-child" : "/minds";
}

/** KST 타임스탬프 컨텍스트 블록(모든 알림 하단 공통). funnel 로 어느 깔때기인지 태깅. */
function timeContext(funnel: string = "/minds") {
  return {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `📅 ${new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} (KST) · ${funnel} 깔때기`,
      },
    ],
  };
}

/** NicePay method 코드 → 사람이 읽는 결제수단 라벨. */
function methodLabel(method: string | null | undefined): string {
  switch (method) {
    case "kakaopay":
      return "카카오페이";
    case "naverpayCard":
      return "네이버페이";
    case "card":
      return "카드";
    default:
      return method || "통합결제";
  }
}

/**
 * minds_leads 에서 리드 식별 정보(이메일/채널)를 조회. 실패하면 null.
 * 클라이언트가 들고 온 leadId 로 "누구인지"를 메시지에 채우는 용도.
 */
async function lookupLead(
  leadId: string | null | undefined
): Promise<{ email: string | null; channel: string | null } | null> {
  if (!leadId) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("minds_leads")
      .select("email, channel")
      .eq("id", leadId)
      .maybeSingle();
    return data ? { email: data.email, channel: data.channel } : null;
  } catch {
    return null;
  }
}

/** "이메일 (채널)" 형태 라벨. 없으면 익명 표기. */
function leadLabel(
  lead: { email: string | null; channel: string | null } | null
): string {
  if (!lead) return "익명 방문자";
  const channel = lead.channel === "kakao" ? "카카오" : "이메일";
  return lead.email ? `${lead.email} (${channel})` : `(${channel} 리드)`;
}

/* ── ⓪ 테스트 시작("3분 무료 테스트" 버튼 클릭) ── */
export async function notifyMindsTestStart(p: {
  leadId: string | null;
  variant?: FunnelVariant;
}): Promise<void> {
  const fn = funnelLabel(p.variant);
  // 이 시점엔 아직 연락처 캡처 전이라 leadId 가 대개 없다 → 익명으로 뜬다.
  const lead = await lookupLead(p.leadId);
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `🚀 ${fn} 테스트 시작: ${leadLabel(lead)}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🚀 *테스트 시작* — "3분 무료 테스트" 버튼 클릭\n*${leadLabel(lead)}*`,
        },
      },
      timeContext(fn),
    ],
  });
}

/* ── ① 카카오 로그인 ── */
export async function notifyMindsLogin(p: {
  email: string;
  userId: string;
}): Promise<void> {
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `🔐 /minds 카카오 로그인: ${p.email || "(이메일 없음)"}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🔐 *새 카카오 로그인* — /minds 테스트 시작\n*${p.email || "(이메일 없음)"}*`,
        },
      },
      timeContext(),
    ],
  });
}

/* ── ② 페이월 카드 도달(/minds 배역표 Final · /inner-child 잠금 목차) ── */
export async function notifyMindsReachedPaywall(p: {
  leadId: string | null;
  variant?: FunnelVariant;
}): Promise<void> {
  const fn = funnelLabel(p.variant);
  const isIC = p.variant === "inner_child";
  const stage = isIC ? "잠금 목차(페이월) 카드 도달" : "배역표(Final) 카드 도달";
  const lead = await lookupLead(p.leadId);
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `🎬 ${fn} ${stage}: ${leadLabel(lead)}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🎬 *${stage}* — 페이월까지 봤어요\n*${leadLabel(lead)}*`,
        },
      },
      timeContext(fn),
    ],
  });
}

/* ── ③ 결제 CTA 클릭(결제 모달 열림) ── */
export async function notifyMindsCheckoutClick(p: {
  leadId: string | null;
  variant?: FunnelVariant;
}): Promise<void> {
  const fn = funnelLabel(p.variant);
  const isIC = p.variant === "inner_child";
  const cta = isIC ? "전체 리포트 받기" : "관계 해설 리포트 받기";
  const lead = await lookupLead(p.leadId);
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `🛒 ${fn} "${cta}" CTA 클릭: ${leadLabel(lead)}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🛒 *"${cta}" 클릭* — 결제 모달 오픈\n*${leadLabel(lead)}*`,
        },
      },
      timeContext(fn),
    ],
  });
}

/* ── ④ 카카오/네이버 결제 시작(결제창 호출 직전) ── */
export async function notifyMindsPaymentStart(p: {
  method: string | null;
  amount: number;
  email: string | null;
  viaMinds: boolean;
}): Promise<void> {
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `💳 워크북 결제 시작 (${methodLabel(p.method)}) ${won(p.amount)}${p.viaMinds ? " · /minds" : ""}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `💳 *결제 시작* — ${methodLabel(p.method)} 버튼 클릭\n*${p.email || "(이메일 없음)"}* · ${won(p.amount)}${p.viaMinds ? "\n🎬 /minds 깔때기를 거쳐 온 결제예요." : ""}`,
        },
      },
      timeContext(),
    ],
  });
}

/**
 * 워크북 "구매 시도" — 결제수단(카카오페이/네이버페이/카드) 버튼 클릭 즉시.
 *
 * notifyMindsPaymentStart(④)는 /api/payment/workshop/create 안에서, 즉 로그인
 * 인증을 통과한 뒤에야 발화한다. 그런데 성취중독 무료 테스트는 "로그인 불필요"
 * 퍼널이라, 비로그인 사용자가 결제 버튼을 누르면 401 로 튕겨 ④ 알림이 안 뜬다.
 * 이 함수는 그 빈틈을 메운다 — 클라이언트에서 클릭 즉시(로그인 전에도) 쏘는 신호.
 * source 로 어느 퍼널(예: 성취중독 테스트)에서 눌렀는지 함께 표기한다.
 */
export async function notifyWorkshopBuyAttempt(p: {
  method: string | null;
  source: string;
}): Promise<void> {
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `🛍️ ${p.source} 구매 시도 (${methodLabel(p.method)})`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🛍️ *구매 시도* — ${methodLabel(p.method)} 버튼 클릭\n*${p.source}*`,
        },
      },
      timeContext(),
    ],
  });
}

/* ── ⓪′ 성취중독 무료 테스트 "시작"(첫 문항 응답) ── */
/**
 * 성취중독 테스트는 별도 "시작하기" 버튼 흐름이 아니라(광고/카드뉴스 유입은 인트로를
 * 건너뛰고 바로 문항부터 시작), 첫 지문에 답을 고른 순간을 "시작"으로 본다. 단순
 * 방문(PageView)과 구분되는 '진짜 시작' 신호를 운영자가 실시간으로 보도록 쏜다.
 */
export async function notifyWorkshopTestStart(p: {
  source: string;
}): Promise<void> {
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `🚀 ${p.source} 시작 (첫 문항 응답)`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `🚀 *테스트 시작* — 첫 문항에 응답(지문 클릭)\n*${p.source}*`,
        },
      },
      timeContext(),
    ],
  });
}

/* ── ⑤ 실제 구매 완료(NicePay 승인/캡처 성공) ── */
export async function notifyMindsPurchaseComplete(p: {
  amount: number;
  orderId: string;
  mindsLeadId: string | null;
}): Promise<void> {
  const lead = await lookupLead(p.mindsLeadId);
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `✅ 워크북 결제 완료 ${won(p.amount)}${lead ? ` · ${leadLabel(lead)}` : ""}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ *워크북 결제 완료!* 🎉\n*${won(p.amount)}* · 주문 \`${p.orderId}\`${lead ? `\n🎬 ${leadLabel(lead)} — /minds 깔때기 전환` : ""}`,
        },
      },
      timeContext(),
    ],
  });
}

/**
 * ⑤' "다섯 배역+관계 해설" 리포트(₩9,900) 결제 완료.
 *
 * 워크북과 달리 *리포트 링크*를 함께 남긴다 — 유저에게 따로 발송하지 않으므로(이메일·
 * 알림톡 미사용), 생성 대기 중 이탈한 유저가 문의해 오면 운영자가 슬랙에서 이메일·시간으로
 * 검색해 이 링크를 찾아 전달할 수 있게 하는 게 목적이다.
 */
export async function notifyMindsRelationshipPurchase(p: {
  amount: number;
  orderId: string;
  mindsLeadId: string | null;
  reportUrl: string;
  variant?: FunnelVariant;
}): Promise<void> {
  const fn = funnelLabel(p.variant);
  const isIC = p.variant === "inner_child";
  const product = isIC ? "내면 아이 심층 리포트" : "관계 해설 리포트";
  const emoji = isIC ? "🧒" : "🎭";
  const lead = await lookupLead(p.mindsLeadId);
  await sendSlackMessage({
    channel: SLACK_OPEN_NOTIFY_CHANNEL,
    text: `✅ ${product} 결제 완료 ${won(p.amount)}${lead ? ` · ${leadLabel(lead)}` : ""}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `✅ *${product} 결제 완료!* ${emoji}\n*${won(p.amount)}* · 주문 \`${p.orderId}\`${lead ? `\n🎬 ${leadLabel(lead)}` : ""}\n🔗 리포트 링크: ${p.reportUrl}\n_(유저 문의 시 위 링크 전달 — 따로 발송하지 않음)_`,
        },
      },
      timeContext(fn),
    ],
  });
}
