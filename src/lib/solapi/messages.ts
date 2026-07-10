import { sendAlimtalk, type AlimtalkResult } from "./client";
import { ALIMTALK_TEMPLATES } from "./templates";

/**
 * 알림톡 "발송 시나리오" 헬퍼 — 어떤 템플릿에 어떤 변수를 넣을지를 한곳에 모은다.
 *
 * ⚠️ 중요: variables 의 키(`#{...}`)는 솔라피 콘솔에 등록·검수된 실제 템플릿 본문의
 * 치환 변수명과 **정확히 일치**해야 한다. 변수명이 다르면 발송이 거부된다.
 * 아래 매핑은 일반적인 변수명으로 작성한 초안이므로, 실제 템플릿 본문을 확인해
 * (예: `#{고객명}` 이 아니라 `#{이름}` 인지 등) 반드시 맞춰야 한다.
 */

/**
 * ✅ 유료 결제완료 알림톡 — 발송 중(신규 템플릿 검수 통과, 2026-07-09 재개).
 *
 * 신규 템플릿 `KA01TP260708141612490nILeKmIgJ4U` 은 버튼 웹링크가
 * `https://gibunstudio.com/r/#{리포트코드}` — 로그인 없이 구매별 리포트로 리다이렉트한다
 * (`/r/[id]` 라우트가 order_id prefix 로 IC-→내면 아이 / 그 외→다섯 배역 분기).
 * `#{리포트코드}` 하나만 치환하며, 값은 결제 UUID(purchase.id)다. 솔라피가 이 변수를
 * 본문·버튼 URL 양쪽에 함께 치환하므로 아래 variables 만 넘기면 된다.
 *
 * (구 템플릿 …QnYYJliPQTv 은 버튼이 `/minds/my` 고정이라 비로그인 구매자가 못 열어 폐기.)
 */
const PAID_ALIMTALK_ENABLED = true;

/** ① "다섯 배역 + 관계 해설" / 내면 아이 유료 리포트 결제(제작) 완료 안내 */
export async function sendPaidReportAlimtalk(p: {
  phone: string;
  /** 구매별 리포트로 이어지는 짧은 링크 코드(= 구매 UUID). 버튼 `/r/#{리포트코드}` 에 들어간다. */
  reportCode: string;
  /** 슬랙 알림/호환용 전체 리포트 URL(메시지 본문엔 안 씀). */
  reportUrl?: string;
  name?: string | null;
}): Promise<AlimtalkResult> {
  // 신규 템플릿 검수 대기 — 승인 전까지 발송하지 않는다(잘못된 /minds/my 링크 방지).
  if (!PAID_ALIMTALK_ENABLED) {
    return { success: false, reason: "paid_alimtalk_disabled_pending_template" };
  }
  return sendAlimtalk({
    to: p.phone,
    templateId: ALIMTALK_TEMPLATES.MINDS_RELATIONSHIP_PAID,
    variables: {
      // ⚠️ 키는 신규 템플릿에 등록한 변수명과 정확히 일치해야 한다.
      "#{리포트코드}": p.reportCode,
    },
  });
}

/**
 * ✅ 워크샵 결제완료 알림톡 — 발송 중(카카오 검수 통과, 2026-07-10).
 *
 * "내면 아이 찾기 워크샵"(₩99,000) 결제 승인 시 발급된 intake 사전진단 링크를 안내한다.
 * 솔라피 등록 템플릿(KA01TP260709132645540dGXyz3WKmgd)은 **도메인 고정 + 토큰만 변수** 방식이다:
 * 버튼(모바일/PC 웹링크) URL 이 `https://gibunstudio.com/intake/#{진단토큰}` 이라
 * 본문·버튼에 세션 토큰(session.token)만 치환한다. 변수는 #{고객명}, #{진단토큰} 2종.
 */
const WORKSHOP_ALIMTALK_ENABLED = true;

/** ② 워크샵 결제완료 → intake 사전진단 링크 안내 */
export async function sendWorkshopIntakeAlimtalk(p: {
  phone: string;
  name?: string | null;
  /** 사전진단 세션 토큰 — 템플릿 버튼 웹링크 `.../intake/#{진단토큰}` 에 치환된다(도메인은 템플릿에 고정). */
  intakeToken: string;
}): Promise<AlimtalkResult> {
  // 템플릿 검수 대기 — 승인 전까지 발송하지 않는다(미등록 templateId 발송 거부 방지).
  if (!WORKSHOP_ALIMTALK_ENABLED) {
    return { success: false, reason: "workshop_alimtalk_disabled_pending_template" };
  }
  return sendAlimtalk({
    to: p.phone,
    templateId: ALIMTALK_TEMPLATES.WORKSHOP_INTAKE_ISSUED,
    variables: {
      // ⚠️ 키는 솔라피 등록 변수명과 정확히 일치: #{고객명}(본문), #{진단토큰}(버튼 웹링크에 토큰만).
      "#{고객명}": p.name?.trim() || "고객",
      "#{진단토큰}": p.intakeToken,
    },
  });
}

/** ③ 신규 회원가입 환영 */
export async function sendSignupWelcomeAlimtalk(p: {
  phone: string;
  name?: string | null;
}): Promise<AlimtalkResult> {
  return sendAlimtalk({
    to: p.phone,
    templateId: ALIMTALK_TEMPLATES.SIGNUP_WELCOME,
    variables: {
      "#{고객명}": p.name?.trim() || "고객",
    },
  });
}
