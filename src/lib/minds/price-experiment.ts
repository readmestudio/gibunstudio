/**
 * 유료 리포트 가격 — /minds "다섯 배역+관계 해설"(MR-)·/inner-child "내면 아이 심층"(IC-)
 * 두 유료 리포트 공통. 같은 테이블(minds_relationship_purchases)·같은 가격을 쓴다.
 *
 * 배경: 페이월→결제 전환이 병목이라 ₩9,900(A) vs ₩19,900(B) 가격 A/B 를 돌렸으나,
 * 실험을 종료하고 전 사용자 ₩9,900 단일가로 통일했다. leadId 분기(variant)는 제거.
 * (파일명은 하위호환/최소변경을 위해 유지 — 지금은 단일가 출처 모듈이다.)
 *
 * ⚠️ 가격 단일 출처 원칙: 페이월 표시·NicePay 결제창 금액·서버 승인검증이 *모두* 이
 *   함수/상수를 호출해 같은 금액을 얻는다(round-trip 없이 일치). 서버가 최종 권위 —
 *   create 가 amount 를 저장하고, return 이 저장금액과 NicePay 금액 대조로 재검증한다.
 *   server 의존성이 없어 클라이언트에서도 안전하게 import.
 */

import {
  MINDS_RELATIONSHIP_PRICE,
  MINDS_RELATIONSHIP_ORIGINAL_PRICE,
} from "./relationship-constants";

/**
 * 실험 중(A/B) B군 판매가 — 실험 기간에 생성돼 아직 승인(캡처)되지 않은 pending 결제
 * 레코드가 return 검증을 통과하도록 legacy 금액을 계속 허용한다(in-flight 결제 보호).
 */
const LEGACY_REPORT_PRICE = 19900;

/**
 * 유료 리포트 표시·결제 공통 진입점 → { price, originalPrice }.
 * leadId 인자는 A/B 시절 시그니처 하위호환용으로만 남겨 둔다(현재는 값에 무관하게 단일가).
 */
export function reportPricing(_leadId?: string | null) {
  return {
    price: MINDS_RELATIONSHIP_PRICE,
    originalPrice: MINDS_RELATIONSHIP_ORIGINAL_PRICE,
  };
}

/**
 * 서버 승인검증용 — 금액이 유효한 리포트 판매가인지 확인한다(위변조 방지는 별도로
 * purchase.amount === NicePay amount 대조로 보장). 현행 단일가(₩9,900)에 더해, A/B 실험
 * 중 생성된 미승인 결제(₩19,900)도 통과시킨다(in-flight 결제 호환).
 */
export function isReportPrice(amount: number): boolean {
  return amount === MINDS_RELATIONSHIP_PRICE || amount === LEGACY_REPORT_PRICE;
}
