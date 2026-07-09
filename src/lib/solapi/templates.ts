/**
 * 솔라피(Solapi) 카카오 알림톡 템플릿 ID 모음.
 *
 * 템플릿은 솔라피 콘솔에서 카카오 검수를 통과해야 발송 가능하며, 각 템플릿의
 * 본문에 들어간 치환 변수(`#{변수명}`) 이름과 정확히 일치하는 값을 넣어야 한다.
 * (변수 이름이 틀리면 발송이 거부된다.)
 */
export const ALIMTALK_TEMPLATES = {
  /**
   * "다섯 배역 + 관계 해설" / 내면 아이 유료 리포트 결제(제작) 완료 안내.
   * 버튼 웹링크 `https://gibunstudio.com/r/#{리포트코드}` — 로그인 없이 구매별 리포트로
   * 리다이렉트(/r/[id]). 본문·버튼 URL 공통으로 `#{리포트코드}` 하나만 치환한다.
   * (구 템플릿 …QnYYJliPQTv 는 버튼이 /minds/my 고정이라 비로그인 구매자가 못 열어 폐기.)
   */
  MINDS_RELATIONSHIP_PAID: "KA01TP260708141612490nILeKmIgJ4U",
  /** 신규 회원가입 환영 */
  SIGNUP_WELCOME: "KA01TP260627034750891KU8zZHUa89Z",
} as const;

export type AlimtalkTemplateId =
  (typeof ALIMTALK_TEMPLATES)[keyof typeof ALIMTALK_TEMPLATES];
