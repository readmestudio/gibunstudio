/**
 * intake 채점 엔진 경계값 테스트 (핸드오프 §3).
 *
 * 커버: 도식 동률(co_primary), low_elevation_profile, 위기 키워드 매칭/미매칭,
 *       straight_lining(변산 0 / 소요 시간), 보조 노트 A/B/C, 밴드 경계(4.50/3.50).
 */

import { describe, expect, it } from "vitest";
import type {
  PartAAnswers,
  PartBAnswers,
  PartCAnswers,
  ScaleValue,
  SchemaCode,
} from "./types";
import {
  bandOf,
  computeScore,
  detectQualityFlag,
  resolveGuardian,
  type IntakeScoreInput,
} from "./scoring";
import { ITEM_ORDER } from "./item-order";
import { PART_A_QUESTIONS, SCHEMA_CODES } from "./questions";

/** 전 도식 base 값 + 특정 도식만 덮어쓰는 Part A 헬퍼. */
function makePartA(
  base: ScaleValue,
  overrides: Partial<Record<SchemaCode, [ScaleValue, ScaleValue, ScaleValue, ScaleValue]>> = {},
): PartAAnswers {
  const answers: PartAAnswers = {};
  for (const code of SCHEMA_CODES) {
    const values = overrides[code] ?? [base, base, base, base];
    values.forEach((v, i) => {
      answers[`${code}_${i + 1}`] = v;
    });
  }
  return answers;
}

const PART_B_SURRENDER: PartBAnswers = {
  P1: "surrender",
  P2: "surrender",
  P3: "avoidance",
};

const PART_C_SAFE: PartCAnswers = {
  C1: "조용한",
  C2: "고맙지만 어렵다",
  C3: "실망할 것 같다",
  C4: "혼자 아플",
  C5: "내일 걱정",
};

/** 기본 입력 (변산 확보를 위해 S01 만 살짝 다르게). */
function makeInput(partial: Partial<IntakeScoreInput> = {}): IntakeScoreInput {
  return {
    partA: makePartA(2, { S01: [3, 2, 2, 2] }),
    partB: PART_B_SURRENDER,
    partC: PART_C_SAFE,
    ...partial,
  };
}

describe("도식 점수 — 밴드 경계 (4.50 / 3.50)", () => {
  it("mean 경계값에서 밴드가 정확히 갈린다", () => {
    expect(bandOf(4.5)).toBe("high");
    expect(bandOf(4.49)).toBe("medium");
    expect(bandOf(3.5)).toBe("medium");
    expect(bandOf(3.49)).toBe("low");
  });

  it("mean=4.50 은 high, mean=3.50 은 medium 으로 채점된다", () => {
    const r = computeScore(
      makeInput({
        partA: makePartA(2, {
          S01: [4, 4, 5, 5], // mean 4.50
          S02: [3, 3, 4, 4], // mean 3.50
        }),
      }),
    );
    const byCode = new Map(r.schema_scores.map((s) => [s.code, s]));
    expect(byCode.get("S01")).toMatchObject({ mean: 4.5, band: "high", high_response_count: 2 });
    expect(byCode.get("S02")).toMatchObject({ mean: 3.5, band: "medium", high_response_count: 0 });
    expect(byCode.get("S03")).toMatchObject({ mean: 2, band: "low" });
  });

  it("mean 은 소수 둘째 자리로 반올림된다", () => {
    const r = computeScore(
      makeInput({ partA: makePartA(2, { S01: [2, 3, 3, 3] }) }), // 11/4 = 2.75
    );
    const s01 = r.schema_scores.find((s) => s.code === "S01")!;
    expect(s01.mean).toBe(2.75);
  });
});

describe("유형 판정 — 동률 처리 (§3-2-4)", () => {
  it("mean 동률이면 high_response_count 큰 쪽이 대표가 된다", () => {
    const r = computeScore(
      makeInput({
        partA: makePartA(2, {
          S05: [5, 5, 5, 3], // mean 4.5, hrc 3
          S06: [6, 6, 4, 2], // mean 4.5, hrc 2
        }),
      }),
    );
    expect(r.primary_child.child_id).toBe("hidden_child"); // S05
    expect(r.secondary_children[0].child_id).toBe("fallen_child"); // S06
    expect(r.co_primary).toBeUndefined();
  });

  it("mean·high_response_count 모두 동률이면 공동 대표(co_primary)가 된다", () => {
    const r = computeScore(
      makeInput({
        partA: makePartA(2, {
          S01: [5, 5, 4, 4], // mean 4.5, hrc 2
          S02: [5, 5, 4, 4], // mean 4.5, hrc 2
          S03: [4, 4, 4, 4], // 3위
        }),
      }),
    );
    expect(r.co_primary).toBeDefined();
    expect(r.co_primary!.map((c) => c.child_id).sort()).toEqual([
      "hungry_child",
      "waiting_child",
    ]);
    expect(r.primary_child.child_id).toBe("hungry_child");
    // 공동 대표 그룹 다음 순위부터 보조 유형.
    expect(r.secondary_children[0].child_id).toBe("guarded_child"); // S03
  });

  it("보조 지표(S15·S18)는 점수가 가장 높아도 유형 판정에서 제외된다", () => {
    const r = computeScore(
      makeInput({
        partA: makePartA(2, {
          S15: [6, 6, 6, 6],
          S18: [6, 6, 6, 6],
          S05: [5, 5, 5, 5],
        }),
      }),
    );
    expect(r.primary_child.child_id).toBe("hidden_child"); // S05
    // schema_scores 자체에는 18개 전부 포함 + 보조 플래그.
    expect(r.schema_scores).toHaveLength(18);
    expect(r.schema_scores.find((s) => s.code === "S15")!.is_auxiliary).toBe(true);
    expect(r.schema_scores.find((s) => s.code === "S18")!.is_auxiliary).toBe(true);
    expect(r.schema_scores.find((s) => s.code === "S05")!.is_auxiliary).toBe(false);
  });
});

describe("low_elevation_profile (§3-2-5)", () => {
  it("전 도식 mean<3.50 이면 플래그가 켜지고, 대표는 1위로 판정된다", () => {
    const r = computeScore(
      makeInput({
        partA: makePartA(2, { S03: [3, 3, 3, 3] }), // 최고 mean 3.0 — 전부 low
      }),
    );
    expect(r.low_elevation_profile).toBe(true);
    expect(r.primary_child.child_id).toBe("guarded_child"); // S03
  });

  it("도식 하나라도 mean≥3.50 이면 플래그가 꺼진다", () => {
    const r = computeScore(
      makeInput({ partA: makePartA(2, { S03: [3, 3, 4, 4] }) }), // mean 3.5
    );
    expect(r.low_elevation_profile).toBe(false);
  });
});

describe("위기 신호 필터 (§3-4)", () => {
  it("자·타해 키워드 매칭 시 crisis_flag=true + 문항·원문이 hits 에 담긴다", () => {
    const r = computeScore(
      makeInput({
        partC: {
          ...PART_C_SAFE,
          C5: "다 사라지고 싶다는 생각",
        },
      }),
    );
    expect(r.crisis_flag).toBe(true);
    expect(r.crisis_hits).toEqual([
      { item: "C5", text: "다 사라지고 싶다는 생각" },
    ]);
  });

  it("띄어쓰기 변형(공백 정규화)에도 매칭된다", () => {
    const r = computeScore(
      makeInput({
        partC: { ...PART_C_SAFE, C2: "가끔 죽고  싶다" },
      }),
    );
    expect(r.crisis_flag).toBe(true);
    expect(r.crisis_hits![0].item).toBe("C2");
  });

  it("위기 키워드가 없으면 flag=false, hits 미포함", () => {
    const r = computeScore(makeInput());
    expect(r.crisis_flag).toBe(false);
    expect(r.crisis_hits).toBeUndefined();
  });
});

describe("응답 품질 플래그 (§3-5)", () => {
  it("전 문항 동일 응답(변산 0)이면 straight_lining_suspected", () => {
    const r = computeScore(makeInput({ partA: makePartA(4) }));
    expect(r.quality_flag).toBe("straight_lining_suspected");
  });

  it("Part A 소요 시간 3분 미만이면 straight_lining_suspected", () => {
    const r = computeScore(
      makeInput({
        timings: {
          a_started_at: "2026-07-08T10:00:00.000Z",
          a_submitted_at: "2026-07-08T10:02:59.000Z",
        },
      }),
    );
    expect(r.quality_flag).toBe("straight_lining_suspected");
  });

  it("소요 시간이 정확히 3분이면 플래그 없음 (경계)", () => {
    const flag = detectQualityFlag(makePartA(2, { S01: [3, 2, 2, 2] }), {
      a_started_at: "2026-07-08T10:00:00.000Z",
      a_submitted_at: "2026-07-08T10:03:00.000Z",
    });
    expect(flag).toBeNull();
  });

  it("변산이 있고 타이밍이 없으면 플래그 없음", () => {
    const r = computeScore(makeInput());
    expect(r.quality_flag).toBeNull();
  });
});

describe("지킴이 판별 (§2-2)", () => {
  it("3문항 다수결로 판정한다", () => {
    const g = resolveGuardian({
      P1: "avoidance",
      P2: "overcompensation",
      P3: "avoidance",
    });
    expect(g.type).toBe("avoidance");
    expect(g.answers).toEqual(["avoidance", "overcompensation", "avoidance"]);
  });

  it("전부 상이(a/b/c 각 1개)하면 P1 응답을 채택한다", () => {
    const g = resolveGuardian({
      P1: "overcompensation",
      P2: "surrender",
      P3: "avoidance",
    });
    expect(g.type).toBe("overcompensation");
  });
});

describe("보조 지표 자동 노트 (§3-3)", () => {
  it("노트 A: S18 mean≥4.50 & S13 상위 3위 안", () => {
    const r = computeScore(
      makeInput({
        partA: makePartA(2, {
          S18: [5, 5, 5, 5],
          S13: [6, 6, 6, 6],
        }),
      }),
    );
    expect(r.auto_notes.map((n) => n.code)).toContain("punitive_whip");
    expect(
      r.auto_notes.find((n) => n.code === "punitive_whip")!.text,
    ).toContain("자기처벌 수준");
  });

  it("노트 A 미발동: S18 높아도 S13 이 상위 3위 밖이면 없음", () => {
    const r = computeScore(
      makeInput({
        partA: makePartA(2, {
          S18: [5, 5, 5, 5],
          S01: [6, 6, 6, 6],
          S02: [6, 6, 6, 5],
          S03: [6, 6, 5, 5],
          S13: [3, 3, 3, 3], // 4위 밖
        }),
      }),
    );
    expect(r.auto_notes.map((n) => n.code)).not.toContain("punitive_whip");
  });

  it("노트 B: S15 mean≥4.50", () => {
    const r = computeScore(
      makeInput({ partA: makePartA(2, { S15: [5, 5, 4, 5] }) }), // mean 4.75
    );
    expect(r.auto_notes.map((n) => n.code)).toContain("self_control");
  });

  it("노트 C: S18≥4.50 & 지킴이=overcompensation", () => {
    const r = computeScore(
      makeInput({
        partA: makePartA(2, { S18: [5, 5, 4, 4] }), // mean 4.5
        partB: {
          P1: "overcompensation",
          P2: "overcompensation",
          P3: "surrender",
        },
      }),
    );
    expect(r.auto_notes.map((n) => n.code)).toContain("outward_punitive");
  });

  it("조건 미충족 시 자동 노트 없음", () => {
    const r = computeScore(makeInput());
    expect(r.auto_notes).toEqual([]);
  });
});

describe("통합 산출물 형태", () => {
  it("ScoreResult 필수 필드가 계약대로 채워진다", () => {
    const r = computeScore(makeInput());
    expect(r.test_version).toBe("intake_v1");
    expect(r.schema_scores).toHaveLength(18);
    // mean 내림차순 정렬 확인.
    for (let i = 1; i < r.schema_scores.length; i++) {
      expect(r.schema_scores[i - 1].mean).toBeGreaterThanOrEqual(
        r.schema_scores[i].mean,
      );
    }
    expect(r.secondary_children).toHaveLength(2);
    expect(r.guardian.label).toBe("굴복");
  });
});

describe("문항 순서 (§6-1)", () => {
  it("ITEM_ORDER 는 72문항 전체를 중복 없이 담는다", () => {
    expect(ITEM_ORDER).toHaveLength(72);
    expect(new Set(ITEM_ORDER).size).toBe(72);
    const allIds = new Set(PART_A_QUESTIONS.map((q) => q.item_id));
    for (const id of ITEM_ORDER) expect(allIds.has(id)).toBe(true);
  });

  it("같은 도식 문항이 연속으로 제시되지 않는다", () => {
    for (let i = 1; i < ITEM_ORDER.length; i++) {
      const prev = ITEM_ORDER[i - 1].split("_")[0];
      const curr = ITEM_ORDER[i].split("_")[0];
      expect(prev).not.toBe(curr);
    }
  });

  it("라운드 1은 S01_1..S18_1, 라운드 2는 S10_2 부터 시작한다", () => {
    expect(ITEM_ORDER[0]).toBe("S01_1");
    expect(ITEM_ORDER[17]).toBe("S18_1");
    expect(ITEM_ORDER[18]).toBe("S10_2");
  });
});
