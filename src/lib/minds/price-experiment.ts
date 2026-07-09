/**
 * 유료 리포트 가격 A/B 실험 — leadId 결정적 해시로 variant(A/B)를 고정한다.
 *
 * /minds "다섯 배역+관계 해설"(MR-)·/inner-child "내면 아이 심층"(IC-) 두 유료 리포트가
 * 같은 테이블(minds_relationship_purchases)·같은 가격대를 쓰므로 실험 로직을 공유한다.
 * leadId 가 퍼널별로 다른 minds_leads 행이라, 하나의 해시 함수로 두 퍼널이 독립 배정된다.
 *
 * 배경: 페이월 도달은 건강한데 페이월→결제 클릭이 바닥이라, 가격이 병목인지 확인하려고
 * ₩9,900(A) vs ₩19,900(B, 현행)을 5:5로 노출해 전환율을 비교한다. 볼륨을 빨리 쌓으려고
 * 두 퍼널 모두에 건다.
 *
 * ⚠️ 가격 단일 출처 원칙: 페이월 표시·NicePay 결제창 금액·서버 승인검증이 *모두* 같은
 *   leadId 로 이 함수를 호출해 같은 금액을 얻는다(round-trip 없이 일치). 서버가 최종 권위 —
 *   create 가 amount·price_variant 를 저장하고, return 이 저장된 variant 로 기대금액을
 *   되돌려 재검증한다. server 의존성이 없어 클라이언트에서도 안전하게 import.
 */

import {
  MINDS_RELATIONSHIP_PRICE,
  MINDS_RELATIONSHIP_ORIGINAL_PRICE,
} from "./relationship-constants";

export type PriceVariant = "A" | "B";

/**
 * variant → 실제 판매가(price)·표시 정가(originalPrice, 취소선 앵커).
 *  · A(실험군): ₩9,900 — 심리테스트 충동구매 구간. 앵커 ₩15,900(-38%).
 *  · B(대조군): 현행 ₩19,900. 앵커 ₩23,900(-17%). 상수 재사용(이중출처 방지).
 */
export const REPORT_PRICE_TABLE: Record<
  PriceVariant,
  { price: number; originalPrice: number }
> = {
  A: { price: 9900, originalPrice: 15900 },
  B: { price: MINDS_RELATIONSHIP_PRICE, originalPrice: MINDS_RELATIONSHIP_ORIGINAL_PRICE },
};

/** 대조군(현행 ₩19,900) — leadId 가 없을 때의 안전한 기본값(표시·폴백용). */
export const REPORT_PRICE_DEFAULT = {
  variant: "B" as PriceVariant,
  ...REPORT_PRICE_TABLE.B,
};

/**
 * leadId → A/B (결정적, 5:5). 클라·서버가 반드시 같은 결과를 내야 하므로 leadId 문자열만
 * 입력으로 쓴다(djb2 계열 정수해시). 빈 문자열은 B(현행)로 안전하게 폴백한다.
 */
export function reportPriceVariant(leadId: string): PriceVariant {
  if (!leadId) return "B";
  let h = 0;
  for (let i = 0; i < leadId.length; i++) {
    h = (Math.imul(h, 31) + leadId.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 2 === 0 ? "A" : "B";
}

/** leadId → { variant, price, originalPrice }. 표시·결제창·검증 공통 진입점. */
export function reportPricing(leadId: string | null | undefined) {
  if (!leadId) return REPORT_PRICE_DEFAULT;
  const variant = reportPriceVariant(leadId);
  return { variant, ...REPORT_PRICE_TABLE[variant] };
}

/**
 * 서버 승인검증용 — 저장된 price_variant 로 기대 판매가를 되돌린다(변조 방지).
 * 실험 이전에 생성된 행(variant NULL)은 현행 ₩19,900(B) 로 간주한다.
 */
export function reportPriceForVariant(variant: string | null | undefined): number {
  if (variant === "A" || variant === "B") return REPORT_PRICE_TABLE[variant].price;
  return REPORT_PRICE_TABLE.B.price;
}

/**
 * 서버 승인검증용(무마이그레이션) — 금액이 유효한 리포트 판매가(A/B) 중 하나인지 확인한다.
 * amount 자체가 variant 를 인코딩(9,900=A / 19,900=B)하므로, price_variant 컬럼 없이도
 * create 가 leadId 로 확정해 저장한 금액을 이 함수로 검증할 수 있다(위변조 방지는 별도로
 * purchase.amount === NicePay amount 대조로 보장). 실험이전 minds 금액(₩19,900)도 통과.
 */
export function isReportPrice(amount: number): boolean {
  return amount === REPORT_PRICE_TABLE.A.price || amount === REPORT_PRICE_TABLE.B.price;
}
