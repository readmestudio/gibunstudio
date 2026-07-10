/**
 * 내면 아이 상담 진단(intake) — 공용 타입 계약.
 *
 * ⚠️ 이 파일의 타입 이름·필드명은 SPEC §4 계약이다. 다른 Phase(검사 UI·관리자·리포트)가
 * 그대로 import 하므로 임의 변경 금지.
 *
 * 기존 소비자 리드젠 퍼널(src/lib/minds/inner-child/*)과는 완전 별개 제품이다.
 */

/** 18개 심리도식 코드. S15(부족한 자기통제)·S18(처벌)은 보조 지표(child 매핑 없음). */
export type SchemaCode =
  | "S01" | "S02" | "S03" | "S04" | "S05" | "S06" | "S07" | "S08" | "S09"
  | "S10" | "S11" | "S12" | "S13" | "S14" | "S15" | "S16" | "S17" | "S18";

/** 6점 리커트 응답값 (1 전혀 그렇지 않다 ~ 6 매우 그렇다). */
export type ScaleValue = 1 | 2 | 3 | 4 | 5 | 6;

/** 지킴이(대처방식) 유형. */
export type GuardianType = "surrender" | "avoidance" | "overcompensation";

/** 도식 활성 수준 밴드. high: mean≥4.50 / medium: 3.50≤mean<4.50 / low: mean<3.50 */
export type Band = "high" | "medium" | "low";

/** Part A 원응답: item_id("S01_1".."S18_4") → 1~6 */
export type PartAAnswers = Record<string, ScaleValue>;

/** Part B: "P1"|"P2"|"P3" → 선택한 옵션의 guardian value */
export type PartBAnswers = Record<"P1" | "P2" | "P3", GuardianType>;

/** Part C(SCT): "C1".."C5" → 자유 서술 원문 */
export type PartCAnswers = Record<"C1" | "C2" | "C3" | "C4" | "C5", string>;

/** 도식별 채점 결과. */
export interface SchemaScore {
  code: SchemaCode;
  mean: number;                // 1.00~6.00 소수 둘째 자리
  high_response_count: number; // 응답≥5 개수 0~4
  band: Band;
  is_auxiliary: boolean;       // S15, S18 = true
}

/** 판정된 내면 아이 유형 참조(지식카드 주입 키). 보조지표(S15·S18)는 판정 대상 아님. */
export interface ChildTypeRef {
  child_id: string;    // "hungry_child" 등
  child_name: string;  // "허기진 아이"
  schema_code: SchemaCode;
  schema_name: string; // "정서적 결핍"
  area: string;        // "단절·거절"
  mean: number;
}

/** §3-3 보조 지표 자동 노트. */
export interface AutoNote {
  code: string;
  text: string;
}

/** 채점 엔진 산출물 — 결정적(LLM 미사용). 원응답/타이밍은 store 의 responses 컬럼에 저장. */
export interface ScoreResult {
  test_version: "intake_v1";
  crisis_flag: boolean;
  /** 위기 키워드가 매칭된 SCT 문항·원문 */
  crisis_hits?: { item: "C1" | "C2" | "C3" | "C4" | "C5"; text: string }[];
  quality_flag: "straight_lining_suspected" | null;
  /** 전 도식 mean<3.50 (방어적 응답 또는 실제 안정 가능성 — 세션에서 확인) */
  low_elevation_profile: boolean;
  /** 18개 전체, mean 내림차순 */
  schema_scores: SchemaScore[];
  /** 1위 (매핑 대상 16개 도식 중) */
  primary_child: ChildTypeRef;
  /** 2·3위 보조 유형 */
  secondary_children: ChildTypeRef[];
  /** mean·high_response_count 완전 동률로 공동대표가 된 경우 (primary 포함 전체) */
  co_primary?: ChildTypeRef[];
  guardian: { type: GuardianType; label: string; answers: GuardianType[] };
  auto_notes: AutoNote[];
}

/** 검사 응답 묶음 — intake_sessions.responses(jsonb) 에 저장되는 형태. */
export interface IntakeResponses {
  partA: PartAAnswers;
  partB: PartBAnswers;
  partC: PartCAnswers;
  timings?: {
    a_started_at?: string;   // Part A 시작 시각 (ISO)
    a_submitted_at?: string; // Part A 완료 시각 (ISO)
    submitted_at?: string;   // 전체 제출 시각 (ISO)
  };
}

/** Part A 문항. */
export interface PartAQuestion {
  item_id: string;     // "S01_1".."S18_4"
  schema_code: SchemaCode;
  text: string;
}

/** Part B 선택지. */
export interface PartBOption {
  key: "a" | "b" | "c";
  text: string;
  value: GuardianType;
}

/** Part B 문항(3지선다). */
export interface PartBQuestion {
  item_id: "P1" | "P2" | "P3";
  text: string;
  options: PartBOption[];
}

/** Part C(SCT) 문항. */
export interface PartCQuestion {
  item_id: "C1" | "C2" | "C3" | "C4" | "C5";
  text: string;
}

/** 도식 ↔ 내면 아이 매핑 엔트리 (핸드오프 §4 표). */
export interface SchemaMapEntry {
  code: SchemaCode;
  schema_name: string;      // "정서적 결핍"
  schema_key: string;       // "emotional_deprivation"
  area: string;             // "단절·거절"
  is_auxiliary: boolean;    // S15, S18 = true (child 없음)
  child_id: string | null;  // 보조지표는 null
  child_name: string | null;
}

/** 16유형 지식 카드 (핸드오프 §5 — 상담사 리포트에 그대로 주입). */
export interface TypeCard {
  child_id: string;
  child_name: string;
  schema_code: SchemaCode;
  schema_name: string;
  one_line: string;    // 한 줄
  core_belief: string; // 핵심신념
  inner_voice: string; // 내면의 목소리
  traits: string;      // 특징
  triggers: string;    // 활성화 트리거
  coping: {            // 대처 발현
    surrender: string;
    avoidance: string;
    overcompensation: string;
  };
  special_note?: string; // 특수 노트 (예: 채찍 든 아이 × S18 동반 상승)
}
