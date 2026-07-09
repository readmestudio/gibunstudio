import { describe, expect, it } from "vitest";
import {
  REPORT_PRICE_TABLE,
  reportPriceForVariant,
  reportPriceVariant,
  reportPricing,
} from "./price-experiment";

/**
 * 가격 A/B 실험은 결제 경로에 직접 물려 있다(표시·결제창·서버검증이 같은 leadId 로 같은
 * 금액을 도출해야 결제가 통과). /minds·/inner-child 두 퍼널이 공유한다. 결정적성·분배·
 * 폴백·검증 되돌림을 못박아 회귀를 막는다.
 */
describe("reportPriceVariant", () => {
  it("같은 leadId 는 항상 같은 variant (결정적)", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const v = reportPriceVariant(id);
    for (let i = 0; i < 50; i++) expect(reportPriceVariant(id)).toBe(v);
  });

  it("빈/누락 leadId 는 안전하게 B(현행 ₩19,900)로 폴백", () => {
    expect(reportPriceVariant("")).toBe("B");
    expect(reportPricing(null).variant).toBe("B");
    expect(reportPricing(undefined).price).toBe(19900);
  });

  it("A/B 를 대략 5:5 로 분배한다(1만개, 40~60% 허용)", () => {
    let a = 0;
    for (let i = 0; i < 10000; i++) {
      // UUID v4 유사 문자열로 분배 확인.
      const id = `a1b2c3d4-${i.toString(16).padStart(4, "0")}-4e5f-8a9b-${i}`;
      if (reportPriceVariant(id) === "A") a++;
    }
    expect(a).toBeGreaterThan(4000);
    expect(a).toBeLessThan(6000);
  });
});

describe("reportPricing / reportPriceForVariant", () => {
  it("variant 가격표: A=₩9,900 / B=₩19,900", () => {
    expect(REPORT_PRICE_TABLE.A.price).toBe(9900);
    expect(REPORT_PRICE_TABLE.B.price).toBe(19900);
  });

  it("표시가와 서버검증가가 같은 leadId 에서 일치한다(단일 출처)", () => {
    for (const id of ["lead-1", "lead-2", "abc", "xyz-99", "홍길동-리드"]) {
      const p = reportPricing(id);
      // create 가 저장한 variant 를 return 이 되돌린 값과 표시가가 같아야 결제가 통과.
      expect(reportPriceForVariant(p.variant)).toBe(p.price);
    }
  });

  it("실험이전 행(variant NULL/미지정)은 B(₩19,900)로 검증한다", () => {
    expect(reportPriceForVariant(null)).toBe(19900);
    expect(reportPriceForVariant(undefined)).toBe(19900);
    expect(reportPriceForVariant("C")).toBe(19900); // 알 수 없는 값도 안전하게 B
  });
});
