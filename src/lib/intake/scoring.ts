/**
 * intake 채점 엔진 (핸드오프 §3 전부 — 100% 결정적, LLM 사용 금지).
 *
 * 순수 함수. 서버(submit 라우트)에서 권위 채점에 사용한다.
 *
 *   §3-1 도식별 점수: mean(4문항) + high_response_count(응답≥5) + 밴드
 *   §3-2 유형 판정: 매핑 대상 16도식(S01~S14,S16,S17) mean 내림차순 → 대표/보조/공동대표
 *   §3-3 보조 지표 자동 노트 (S15·S18)
 *   §3-4 위기 신호 필터 (SCT 키워드)
 *   §3-5 응답 품질 플래그 (변산 0 / Part A 소요 <3분)
 */

import type {
  AutoNote,
  Band,
  ChildTypeRef,
  GuardianType,
  PartAAnswers,
  PartBAnswers,
  PartCAnswers,
  SchemaCode,
  SchemaScore,
  ScoreResult,
} from "./types";
import {
  GUARDIAN_LABELS,
  ITEMS_PER_SCHEMA,
  PART_B_QUESTIONS,
  PART_B_TIEBREAK_ITEM_ID,
  PART_C_QUESTIONS,
  SCHEMA_CODES,
} from "./questions";
import { MAPPED_CODES, SCHEMA_MAP } from "./schema-map";
import { detectCrisis } from "./crisis-words";

/** 밴드 경계 (§3-1). */
export const BAND_HIGH_THRESHOLD = 4.5;
export const BAND_MEDIUM_THRESHOLD = 3.5;

/** high_response_count 집계 기준 (응답 ≥ 5). */
export const HIGH_RESPONSE_THRESHOLD = 5;

/** 보조 지표 자동 노트 발동 기준 (§3-3: mean ≥ 4.50). */
export const AUX_NOTE_THRESHOLD = 4.5;

/** Part A 최소 소요 시간(ms) — 미만이면 straight_lining 의심 (§3-5: 3분). */
export const MIN_PART_A_DURATION_MS = 3 * 60 * 1000;

/** 전 도식 저활성 프로파일 시 리포트에 자동 삽입하는 문구 (§3-2-5). */
export const LOW_ELEVATION_NOTE_TEXT =
  "전반적으로 도식 활성이 낮은 프로파일. 방어적 응답 또는 실제 안정 가능성, 세션에서 확인 필요";

/** §3-3 자동 노트 문구 (핸드오프 원문 그대로). */
export const AUTO_NOTE_TEXTS = {
  /** 노트 A: S18 mean≥4.50 & S13 상위 3위 안 */
  punitive_whip:
    "처벌 도식 동반 상승 — '채찍 든 아이'의 자기비판이 자기처벌 수준으로 강할 수 있음",
  /** 노트 B: S15 mean≥4.50 */
  self_control:
    "자기통제 곤란 동반 — 회피성 대처(미루기·충동)가 강화 요인일 수 있음",
  /** 노트 C: S18≥4.50 & 지킴이=overcompensation */
  outward_punitive: "타인 향 비판·엄격함으로 발현될 가능성",
} as const;

/** 채점 입력. timings 는 §3-5 소요 시간 판정용 옵션(없으면 변산 0만 검사). */
export interface IntakeScoreInput {
  partA: PartAAnswers;
  partB: PartBAnswers;
  partC: PartCAnswers;
  timings?: {
    a_started_at?: string;
    a_submitted_at?: string;
  };
}

/** 소수 둘째 자리 반올림. */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** mean → 밴드 (§3-1). */
export function bandOf(mean: number): Band {
  if (mean >= BAND_HIGH_THRESHOLD) return "high";
  if (mean >= BAND_MEDIUM_THRESHOLD) return "medium";
  return "low";
}

/** §3-1 — 18개 도식별 점수 계산 (mean 내림차순 정렬, 동률 시 high_response_count → 코드순). */
export function scoreSchemas(partA: PartAAnswers): SchemaScore[] {
  const scores: SchemaScore[] = SCHEMA_CODES.map((code) => {
    const values = itemValuesOf(partA, code);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const mean = round2(sum / ITEMS_PER_SCHEMA);
    return {
      code,
      mean,
      high_response_count: values.filter((v) => v >= HIGH_RESPONSE_THRESHOLD)
        .length,
      band: bandOf(mean),
      is_auxiliary: SCHEMA_MAP[code].is_auxiliary,
    };
  });

  scores.sort(
    (a, b) =>
      b.mean - a.mean ||
      b.high_response_count - a.high_response_count ||
      a.code.localeCompare(b.code),
  );
  return scores;
}

/** 도식의 4문항 응답값 추출. 누락 문항은 오류(전수 응답이 전제). */
function itemValuesOf(partA: PartAAnswers, code: SchemaCode): number[] {
  const values: number[] = [];
  for (let i = 1; i <= ITEMS_PER_SCHEMA; i++) {
    const itemId = `${code}_${i}`;
    const v = partA[itemId];
    if (v == null) {
      throw new Error(`Part A 응답 누락: ${itemId}`);
    }
    values.push(v);
  }
  return values;
}

/** SchemaScore → 리포트용 ChildTypeRef 변환 (매핑 대상 도식만). */
function toChildRef(score: SchemaScore): ChildTypeRef {
  const entry = SCHEMA_MAP[score.code];
  if (!entry.child_id || !entry.child_name) {
    throw new Error(`보조 지표는 유형 판정 대상이 아님: ${score.code}`);
  }
  return {
    child_id: entry.child_id,
    child_name: entry.child_name,
    schema_code: score.code,
    schema_name: entry.schema_name,
    area: entry.area,
    mean: score.mean,
  };
}

/**
 * §3-2 — 내면 아이 유형 판정.
 * 매핑 대상 16도식만 대상. 동률: mean 같으면 high_response_count 큰 쪽 우선,
 * 그래도 같으면 공동 대표(co_primary) 표기 (상담사가 세션에서 확정).
 */
export function selectChildTypes(schemaScores: SchemaScore[]): {
  primary: ChildTypeRef;
  secondary: ChildTypeRef[];
  coPrimary?: ChildTypeRef[];
} {
  // schemaScores 는 이미 mean → high_response_count → 코드순으로 정렬됨.
  const mapped = schemaScores.filter((s) =>
    MAPPED_CODES.includes(s.code),
  );

  const top = mapped[0];
  // 1위와 mean·high_response_count 완전 동률인 그룹 → 공동 대표.
  const tiedGroup = mapped.filter(
    (s) =>
      s.mean === top.mean && s.high_response_count === top.high_response_count,
  );

  if (tiedGroup.length > 1) {
    const coPrimary = tiedGroup.map(toChildRef);
    const rest = mapped.slice(tiedGroup.length, tiedGroup.length + 2);
    return {
      primary: coPrimary[0],
      secondary: rest.map(toChildRef),
      coPrimary,
    };
  }

  return {
    primary: toChildRef(mapped[0]),
    secondary: mapped.slice(1, 3).map(toChildRef),
  };
}

/** Part B 지킴이 판정 — 최다 선택, 동률(a/b/c 각 1개) 시 P1 응답 우선 (§2-2). */
export function resolveGuardian(partB: PartBAnswers): {
  type: GuardianType;
  label: string;
  answers: GuardianType[];
} {
  const answers = PART_B_QUESTIONS.map((q) => partB[q.item_id]);
  const tally = new Map<GuardianType, number>();
  for (const a of answers) tally.set(a, (tally.get(a) ?? 0) + 1);

  const top = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const type: GuardianType =
    top.length > 0 && top[0][1] >= 2
      ? top[0][0]
      : partB[PART_B_TIEBREAK_ITEM_ID]; // 전부 상이 → P1 우선

  return { type, label: GUARDIAN_LABELS[type], answers };
}

/** §3-3 — 보조 지표(S15·S18) 자동 노트 생성. */
export function buildAutoNotes(
  schemaScores: SchemaScore[],
  guardianType: GuardianType,
): AutoNote[] {
  const notes: AutoNote[] = [];
  const byCode = new Map(schemaScores.map((s) => [s.code, s]));
  const s15 = byCode.get("S15")!;
  const s18 = byCode.get("S18")!;

  // 매핑 대상 16도식 순위에서 S13 이 상위 3위 안인지 (schemaScores 정렬 순서 사용).
  const mappedRanking = schemaScores
    .filter((s) => MAPPED_CODES.includes(s.code))
    .map((s) => s.code);
  const s13InTop3 = mappedRanking.slice(0, 3).includes("S13");

  // 노트 A: S18(처벌) mean≥4.50 & S13(엄격한 기준) 상위 3위 안
  if (s18.mean >= AUX_NOTE_THRESHOLD && s13InTop3) {
    notes.push({ code: "punitive_whip", text: AUTO_NOTE_TEXTS.punitive_whip });
  }
  // 노트 B: S15(자기통제) mean≥4.50
  if (s15.mean >= AUX_NOTE_THRESHOLD) {
    notes.push({ code: "self_control", text: AUTO_NOTE_TEXTS.self_control });
  }
  // 노트 C: S18≥4.50 & 지킴이=overcompensation
  if (s18.mean >= AUX_NOTE_THRESHOLD && guardianType === "overcompensation") {
    notes.push({
      code: "outward_punitive",
      text: AUTO_NOTE_TEXTS.outward_punitive,
    });
  }
  return notes;
}

/** §3-5 — 응답 품질 플래그. 변산 0 또는 Part A 소요 <3분. */
export function detectQualityFlag(
  partA: PartAAnswers,
  timings?: IntakeScoreInput["timings"],
): "straight_lining_suspected" | null {
  // 전 문항 동일 응답 (변산 0)
  const values = Object.values(partA);
  const allSame = values.length > 0 && values.every((v) => v === values[0]);
  if (allSame) return "straight_lining_suspected";

  // Part A 소요 시간 < 3분 (타이밍이 있을 때만 판정)
  if (timings?.a_started_at && timings?.a_submitted_at) {
    const started = Date.parse(timings.a_started_at);
    const submitted = Date.parse(timings.a_submitted_at);
    if (
      Number.isFinite(started) &&
      Number.isFinite(submitted) &&
      submitted - started >= 0 &&
      submitted - started < MIN_PART_A_DURATION_MS
    ) {
      return "straight_lining_suspected";
    }
  }
  return null;
}

/** §3-4 — SCT 위기 신호 탐지 (문항별 매칭 원문 포함). */
export function detectCrisisFromPartC(partC: PartCAnswers): {
  flag: boolean;
  hits: { item: "C1" | "C2" | "C3" | "C4" | "C5"; text: string }[];
} {
  const items = PART_C_QUESTIONS.map((q) => q.item_id);
  const { flag, hits } = detectCrisis(items.map((id) => partC[id]));
  return {
    flag,
    hits: hits.map((h) => ({ item: items[h.index], text: h.text })),
  };
}

/** 전체 채점 — 제출 응답으로 상담사 리포트 입력(ScoreResult)을 생성한다. */
export function computeScore(input: IntakeScoreInput): ScoreResult {
  const schemaScores = scoreSchemas(input.partA);
  const { primary, secondary, coPrimary } = selectChildTypes(schemaScores);
  const guardian = resolveGuardian(input.partB);
  const autoNotes = buildAutoNotes(schemaScores, guardian.type);
  const crisis = detectCrisisFromPartC(input.partC);
  const qualityFlag = detectQualityFlag(input.partA, input.timings);

  // §3-2-5: 전 도식 mean < 3.50 → 저활성 프로파일 플래그.
  const lowElevation = schemaScores.every(
    (s) => s.mean < BAND_MEDIUM_THRESHOLD,
  );

  const result: ScoreResult = {
    test_version: "intake_v1",
    crisis_flag: crisis.flag,
    quality_flag: qualityFlag,
    low_elevation_profile: lowElevation,
    schema_scores: schemaScores,
    primary_child: primary,
    secondary_children: secondary,
    guardian,
    auto_notes: autoNotes,
  };
  if (crisis.flag) result.crisis_hits = crisis.hits;
  if (coPrimary) result.co_primary = coPrimary;
  return result;
}
