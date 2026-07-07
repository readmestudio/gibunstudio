/**
 * 내면 아이 찾기 — 핵심 타입.
 *
 * HANDOFF-v2 3장(채점 로직)의 LLM 입력 JSON 스키마를 TS 로 옮긴 것.
 * 채점(scoring.ts)의 산출물이자 무료/유료 리포트가 공유하는 "단일 입력 JSON".
 *
 * 소비자 노출 개념은 아이·지킴이뿐. schema_id/area 등 이론 키는 코드 내부 식별자로만 쓴다.
 */

/** 도식 4대 영역(스크리닝 대상). 손상된 한계(특권의식)는 공통 C1로 대체돼 영역에서 제외. */
export type AreaId =
  | "disconnection" // 단절·거절
  | "impaired_autonomy" // 손상된 자율성
  | "other_directedness" // 타인 중심성
  | "overvigilance"; // 과잉경계·억제

/** 스크리닝 문항 슬롯 — 정서 vs 행동. 동점 처리 시 정서 슬롯을 우선한다. */
export type SlotType = "affect" | "behavior";

/** 6점 척도(YSQ 방식, 중앙 없음). 양끝 라벨만 노출. */
export type ScaleValue = 1 | 2 | 3 | 4 | 5 | 6;

/** 지킴이(보호자) 유형 — 소비자 라벨은 따르는/재우는/맞서는 지킴이. */
export type GuardianType = "surrender" | "avoidance" | "overcompensation";

/** SCT 문장완성 5문항의 리포트 슬롯. */
export interface SctAnswers {
  childhood_self: string; // SCT1 어릴 적 나는 ___ 아이였다
  inner_voice: string; // SCT2 다그치는/말리는 목소리
  family_rule: string; // SCT3 우리 집에서는 ___해야 했다
  regression_trigger: string; // SCT4 ___할 때 어린아이가 된 것 같다
  escape_behavior: string; // SCT5 마음이 힘들 때 ___로 도망친다
}

/** 대표/차순위 아이. schema_id 는 유형카드 키와 동일. */
export interface ChildRef {
  schema_id: string;
  child_name: string;
  score: number;
  area?: AreaId;
  conditional: boolean; // 무조건적(false) vs 조건적(true) 도식
  top_item_text?: string; // 드릴다운 최고점 문항 원문(유료 loop 행동 슬롯 원료)
}

export interface GuardianResult {
  type: GuardianType;
  label: string; // "재우는 지킴이"
  answers: GuardianType[]; // G1~G3 각 응답
}

export interface AreaScore {
  score: number;
  rank: number; // 1~4
}

/** 채점 산출물 = 무료/유료 리포트 공유 입력 JSON (HANDOFF 3장). */
export interface ScoreResult {
  test_version: "v2.0";
  crisis_flag: boolean;
  areas: Record<AreaId, AreaScore>;
  primary_child: ChildRef;
  secondary_children: ChildRef[]; // 최대 2
  entitlement_score: number; // C1 점수(대표 후보 진입은 5점 이상일 때만)
  guardian: GuardianResult;
  sct: SctAnswers;
}
