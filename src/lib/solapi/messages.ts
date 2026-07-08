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

/** ① "다섯 배역 + 관계 해설" 유료 리포트 결제(제작) 완료 안내 */
export async function sendPaidReportAlimtalk(p: {
  phone: string;
  reportUrl: string;
  name?: string | null;
}): Promise<AlimtalkResult> {
  // 이 템플릿(KA01TP…QnYYJliPQTv)은 치환 변수가 없는 고정 문구 + 고정 웹링크 버튼
  // (https://gibunstudio.com/minds/my)으로 등록돼 있다. 템플릿에 없는 변수를 보내면
  // 불일치로 발송이 거부될 수 있어 아무 변수도 보내지 않는다. 유저별 리포트는 버튼이
  // 가리키는 /minds/my 가 계정 귀속으로 찾아준다(다섯 배역·내면 아이 퍼널 분기 포함).
  // reportUrl·name 은 시그니처만 유지(호출부 호환·슬랙 알림용) — 메시지 본문엔 쓰지 않는다.
  return sendAlimtalk({
    to: p.phone,
    templateId: ALIMTALK_TEMPLATES.MINDS_RELATIONSHIP_PAID,
    variables: {},
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
