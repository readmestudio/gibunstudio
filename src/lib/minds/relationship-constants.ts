/**
 * /minds 유료 "내 마음 속 다섯 가지 배역과 그 관계" 리포트 — 가격·식별 상수 (단일 출처).
 *
 * ⚠️ 가격 이중 출처 금지: 결제 생성·승인(금액 검증)·UI 표시가 *모두* 이 상수를 import 한다.
 *   한 곳만 고치면 NicePay 결제창 금액과 서버 검증 금액이 어긋나 결제가 막힌다.
 * server 의존성을 두지 않아 클라이언트 컴포넌트에서도 안전하게 import 할 수 있다.
 */

/** 실제 판매가(원) — NicePay 결제·서버 검증에 쓰이는 "진짜" 금액. 가격 A/B 종료 후 단일가 ₩9,900. */
export const MINDS_RELATIONSHIP_PRICE = 9900;

/**
 * 표시용 정가(원) — 런칭 할인 앵커링에만 쓴다(취소선). 결제·검증엔 절대 쓰지 말 것.
 * UI: ~₩15,900~ → ₩9,900 (-38%, 심리테스트 충동구매 구간).
 */
export const MINDS_RELATIONSHIP_ORIGINAL_PRICE = 15900;

/** NicePay 결제창·영수증에 표시되는 상품명. */
export const MINDS_RELATIONSHIP_GOODS_NAME = "내 마음 속 다섯 가지 배역과 그 관계";

/** orderId prefix — return 라우트가 이 prefix 로 결제 유형을 분기한다. */
export const MINDS_RELATIONSHIP_ORDER_PREFIX = "MR-";

/**
 * /inner-child 유료 "내면 아이 심층 리포트" — 식별·가격 상수 (추가만, 기존 무변).
 *
 * 다섯 배역과 동일한 단일가(₩9,900)를 쓴다 — 전용 상수는 유지(퍼널별 카피/앵커 독립).
 * 다섯 배역과 마찬가지로 결제 생성·승인 검증·UI 표시가 모두 이 상수 하나를 import 한다.
 */

/** /inner-child 실제 판매가(원) — NicePay 결제·서버 검증에 쓰이는 "진짜" 금액. 가격 A/B 종료 후 단일가 ₩9,900. */
export const INNER_CHILD_PRICE = 9900;

/**
 * /inner-child 표시용 정가(원) — 할인 앵커링(취소선)에만 쓴다. 결제·검증엔 절대 쓰지 말 것.
 * UI: ~₩15,900~ → ₩9,900 (-38%).
 */
export const INNER_CHILD_ORIGINAL_PRICE = 15900;

/** orderId prefix — return 라우트가 IC- 로 내면 아이 결제를 분기한다(8번째 prefix). */
export const INNER_CHILD_ORDER_PREFIX = "IC-";

/** NicePay 결제창·영수증에 표시되는 내면 아이 리포트 상품명. */
export const INNER_CHILD_GOODS_NAME = "내면 아이 심층 리포트";

/**
 * /inner-child 워크샵 "내면 아이 찾기 워크샵" — 식별·가격 상수 (추가만, 기존 무변).
 *
 * 리포트(₩9,900)와 전혀 다른 상품 — 상담사 워크샵 + 사전진단(intake) 토큰 발급.
 * 로그인 필수 직접 구매라 leadId 를 쓰지 않는다. 결제 생성·승인 검증·UI 표시가 모두 이 상수를 import 한다.
 */

/** 워크샵 실제 판매가(원) — NicePay 결제·서버 검증에 쓰이는 "진짜" 금액. */
export const WORKSHOP_PRICE = 99000;

/**
 * 워크샵 표시용 정가(원) — 할인 앵커링(취소선)에만 쓴다. 결제·검증엔 절대 쓰지 말 것.
 * UI: ~₩149,000~ → ₩99,000.
 */
export const WORKSHOP_ORIGINAL_PRICE = 149000;

/** orderId prefix — return 라우트가 IW- 로 워크샵 결제를 분기한다(Inner-child Workshop). */
export const WORKSHOP_ORDER_PREFIX = "IW-";

/** NicePay 결제창·영수증에 표시되는 워크샵 상품명. */
export const WORKSHOP_GOODS_NAME = "내면 아이 찾기 워크샵";
