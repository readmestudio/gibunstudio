import { describe, expect, it } from "vitest";
import { isReportPrice, reportPricing } from "./price-experiment";
import {
  MINDS_RELATIONSHIP_PRICE,
  MINDS_RELATIONSHIP_ORIGINAL_PRICE,
} from "./relationship-constants";

/**
 * 유료 리포트 가격은 결제 경로에 직접 물려 있다(표시·결제창·서버검증이 같은 금액을 도출해야
 * 결제가 통과). 가격 A/B 종료 후 전 사용자 ₩9,900 단일가. /minds·/inner-child 두 퍼널 공유.
 */
describe("reportPricing", () => {
  it("leadId 와 무관하게 단일가(₩9,900)를 반환한다", () => {
    expect(MINDS_RELATIONSHIP_PRICE).toBe(9900);
    for (const id of ["lead-1", "lead-2", "abc", "xyz-99", "홍길동-리드", ""]) {
      expect(reportPricing(id).price).toBe(9900);
      expect(reportPricing(id).originalPrice).toBe(MINDS_RELATIONSHIP_ORIGINAL_PRICE);
    }
    expect(reportPricing(null).price).toBe(9900);
    expect(reportPricing(undefined).price).toBe(9900);
  });
});

describe("isReportPrice", () => {
  it("현행 단일가(₩9,900)를 통과시킨다", () => {
    expect(isReportPrice(9900)).toBe(true);
  });

  it("실험 중 생성된 미승인 결제(legacy ₩19,900)도 통과시킨다(in-flight 호환)", () => {
    expect(isReportPrice(19900)).toBe(true);
  });

  it("그 밖의 금액은 거부한다", () => {
    for (const amount of [0, 100, 9000, 14900, 29900, 99000]) {
      expect(isReportPrice(amount)).toBe(false);
    }
  });
});
