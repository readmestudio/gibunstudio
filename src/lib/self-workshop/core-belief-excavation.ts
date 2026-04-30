/**
 * Step 4 "핵심 신념 찾기"의 DB 저장 구조와 마이그레이션 헬퍼.
 *
 * - 새 흐름: SCT(문장 완성검사) 14문항 응답 → LLM 분석 → 자기/타인/세계 3축 신념
 * - 호환: 다운스트림(Step 5/6/8/10)이 읽는 `synthesis.belief_line` 등은 그대로 채워서 저장
 * - 마이그레이션: 기존 Downward Arrow 데이터는 `legacy_downward_arrow`로 백업 보관
 */

/* ─────────────────────────── SCT 응답 ─────────────────────────── */

export interface SctResponse {
  answer: string;
  skipped: boolean;
  updated_at: string;
}

export type SctResponses = Record<string, SctResponse>;

/* ─────────────────────────── LLM 분석 결과 ─────────────────────────── */

export interface DominantSchema {
  ems_code: string; // 내부용 (DS, US, AS 등) — 화면 비노출
  natural_label_ko: string; // 화면 노출용 자연어 라벨
  strength: "strong" | "moderate";
}

export interface EvidenceQuote {
  sct_code: string; // "A2", "B1" 등
  category_ko: string; // "자기 가치", "성취·인정" 등
  quote: string; // 사용자 응답 직접 인용
}

export interface BeliefAnalysis {
  belief_about_self: string;
  belief_about_others: string;
  belief_about_world: string;
  dominant_schemas: DominantSchema[];
  evidence_quotes: EvidenceQuote[];
  generated_at: string;
}

/* ─────────────────────────── 다운스트림 호환 ─────────────────────────── */

export interface Synthesis {
  belief_line: string; // = belief_about_self (Step 5/6/8/10이 읽음)
  how_it_works: string;
  reframe_invitation: string;
}

/* ─────────────────────────── 레거시 백업 ─────────────────────────── */

export interface LegacyDownwardArrow {
  answers?: Record<string, unknown>;
  mid_hypothesis?: {
    hot_thought?: string;
    core_belief?: string;
    generated_at?: string;
  };
  synthesis?: Synthesis;
  archived_at: string;
}

/* ─────────────────────────── 통합 타입 ─────────────────────────── */

export interface CoreBeliefExcavation {
  sct_responses: SctResponses;
  belief_analysis?: BeliefAnalysis;
  synthesis?: Synthesis; // 다운스트림 호환을 위해 belief_analysis와 함께 채움
  legacy_downward_arrow?: LegacyDownwardArrow;
}

/* ─────────────────────────── 마이그레이션 ─────────────────────────── */

interface LegacyAnswers {
  selected_hot_thought?: unknown;
  q1_selected?: unknown;
  q1_custom?: unknown;
  q2_selected?: unknown;
  q2_custom?: unknown;
  q3_selected?: unknown;
  q3_custom?: unknown;
  q4_origin?: unknown;
  q5_compassion?: unknown;
  [key: string]: unknown;
}

/**
 * 기존 Downward Arrow 데이터를 가진 사용자가 새 SCT UI에 진입했을 때
 * 한 번 호출되어 `core_belief_excavation`을 새 구조로 변환한다.
 *
 * - sct_responses: {}로 초기화 (사용자가 새로 작성)
 * - synthesis: 기존 값이 있으면 보존 (다운스트림이 빈값을 받지 않도록)
 * - legacy_downward_arrow: 옛 answers/mid_hypothesis 통째로 백업
 *
 * 이미 새 구조(sct_responses 키 존재)면 변환하지 않고 그대로 반환한다.
 */
export function migrateLegacyExcavation(
  saved: unknown
): CoreBeliefExcavation {
  if (!saved || typeof saved !== "object") {
    return { sct_responses: {} };
  }

  const obj = saved as Record<string, unknown>;

  // 이미 새 구조면 그대로 정규화해서 반환
  if (obj.sct_responses && typeof obj.sct_responses === "object") {
    return {
      sct_responses: normalizeSctResponses(obj.sct_responses),
      belief_analysis: isBeliefAnalysis(obj.belief_analysis)
        ? obj.belief_analysis
        : undefined,
      synthesis: isSynthesis(obj.synthesis) ? obj.synthesis : undefined,
      legacy_downward_arrow: isLegacy(obj.legacy_downward_arrow)
        ? obj.legacy_downward_arrow
        : undefined,
    };
  }

  // 레거시 구조 → 백업 후 새 구조로
  const legacyAnswers = (obj.answers ?? undefined) as LegacyAnswers | undefined;
  const legacyMidHyp = obj.mid_hypothesis as
    | LegacyDownwardArrow["mid_hypothesis"]
    | undefined;
  const legacySynthesis = isSynthesis(obj.synthesis) ? obj.synthesis : undefined;

  const hasLegacyContent =
    !!legacyAnswers ||
    !!legacyMidHyp ||
    !!legacySynthesis;

  return {
    sct_responses: {},
    // 기존 synthesis는 다운스트림 회귀 방지를 위해 살려둠.
    // 사용자가 새 SCT 분석을 수행하면 덮어쓰기.
    synthesis: legacySynthesis,
    legacy_downward_arrow: hasLegacyContent
      ? {
          answers: legacyAnswers as Record<string, unknown> | undefined,
          mid_hypothesis: legacyMidHyp,
          synthesis: legacySynthesis,
          archived_at: new Date().toISOString(),
        }
      : undefined,
  };
}

function normalizeSctResponses(raw: unknown): SctResponses {
  if (!raw || typeof raw !== "object") return {};
  const out: SctResponses = {};
  for (const [code, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const v = value as Record<string, unknown>;
    out[code] = {
      answer: typeof v.answer === "string" ? v.answer : "",
      skipped: v.skipped === true,
      updated_at:
        typeof v.updated_at === "string"
          ? v.updated_at
          : new Date().toISOString(),
    };
  }
  return out;
}

function isBeliefAnalysis(v: unknown): v is BeliefAnalysis {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.belief_about_self === "string" &&
    typeof r.belief_about_others === "string" &&
    typeof r.belief_about_world === "string" &&
    Array.isArray(r.dominant_schemas) &&
    Array.isArray(r.evidence_quotes)
  );
}

function isSynthesis(v: unknown): v is Synthesis {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.belief_line === "string" &&
    typeof r.how_it_works === "string" &&
    typeof r.reframe_invitation === "string"
  );
}

function isLegacy(v: unknown): v is LegacyDownwardArrow {
  if (!v || typeof v !== "object") return false;
  return typeof (v as Record<string, unknown>).archived_at === "string";
}

/* ─────────────────────────── 유틸 ─────────────────────────── */

/**
 * sct_responses에서 답변이 있는 (건너뛰지 않은) 응답 수.
 * 분석 활성화 임계치 비교용.
 */
export function countAnsweredResponses(responses: SctResponses): number {
  return Object.values(responses).filter(
    (r) => !r.skipped && r.answer.trim().length > 0
  ).length;
}
