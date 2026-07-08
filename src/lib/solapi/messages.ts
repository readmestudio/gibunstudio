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
 * 🚧 유료 결제완료 알림톡 — 일시 중단(검수 대기).
 *
 * 기존 템플릿(KA01TP…QnYYJliPQTv)은 고정 웹링크 버튼 `https://gibunstudio.com/minds/my`
 * (로그인 필요)라, 비로그인으로 결제한 구매자는 그 링크로 리포트를 못 연다. 이를 고치려
 * "구매별 링크"(`/r/#{리포트코드}` → 로그인 없이 해당 리포트로 리다이렉트) 버튼을 쓰는
 * 신규 템플릿을 카카오에 재검수 요청 중이다. 검수 통과 전까지는 잘못된 링크가 나가지
 * 않도록 발송을 멈춘다(회원가입 환영 알림톡 sendSignupWelcomeAlimtalk 은 영향 없음).
 *
 * ✅ 신규 템플릿 검수 통과 후 재개 절차:
 *   1) templates.ts 의 MINDS_RELATIONSHIP_PAID 를 새 템플릿 ID(KA01TP…)로 교체.
 *   2) 새 템플릿 버튼 링크를 `https://gibunstudio.com/r/#{리포트코드}` 로 등록했는지 확인
 *      (본문/버튼 변수명이 아래 variables 키와 정확히 일치해야 함 — 다르면 발송 거부).
 *   3) PAID_ALIMTALK_ENABLED 를 true 로.
 */
const PAID_ALIMTALK_ENABLED = false;

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

/** ② 신규 회원가입 환영 */
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
