import { describe, expect, it } from "vitest";
import type { ScaleValue, SctAnswers } from "./types";
import {
  computeScore,
  resolveGuardian,
  scoreAreas,
  selectChildren,
  type ScoreInput,
} from "./scoring";

const emptySct: SctAnswers = {
  childhood_self: "",
  inner_voice: "",
  family_rule: "",
  regression_trigger: "",
  escape_behavior: "",
};

/** 스크리닝 8문항을 지정값으로 채우는 헬퍼(미지정은 3). */
function screening(overrides: Record<string, ScaleValue>): Record<string, ScaleValue> {
  const base: Record<string, ScaleValue> = {
    S1: 3, S2: 3, S3: 3, S4: 3, S5: 3, S6: 3, S7: 3, S8: 3,
  };
  return { ...base, ...overrides };
}

function makeInput(over: Partial<ScoreInput>): ScoreInput {
  return {
    screening: screening({}),
    common: 1,
    drilldown: {},
    guardian: { G1: "surrender", G2: "surrender", G3: "surrender" },
    sct: emptySct,
    ...over,
  };
}

describe("scoreAreas — 영역 점수·순위", () => {
  it("합산 점수로 상위 2영역을 뽑는다", () => {
    const { areas, topAreas } = scoreAreas(
      screening({ S1: 6, S2: 6, S5: 5, S6: 5, S3: 1, S4: 1, S7: 1, S8: 1 }),
    );
    expect(areas.disconnection.score).toBe(12);
    expect(areas.other_directedness.score).toBe(10);
    expect(topAreas).toEqual(["disconnection", "other_directedness"]);
    expect(areas.disconnection.rank).toBe(1);
  });

  it("동점이면 정서 슬롯 점수 → 영역 우선순위로 순위를 가른다", () => {
    // disc/impaired/other 모두 합산 8 동점. 정서 슬롯: disc(S1)=6 > 나머지=2.
    // impaired vs other 는 정서 동점(2) → 영역 우선순위(impaired > other).
    const { areas, topAreas } = scoreAreas(
      screening({
        S1: 6, S2: 2, // disc affect 우세
        S3: 2, S4: 6, // impaired
        S5: 2, S6: 6, // other
        S7: 2, S8: 1, // over=3
      }),
    );
    expect(areas.disconnection.rank).toBe(1);
    expect(areas.impaired_autonomy.rank).toBe(2);
    expect(areas.other_directedness.rank).toBe(3);
    expect(topAreas).toEqual(["disconnection", "impaired_autonomy"]);
  });
});

describe("selectChildren — 대표/차순위 아이", () => {
  const topScreening = screening({ S1: 6, S2: 6, S5: 5, S6: 5, S3: 1, S4: 1, S7: 1, S8: 1 });

  it("상위 2영역 드릴다운 최고점이 대표 아이", () => {
    const input = makeInput({
      screening: topScreening,
      drilldown: { D01: 6, D02: 3, D03: 2, D04: 2, D05: 2, D10: 4, D11: 3, D12: 2 },
    });
    const { areas, topAreas } = scoreAreas(input.screening);
    const { primary, secondary } = selectChildren(input, areas, topAreas);
    expect(primary.schema_id).toBe("abandonment");
    expect(primary.child_name).toBe("문 앞에서 기다리는 아이");
    expect(primary.conditional).toBe(false);
    expect(primary.top_item_text).toContain("확인하고 싶어진다");
    expect(secondary.length).toBeLessThanOrEqual(2);
  });

  it("특권의식은 5점 이상일 때만 대표 후보에 든다", () => {
    // C1=6, 드릴다운 최고 4 → 특권의식이 대표.
    const withEnt = makeInput({
      screening: topScreening,
      common: 6,
      drilldown: { D01: 4, D02: 3, D10: 4, D11: 2 },
    });
    let { areas, topAreas } = scoreAreas(withEnt.screening);
    let r = selectChildren(withEnt, areas, topAreas);
    expect(r.primary.schema_id).toBe("entitlement");
    expect(r.entitlementScore).toBe(6);

    // C1=4(컷 미만) → 후보 제외, 대표는 드릴다운 최고점.
    const belowCut = makeInput({
      screening: topScreening,
      common: 4,
      drilldown: { D01: 5, D02: 3, D10: 4, D11: 2 },
    });
    ({ areas, topAreas } = scoreAreas(belowCut.screening));
    r = selectChildren(belowCut, areas, topAreas);
    expect(r.primary.schema_id).toBe("abandonment");
    expect(r.entitlementScore).toBe(4);
  });

  it("차순위는 최대 2개", () => {
    const input = makeInput({
      screening: topScreening,
      drilldown: { D01: 6, D02: 5, D03: 5, D04: 5, D05: 5, D10: 5, D11: 5, D12: 5 },
    });
    const { areas, topAreas } = scoreAreas(input.screening);
    const { secondary } = selectChildren(input, areas, topAreas);
    expect(secondary.length).toBe(2);
  });
});

describe("resolveGuardian — 지킴이 판별", () => {
  it("다수결", () => {
    expect(
      resolveGuardian({ G1: "surrender", G2: "surrender", G3: "avoidance" }).type,
    ).toBe("surrender");
  });

  it("3개 전부 상이하면 G2(감정 장면) 응답을 채택", () => {
    const r = resolveGuardian({
      G1: "surrender",
      G2: "avoidance",
      G3: "overcompensation",
    });
    expect(r.type).toBe("avoidance");
    expect(r.label).toBe("재우는 지킴이");
  });
});

describe("computeScore — 위기 필터 + 통합", () => {
  it("SCT 자·타해 키워드가 있으면 crisis_flag=true", () => {
    const r = computeScore(
      makeInput({
        drilldown: { D01: 6 },
        sct: { ...emptySct, escape_behavior: "그냥 다 죽고 싶다" },
      }),
    );
    expect(r.crisis_flag).toBe(true);
  });

  it("평범한 응답은 crisis_flag=false, 단일 입력 JSON 형태를 갖춘다", () => {
    const r = computeScore(
      makeInput({
        screening: screening({ S1: 6, S2: 6 }),
        drilldown: { D01: 6, D02: 4 },
        sct: { ...emptySct, escape_behavior: "유튜브" },
      }),
    );
    expect(r.crisis_flag).toBe(false);
    expect(r.test_version).toBe("v2.0");
    expect(r.primary_child.schema_id).toBeTruthy();
    expect(r.guardian.label).toBeTruthy();
    expect(Object.keys(r.areas)).toHaveLength(4);
  });
});
