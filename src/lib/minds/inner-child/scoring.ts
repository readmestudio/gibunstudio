/**
 * 내면 아이 찾기 — 채점 엔진 (HANDOFF-v2 3장, LLM 개입 없음).
 *
 * 순수 함수. 클라이언트(상위 2영역 계산 → 드릴다운 노출)와 서버(권위 채점) 양쪽에서 쓴다.
 *
 *   Step 1 영역 점수: 스크리닝 8문항 영역별 합산 → 상위 2영역
 *   Step 2 대표 아이: 상위 2영역 드릴다운 최고점 → primary, 나머지 → secondary(최대 2)
 *   Step 3 지킴이: 3문항 다수결(전부 상이 시 G2 채택)
 *   Step 4 위기 필터: SCT 자·타해 키워드 → crisis_flag
 */

import type {
  AreaId,
  AreaScore,
  ChildRef,
  GuardianResult,
  GuardianType,
  ScaleValue,
  ScoreResult,
  SctAnswers,
} from "./types";
import {
  AREA_PRIORITY,
  COMMON_ITEM,
  DRILLDOWN_BY_AREA,
  DRILLDOWN_ITEMS,
  ENTITLEMENT_CANDIDATE_THRESHOLD,
  GUARDIAN_ITEMS,
  GUARDIAN_LABELS,
  GUARDIAN_TIEBREAK_ITEM_ID,
  SCREENING_ITEMS,
  TOP_AREAS_COUNT,
} from "./questions";
import { detectCrisis } from "./crisis-words";

/** 채점 입력 — 원본 답변. drilldown 은 상위 2영역에서 출제된 것만 담긴다. */
export interface ScoreInput {
  screening: Record<string, ScaleValue>; // S1..S8
  common: ScaleValue; // C1
  drilldown: Record<string, ScaleValue>; // 출제된 D** 만
  guardian: Record<string, GuardianType>; // G1..G3
  sct: SctAnswers;
}

const AFFECT_ITEM_BY_AREA: Record<AreaId, string> = {
  disconnection: "S1",
  impaired_autonomy: "S3",
  other_directedness: "S5",
  overvigilance: "S7",
};

/** Step 1 — 영역별 스크리닝 합산 + 순위. 상위 2영역을 함께 돌려준다. */
export function scoreAreas(screening: Record<string, ScaleValue>): {
  areas: Record<AreaId, AreaScore>;
  topAreas: AreaId[];
} {
  const raw: Record<AreaId, number> = {
    disconnection: 0,
    impaired_autonomy: 0,
    other_directedness: 0,
    overvigilance: 0,
  };
  for (const item of SCREENING_ITEMS) {
    raw[item.area] += screening[item.id] ?? 0;
  }

  const affect = (a: AreaId) => screening[AFFECT_ITEM_BY_AREA[a]] ?? 0;

  // 동점 처리: 합산 점수 → 정서 슬롯 점수 → 영역 우선순위.
  const ordered = (Object.keys(raw) as AreaId[]).sort((a, b) => {
    if (raw[b] !== raw[a]) return raw[b] - raw[a];
    if (affect(b) !== affect(a)) return affect(b) - affect(a);
    return AREA_PRIORITY.indexOf(a) - AREA_PRIORITY.indexOf(b);
  });

  const areas = {} as Record<AreaId, AreaScore>;
  ordered.forEach((a, i) => {
    areas[a] = { score: raw[a], rank: i + 1 };
  });

  return { areas, topAreas: ordered.slice(0, TOP_AREAS_COUNT) };
}

/** 대표/차순위 선정용 후보. */
interface Candidate extends ChildRef {
  areaScreeningScore: number; // 동점 처리 ⓐ
  order: number; // 동점 처리 ⓒ 응답 순서(작을수록 먼저)
}

/** Step 2 — 상위 2영역 드릴다운 + (조건부)특권의식으로 대표/차순위 아이 선정. */
export function selectChildren(
  input: ScoreInput,
  areas: Record<AreaId, AreaScore>,
  topAreas: AreaId[],
): { primary: ChildRef; secondary: ChildRef[]; entitlementScore: number } {
  const entitlementScore = input.common ?? 0;
  const candidates: Candidate[] = [];

  for (const area of topAreas) {
    for (const item of DRILLDOWN_BY_AREA[area]) {
      const score = input.drilldown[item.id];
      if (score == null) continue; // 출제 안 됨
      candidates.push({
        schema_id: item.schema_id,
        child_name: item.child_name,
        area: item.area,
        conditional: item.conditional,
        score,
        top_item_text: item.text,
        areaScreeningScore: areas[area].score,
        order: DRILLDOWN_ITEMS.findIndex((d) => d.id === item.id),
      });
    }
  }

  // 특권의식 예외: C1 >= 5 일 때만 대표 후보 풀 진입(공통 문항이라 응답 순서상 가장 이르다).
  if (entitlementScore >= ENTITLEMENT_CANDIDATE_THRESHOLD) {
    candidates.push({
      schema_id: COMMON_ITEM.schema_id,
      child_name: COMMON_ITEM.child_name,
      conditional: COMMON_ITEM.conditional,
      score: entitlementScore,
      top_item_text: COMMON_ITEM.text,
      areaScreeningScore: entitlementScore,
      order: -1,
    });
  }

  // 동점 처리: 점수 → ⓐ 영역 스크리닝 점수 → ⓑ 무조건적 우선 → ⓒ 응답 순서.
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.areaScreeningScore !== a.areaScreeningScore)
      return b.areaScreeningScore - a.areaScreeningScore;
    if (a.conditional !== b.conditional) return a.conditional ? 1 : -1;
    return a.order - b.order;
  });

  const toRef = (c: Candidate): ChildRef => ({
    schema_id: c.schema_id,
    child_name: c.child_name,
    area: c.area,
    conditional: c.conditional,
    score: c.score,
    top_item_text: c.top_item_text,
  });

  const [primary, ...rest] = candidates;
  return {
    primary: toRef(primary),
    secondary: rest.slice(0, 2).map(toRef),
    entitlementScore,
  };
}

/** Step 3 — 지킴이 다수결. 3개 전부 상이하면 G2(감정 장면) 채택. */
export function resolveGuardian(
  guardian: Record<string, GuardianType>,
): GuardianResult {
  const answers = GUARDIAN_ITEMS.map((g) => guardian[g.id]);
  const tally = new Map<GuardianType, number>();
  for (const a of answers) tally.set(a, (tally.get(a) ?? 0) + 1);

  let type: GuardianType;
  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  if (top.length && top[0][1] >= 2) {
    type = top[0][0];
  } else {
    // 전부 상이 → G2 응답 채택.
    type = guardian[GUARDIAN_TIEBREAK_ITEM_ID];
  }

  return { type, label: GUARDIAN_LABELS[type], answers };
}

/** 전체 채점 — 무료/유료 리포트가 공유하는 단일 입력 JSON 생성. */
export function computeScore(input: ScoreInput): ScoreResult {
  const { areas, topAreas } = scoreAreas(input.screening);
  const { primary, secondary, entitlementScore } = selectChildren(
    input,
    areas,
    topAreas,
  );
  const guardian = resolveGuardian(input.guardian);
  const crisis_flag = detectCrisis([
    input.sct.childhood_self,
    input.sct.inner_voice,
    input.sct.family_rule,
    input.sct.regression_trigger,
    input.sct.escape_behavior,
  ]);

  return {
    test_version: "v2.0",
    crisis_flag,
    areas,
    primary_child: primary,
    secondary_children: secondary,
    entitlement_score: entitlementScore,
    guardian,
    sct: input.sct,
  };
}
