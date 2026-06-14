/**
 * Step 4 "핵심 신념 찾기"의 DB 저장 구조와 마이그레이션 헬퍼.
 *
 * - 새 흐름: SCT(문장 완성검사) 14문항 응답 → LLM 분석 → 자기/타인/세계 3축 신념
 * - 호환: 다운스트림(Step 5/6/8/10)이 읽는 `synthesis.belief_line` 등은 그대로 채워서 저장
 * - 마이그레이션: 기존 Downward Arrow 데이터는 `legacy_downward_arrow`로 백업 보관
 */

import type { PartRole } from "./ifs-parts-data";

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

/* ─────────────────────────── 내면 파츠맵 (Step 4 마무리, 2026-06-11 추가) ───────────────────────────
 *
 * 유저가 보고한 답변(SCT 또는 IFS 대화)을 분석해 내면의 여러 마음을 캐릭터화하고
 * 그들의 관계(누가 앞에 나서는지·어느 둘이 부딪치는지)를 도식화한다.
 *
 * IFS 용어 금지: 화면에는 "리더/갈등/부분" 대신 "지금 가장 앞에 나서는 마음",
 * "서로 자주 부딪치는 두 마음" 같은 자연어만 노출. 아래 구조 필드명은 *내부용*이며
 * role도 화면에 직접 노출하지 않는다.
 */

/** 캐릭터화된 한 마음. */
export interface PartCharacter {
  /** 안정적 id ("p1", "p2" …). leader_id·conflicts가 이 id를 참조. */
  id: string;
  /** 마음 이름. 유저가 붙였거나 LLM이 명명. 예: "다그치는 나" */
  name: string;
  /** 특성 키워드 2~3개. 예: ["완벽주의", "통제"] */
  traits: string[];
  /** 자주 하는 말(대사) 한 줄. 예: "더 해야 해" */
  catchphrase: string;
  /** 유저 원문 인용(환각 방지). 없으면 빈 문자열. */
  evidence_quote: string;
  /** IFS 역할 추정(내부용, 화면 비노출). */
  role?: PartRole;
}

/** 서로 자주 부딪치는 두 마음. a·b는 PartCharacter.id. */
export interface PartConflict {
  a: string;
  b: string;
  /** 왜 부딪치는지 한 줄(자연어). */
  reason: string;
}

export interface PartsMap {
  /** 캐릭터화된 마음들. 보통 2~5개. */
  parts: PartCharacter[];
  /** 지금 가장 앞에 나서는 마음의 id (parts 중 하나). */
  leader_id: string;
  /** 부딪치는 마음 쌍들. */
  conflicts: PartConflict[];
  /** 전체 요약(자연어, 용어 금지). */
  summary: string;
  /** 분석 입력 소스. */
  source: "sct" | "dialogue";
  generated_at: string;
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

  /* Step 4 완료 화면에서 사용자가 고른 "수정 대상" (2026-06-06 추가, 모두 optional) */
  /** 사용자가 고른 자동사고들 — Step 6 대안 자동사고 실습의 원본. */
  selected_thoughts?: string[];
  /** 사용자가 고른 핵심신념들 — Step 7 새 신념 실습의 수정 대상. */
  selected_beliefs?: string[];
  /** LLM이 제시한 후보 캐시(이어하기 시 재호출 최소화). */
  belief_candidates?: { thoughts: string[]; beliefs: string[] };
  /** 선택 완료 시각(ISO). */
  selection_made_at?: string;

  /** 내면 파츠맵 — Step 4 마무리 캐릭터화 결과(멱등 캐시, 2026-06-11). */
  parts_map?: PartsMap;
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
      // Step 4 선택 결과 보존(이어하기).
      selected_thoughts: toStringArray(obj.selected_thoughts),
      selected_beliefs: toStringArray(obj.selected_beliefs),
      belief_candidates: readBeliefCandidates(obj.belief_candidates),
      selection_made_at:
        typeof obj.selection_made_at === "string"
          ? obj.selection_made_at
          : undefined,
      // 파츠맵 캐시 보존(이어하기 시 LLM 재호출 방지).
      parts_map: readPartsMap(obj) ?? undefined,
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

/** 문자열 배열만 추려서 반환. 없거나 비면 undefined. */
function toStringArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return out.length > 0 ? out : undefined;
}

function readBeliefCandidates(
  v: unknown
): { thoughts: string[]; beliefs: string[] } | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as { thoughts?: unknown; beliefs?: unknown };
  const thoughts = toStringArray(o.thoughts) ?? [];
  const beliefs = toStringArray(o.beliefs) ?? [];
  if (thoughts.length === 0 && beliefs.length === 0) return undefined;
  return { thoughts, beliefs };
}

const PART_ROLES: PartRole[] = [
  "manager",
  "firefighter",
  "exile",
  "self_critic",
  "unclear",
];

/**
 * JSONB 컨테이너(core_belief_excavation)에서 parts_map을 안전하게 읽는다.
 * - parts가 1개 미만이면 null(표시할 게 없음).
 * - leader_id가 parts에 없으면 첫 파츠로 폴백.
 * - conflict의 a/b가 parts에 없거나 a===b면 그 conflict 제거.
 * 손상 데이터로 관계 지도 SVG가 깨지지 않도록 한다.
 */
export function readPartsMap(container: unknown): PartsMap | null {
  if (!container || typeof container !== "object") return null;
  const pm = (container as { parts_map?: unknown }).parts_map;
  if (!pm || typeof pm !== "object") return null;
  const o = pm as Record<string, unknown>;

  const rawParts = Array.isArray(o.parts) ? o.parts : [];
  const parts: PartCharacter[] = [];
  for (const p of rawParts) {
    if (!p || typeof p !== "object") continue;
    const pp = p as Record<string, unknown>;
    const id = typeof pp.id === "string" ? pp.id.trim() : "";
    const name = typeof pp.name === "string" ? pp.name.trim() : "";
    if (!id || !name) continue;
    const role =
      typeof pp.role === "string" && PART_ROLES.includes(pp.role as PartRole)
        ? (pp.role as PartRole)
        : undefined;
    parts.push({
      id,
      name,
      traits: toStringArray(pp.traits) ?? [],
      catchphrase: typeof pp.catchphrase === "string" ? pp.catchphrase.trim() : "",
      evidence_quote:
        typeof pp.evidence_quote === "string" ? pp.evidence_quote.trim() : "",
      ...(role ? { role } : {}),
    });
  }
  if (parts.length === 0) return null;

  const ids = new Set(parts.map((p) => p.id));
  const leaderRaw = typeof o.leader_id === "string" ? o.leader_id.trim() : "";
  const leader_id = ids.has(leaderRaw) ? leaderRaw : parts[0].id;

  const conflicts: PartConflict[] = [];
  if (Array.isArray(o.conflicts)) {
    for (const c of o.conflicts) {
      if (!c || typeof c !== "object") continue;
      const cc = c as Record<string, unknown>;
      const a = typeof cc.a === "string" ? cc.a.trim() : "";
      const b = typeof cc.b === "string" ? cc.b.trim() : "";
      if (!ids.has(a) || !ids.has(b) || a === b) continue;
      conflicts.push({
        a,
        b,
        reason: typeof cc.reason === "string" ? cc.reason.trim() : "",
      });
    }
  }

  return {
    parts,
    leader_id,
    conflicts,
    summary: typeof o.summary === "string" ? o.summary.trim() : "",
    source: o.source === "sct" ? "sct" : "dialogue",
    generated_at:
      typeof o.generated_at === "string"
        ? o.generated_at
        : new Date().toISOString(),
  };
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
