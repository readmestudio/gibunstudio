/**
 * /minds 유료 "내 마음 속 다섯 가지 배역과 그 관계" 리포트 — 가격·식별 상수 (단일 출처).
 *
 * ⚠️ 가격 이중 출처 금지: 결제 생성·승인(금액 검증)·UI 표시가 *모두* 이 상수를 import 한다.
 *   한 곳만 고치면 NicePay 결제창 금액과 서버 검증 금액이 어긋나 결제가 막힌다.
 * server 의존성을 두지 않아 클라이언트 컴포넌트에서도 안전하게 import 할 수 있다.
 */

/** 실제 판매가(원) — NicePay 결제·서버 검증에 쓰이는 "진짜" 금액. */
export const MINDS_RELATIONSHIP_PRICE = 9900;

/**
 * 표시용 정가(원) — 런칭 할인 앵커링에만 쓴다(취소선). 결제·검증엔 절대 쓰지 말 것.
 * UI: ~₩14,900~ → ₩9,900.
 */
export const MINDS_RELATIONSHIP_ORIGINAL_PRICE = 14900;

/** NicePay 결제창·영수증에 표시되는 상품명. */
export const MINDS_RELATIONSHIP_GOODS_NAME = "내 마음 속 다섯 가지 배역과 그 관계";

/** orderId prefix — return 라우트가 이 prefix 로 결제 유형을 분기한다. */
export const MINDS_RELATIONSHIP_ORDER_PREFIX = "MR-";
