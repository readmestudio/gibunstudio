/**
 * SOLUTION · 1단계: 새 핵심 신념 찾기
 *
 * 같은 상황(FIND_OUT 1의 recent_situation)을 다시 제시하고,
 * 옛 핵심 믿음(자기·타인·세계 3축) 각각에 대해
 *   1) 옛 신념 강도 가늠 → 2) 옛 결과 예측 →
 *   3) 균형잡힌 새 신념 다중 선택 → 4) 새 강도 가늠 → 5) 새 결과 예측
 * 의 6스텝 흐름을 한 신념씩 진행한다.
 */

export type CoreBeliefSource = "self" | "others" | "world";

export interface BeliefOptionPick {
  /** 후보 인덱스(0..n-1) 또는 'custom' */
  key: number | "custom";
}

export interface BeliefAnswer {
  /** 어떤 축의 신념인지 */
  source: CoreBeliefSource;
  /** 분류 라벨(한국어) — 화면 표기 */
  classification: string;
  /** 분류 라벨(영문) — 모노 메타 */
  classification_en: string;
  /** 옛 핵심 신념 본문(작성 시점 스냅샷) */
  text: string;
  /**
   * SITUATION으로 표기되는 가상 시나리오. AI가 "이 신념이 가장 강하게
   * 작동해 괴로워질 만한 일상 장면"으로 생성. 사용자의 실제 사례가 아님.
   */
  situation: string;
  /** 옛 신념대로 행동했을 때의 결과 예시 — step 2 textarea placeholder */
  old_outcome_hint: string;
  /** 새 신념대로 행동했을 때의 결과 예시 — step 5 textarea placeholder */
  new_outcome_hint: string;

  /** AI가 생성한 균형잡힌 새 신념 후보 3개(본문) */
  options: string[];

  /** 옛 신념을 지금 얼마나 믿는가(0~100) */
  old_strength: number | null;
  /** 옛 신념대로 행동했을 때의 예상 결과 */
  old_outcome: string;
  /** 고른 새 신념들 (인덱스 또는 'custom') */
  chosen_options: Array<number | "custom">;
  /** custom 선택 시 직접 입력 본문 */
  custom_option: string;
  /** 고른 새 신념별 강도 — key는 String(index) 또는 "custom" */
  new_strengths: Record<string, number>;
  /** 같은 상황에서 새 신념대로 행동했을 때의 예상 결과 */
  new_outcome: string;
  /** 이 신념의 흐름이 끝났는지 */
  done: boolean;
}

export interface NewBeliefData {
  /** 신념별 답변(자기/타인/세계 순) */
  beliefs: BeliefAnswer[];
  /** 진행 단계 */
  phase: "intro" | "qa" | "allDone";
  /** Q&A 중인 신념 인덱스 (0..beliefs.length-1) */
  current_idx: number;

  /* ── 다운스트림(generate-summary 등) 호환용 derived 필드 ── */
  /** 모든 고른 새 신념을 줄바꿈으로 합친 본문 */
  new_core_belief: string;
  /** 모든 신념의 새 결과(why_this_works 자리)를 합친 본문 */
  why_this_works: string;

  /* ── 레거시 보존(이전 단일 신념 데이터에서 마이그레이션 시 채움) ── */
  /** 단일 신념 시절의 옛 상황 스냅샷 */
  legacy_situation?: string;
  /** 단일 신념 시절의 옛 신념 스냅샷 */
  legacy_old_belief_snapshot?: string;
  /** 단일 신념 시절의 reframe 힌트 스냅샷 */
  legacy_reframe_invitation?: string;
  /** 단일 신념 시절의 AI 후보 */
  legacy_ai_candidates?: string[];
}

export const EMPTY_NEW_BELIEF: NewBeliefData = {
  beliefs: [],
  phase: "intro",
  current_idx: 0,
  new_core_belief: "",
  why_this_works: "",
};

/**
 * 모든 신념의 흐름이 끝났을 때(allDone) true.
 * 다음 단계 진입 게이트로 사용.
 */
export function isNewBeliefMinimallyComplete(
  data: Partial<NewBeliefData> | undefined
): boolean {
  if (!data) return false;
  if (data.phase === "allDone") return true;
  // 호환: 레거시 단일 신념 데이터로 진입한 경우
  return (data.new_core_belief ?? "").trim().length > 0;
}

/**
 * BeliefAnswer 한 개의 6스텝이 모두 끝났는지(=Final 진입 가능 여부).
 * 컴포넌트 안에서도 같은 식을 쓰지만 외부 통계용으로 노출.
 */
export function isBeliefAnswerComplete(a: BeliefAnswer): boolean {
  if (a.old_strength == null) return false;
  if ((a.old_outcome || "").trim().length <= 4) return false;
  const chosen = a.chosen_options || [];
  if (chosen.length === 0) return false;
  if (chosen.includes("custom") && (a.custom_option || "").trim().length <= 3)
    return false;
  const allStr = chosen.every(
    (k) => a.new_strengths?.[String(k)] != null
  );
  if (!allStr) return false;
  if ((a.new_outcome || "").trim().length <= 4) return false;
  return true;
}

/**
 * 고른 새 신념들의 표시 본문(인덱스 기준 또는 custom 본문)을 합친 한 줄.
 * 다운스트림 요약/리포트가 사용.
 */
export function joinChosenBeliefTexts(a: BeliefAnswer): string {
  const items = (a.chosen_options || [])
    .map((k) => (k === "custom" ? a.custom_option : a.options[k]))
    .filter((s): s is string => !!s && s.trim().length > 0);
  return items.join("\n");
}

/** 모든 신념을 합쳐 generate-summary가 읽는 derived 필드 두 개를 만든다. */
export function deriveLegacySummaryFields(beliefs: BeliefAnswer[]): {
  new_core_belief: string;
  why_this_works: string;
} {
  const lines: string[] = [];
  const reasonLines: string[] = [];
  for (const b of beliefs) {
    const chosenText = joinChosenBeliefTexts(b);
    if (chosenText) {
      lines.push(`[${b.classification}] ${chosenText.replace(/\n/g, " / ")}`);
    }
    if ((b.new_outcome || "").trim().length > 0) {
      reasonLines.push(`[${b.classification}] ${b.new_outcome.trim()}`);
    }
  }
  return {
    new_core_belief: lines.join("\n"),
    why_this_works: reasonLines.join("\n\n"),
  };
}
