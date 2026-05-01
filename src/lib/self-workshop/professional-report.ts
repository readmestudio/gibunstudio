/**
 * SUMMARY · 1단계: 전문 상담사 리포트
 *
 * "심리 상담사가 작성한 통합 리포트" 톤.
 * 도입 → 분석 → 변화 여정 → DO & DON'Ts 5+5 구조.
 */

export interface DoDontItem {
  /** 12자 이내 짧은 제목 */
  title: string;
  /** 60~120자 설명 */
  description: string;
}

/**
 * Step 9 BEFORE/AFTER 카드에 표면 노출되는 한 줄 요약.
 * 사용자가 1~8단계에서 적은 raw 답변을 LLM이 30~60자 핵심 한 문장으로 정제.
 * 빈 항목은 "" (빈 문자열) 로 — UI 가 미작성 hint 처리.
 */
export interface BeliefShiftSummary {
  before: {
    /** 옛 핵심 신념 한 줄 — `synthesis.belief_line` 기반 */
    core_belief: string;
    /** 트리거(시작 상황) 한 줄 — `mechanism_analysis.recent_situation` 기반 */
    trigger: string;
    /** 옛 자동사고 한 줄 — `mechanism_analysis.automatic_thought` 기반 */
    old_thought: string;
    /** 옛 행동 패턴 한 줄 — `mechanism_analysis.resulting_behavior` 기반 */
    old_behavior: string;
  };
  after: {
    /** 새 핵심 신념 한 줄 — `new_belief.new_core_belief` 기반 */
    new_core_belief: string;
    /** 대체 사고 한 줄 — `coping_plan.alternative_thought` 의 핵심만 */
    alternative_thought: string;
    /** 새 행동·대처 한 줄 — `coping_plan` 의 행동 카테고리에서 */
    new_behavior: string;
    /** 강화 근거 한 줄 — `coping_plan.evidence_against` / `new_belief.why_this_works` 의 핵심만 */
    reinforcement: string;
  };
}

export interface ProfessionalReport {
  intro: {
    /** 사용자 이름 + 1~2문단 인사 */
    greeting: string;
    /** 진단 점수/레벨/4영역의 임상적 의미를 일상어로 풀어쓴 3~5문장 */
    diagnosis_summary: string;
  };
  analysis: {
    /** 핵심 패턴 한 줄 */
    headline: string;
    /** 자동사고 → 핵심 신념 → 6-Part 사이클 서술 (3~5문단, 사용자 표현 직접 인용) */
    body: string;
    /** 사용자 자동사고/표현 직접 인용 모음 (1~3개) */
    cognitive_error_quotes: string[];
  };
  transformation: {
    /** 변화의 핵심 한 줄 */
    headline: string;
    /** 새 핵심 신념 + 대체 사고 + 실천 계획이 사이클을 어떻게 끊는지 (3~5문단) */
    body: string;
  };
  /** Step 9 BEFORE/AFTER 비교 카드용 한 줄 요약 — 캐시 백워드 호환 위해 Optional. */
  belief_shift_summary?: BeliefShiftSummary;
  do_donts: {
    /** 새 핵심 신념과 일관된 행동 — 정확히 5개 */
    dos: DoDontItem[];
    /** 옛 핵심 신념을 강화하는 행동 — 정확히 5개 */
    donts: DoDontItem[];
  };
  /**
   * 새 핵심 신념을 1인칭 확언으로 풀어낸 짧은 문장 — 정확히 10개.
   * 사용자가 캡쳐해서 한 달 동안 자주 꺼내 보는 용도.
   * 각 30자 이내(한국어), 따뜻하고 일상적인 톤.
   */
  affirmations: string[];
  generated_at: string;
}

/* ─────────────── 타입 가드 ─────────────── */

function isString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isDoDontItem(v: unknown): v is DoDontItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Partial<DoDontItem>;
  return isString(o.title) && isString(o.description);
}

export function isProfessionalReport(v: unknown): v is ProfessionalReport {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Partial<ProfessionalReport>;

  if (!r.intro || typeof r.intro !== "object") return false;
  if (!isString(r.intro.greeting)) return false;
  if (!isString(r.intro.diagnosis_summary)) return false;

  if (!r.analysis || typeof r.analysis !== "object") return false;
  if (!isString(r.analysis.headline)) return false;
  if (!isString(r.analysis.body)) return false;
  if (!Array.isArray(r.analysis.cognitive_error_quotes)) return false;

  if (!r.transformation || typeof r.transformation !== "object") return false;
  if (!isString(r.transformation.headline)) return false;
  if (!isString(r.transformation.body)) return false;

  if (!r.do_donts || typeof r.do_donts !== "object") return false;
  if (!Array.isArray(r.do_donts.dos) || r.do_donts.dos.length !== 5) {
    return false;
  }
  if (!Array.isArray(r.do_donts.donts) || r.do_donts.donts.length !== 5) {
    return false;
  }
  for (const item of r.do_donts.dos) if (!isDoDontItem(item)) return false;
  for (const item of r.do_donts.donts) if (!isDoDontItem(item)) return false;

  // 확언 10개 검증.
  // 길이 한계는 40자(=30자 가이드 + 어미 변주 여유)까지 허용해
  // LLM이 한 두 글자 넘긴 문장을 통째로 무효화시키지 않도록 한다.
  if (!Array.isArray(r.affirmations) || r.affirmations.length !== 10) return false;
  for (const a of r.affirmations) {
    if (!isString(a)) return false;
    if (a.length > 40) return false;
  }

  if (!isString(r.generated_at)) return false;

  return true;
}

/**
 * 옛 ProfessionalReport (belief_shift_summary 부재) 캐시는 무효 처리해서
 * 새 요약 필드를 가진 리포트로 재생성하도록 한다. 이미 캐시가 있더라도
 * 한 번은 LLM 재호출이 필요 — Step 9에 들어올 때 1회만 발생하므로 부담 작음.
 */
export function hasBeliefShiftSummary(report: ProfessionalReport): boolean {
  const s = report.belief_shift_summary;
  if (!s || typeof s !== "object") return false;
  if (!s.before || !s.after) return false;
  // 핵심 신념 한 쌍만 채워져 있어도 valid 로 본다 — 사용자가 일부 단계를
  // 비웠어도 나머지 항목은 빈 문자열로 받기 때문.
  return (
    typeof s.before.core_belief === "string" &&
    typeof s.after.new_core_belief === "string"
  );
}

/* ─────────────── BeforeAfterSnapshot ─────────────── */

/**
 * Step 9 정리 화면에서 보여줄 BEFORE(옛 회로) / AFTER(새 회로) 묶음.
 * workshop_progress 의 JSONB 컬럼을 가공 없이 (LLM 재요약 없이) 추출한다.
 * 사용자가 1~8단계에서 직접 적은 원문이 그대로 카드에 노출되도록.
 */
export interface BeforeAfterSnapshot {
  before: {
    coreBeliefLine: string | null;
    trigger: string | null;
    oldAutoThought: string | null;
    oldBehavior: string | null;
    emotion: { primary: string | null; intensity: number | null; body: string | null };
    worstCase: string | null;
    cognitiveErrors: Array<{ name: string; interpretation: string }>;
    howBeliefWorks: string | null;
    beliefAxes: { self: string | null; others: string | null; world: string | null };
  };
  after: {
    newCoreBelief: string | null;
    alternativeThought: string | null;
    newBehavior: string | null;
    reinforcement: string | null;
    whyNewBeliefWorks: string | null;
    counterEvidences: string[];
    avgReinforcedStrength: number | null;
  };
}

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export function extractBeforeAfterSnapshot(progress: {
  mechanism_analysis?: unknown;
  mechanism_insights?: unknown;
  core_belief_excavation?: unknown;
  belief_destroy?: unknown;
  new_belief?: unknown;
  coping_plan?: unknown;
}): BeforeAfterSnapshot {
  const mech = (progress.mechanism_analysis ?? null) as {
    recent_situation?: unknown;
    automatic_thought?: unknown;
    worst_case_result?: unknown;
    primary_emotion?: unknown;
    emotion_intensity?: unknown;
    emotions_body?: { body_text?: unknown };
    resulting_behavior?: unknown;
  } | null;

  const insights = (progress.mechanism_insights ?? null) as {
    cognitive_errors?: { items?: Array<{ name?: unknown; interpretation?: unknown }> };
  } | null;

  const excavation = (progress.core_belief_excavation ?? null) as {
    synthesis?: { belief_line?: unknown; how_it_works?: unknown };
    belief_analysis?: {
      belief_about_self?: unknown;
      belief_about_others?: unknown;
      belief_about_world?: unknown;
    };
  } | null;

  const beliefDestroy = (progress.belief_destroy ?? null) as {
    belief_verification?: {
      stage_03_evidence?: {
        beliefs?: Array<{ counter?: unknown }>;
        counter?: unknown;
      };
    };
  } | null;

  const newBelief = (progress.new_belief ?? null) as {
    new_core_belief?: unknown;
    why_this_works?: unknown;
  } | null;

  const coping = (progress.coping_plan ?? null) as {
    version?: number;
    alternative_thought?: unknown;
    evidence_against?: unknown;
    entries?: Array<{
      classification?: unknown;
      new_belief_text?: unknown;
      reinforced_strength?: unknown;
    }>;
    cognitive_restructuring?: { alternative_thought?: unknown };
    behavioral_experiment?: { coping_plan?: unknown };
    self_compassion?: { rest_permission?: unknown; boundary_setting?: unknown };
  } | null;

  // ── BEFORE 추출 ─────────────────────────────────────────
  const coreBeliefLine = trimOrNull(excavation?.synthesis?.belief_line);
  const trigger = trimOrNull(mech?.recent_situation);
  const oldAutoThought = trimOrNull(mech?.automatic_thought);
  const oldBehavior = trimOrNull(mech?.resulting_behavior);
  const worstCase = trimOrNull(mech?.worst_case_result);
  const howBeliefWorks = trimOrNull(excavation?.synthesis?.how_it_works);

  const intensityNum =
    typeof mech?.emotion_intensity === "number" && mech.emotion_intensity > 0
      ? mech.emotion_intensity
      : null;

  const emotion = {
    primary: trimOrNull(mech?.primary_emotion),
    intensity: intensityNum,
    body: trimOrNull(mech?.emotions_body?.body_text),
  };

  const cognitiveErrors: Array<{ name: string; interpretation: string }> = (() => {
    const items = insights?.cognitive_errors?.items ?? [];
    return items
      .map((it) => ({
        name: trimOrNull(it?.name) ?? "",
        interpretation: trimOrNull(it?.interpretation) ?? "",
      }))
      .filter((it) => it.name.length > 0);
  })();

  const beliefAxes = {
    self: trimOrNull(excavation?.belief_analysis?.belief_about_self),
    others: trimOrNull(excavation?.belief_analysis?.belief_about_others),
    world: trimOrNull(excavation?.belief_analysis?.belief_about_world),
  };

  // ── AFTER 추출 ─────────────────────────────────────────
  const newCoreBelief = trimOrNull(newBelief?.new_core_belief);
  const whyNewBeliefWorks = trimOrNull(newBelief?.why_this_works);

  // 대체 사고: v2 alternative_thought 우선 → v1 cognitive_restructuring 폴백
  const alternativeThought =
    trimOrNull(coping?.alternative_thought) ??
    trimOrNull(coping?.cognitive_restructuring?.alternative_thought);

  // 새 행동: v1 behavioral_experiment.coping_plan → v1 self_compassion → v2 entries 합본
  const newBehavior =
    trimOrNull(coping?.behavioral_experiment?.coping_plan) ??
    trimOrNull(coping?.self_compassion?.rest_permission) ??
    trimOrNull(coping?.self_compassion?.boundary_setting) ??
    (() => {
      const entries = coping?.entries ?? [];
      const texts = entries
        .map((e) => trimOrNull(e?.new_belief_text))
        .filter((t): t is string => t !== null);
      return texts.length > 0 ? texts.join("\n") : null;
    })();

  // 강화 근거: v2 evidence_against 우선 → why_this_works 폴백
  const reinforcement =
    trimOrNull(coping?.evidence_against) ?? whyNewBeliefWorks;

  // 검증 단계 counter 증거 모음
  const counterEvidences: string[] = (() => {
    const v2 = beliefDestroy?.belief_verification?.stage_03_evidence;
    const perBelief = (v2?.beliefs ?? [])
      .flatMap((b) => (Array.isArray(b?.counter) ? b.counter : []))
      .map((s) => trimOrNull(s))
      .filter((s): s is string => s !== null);
    if (perBelief.length > 0) return perBelief;
    const legacy = Array.isArray(v2?.counter) ? v2.counter : [];
    return legacy
      .map((s) => trimOrNull(s))
      .filter((s): s is string => s !== null);
  })();

  // 새 신념 강화 평균 % (v2)
  const avgReinforcedStrength: number | null = (() => {
    const entries = coping?.entries ?? [];
    const values = entries
      .map((e) => e?.reinforced_strength)
      .filter((v): v is number => typeof v === "number");
    if (values.length === 0) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  })();

  return {
    before: {
      coreBeliefLine,
      trigger,
      oldAutoThought,
      oldBehavior,
      emotion,
      worstCase,
      cognitiveErrors,
      howBeliefWorks,
      beliefAxes,
    },
    after: {
      newCoreBelief,
      alternativeThought,
      newBehavior,
      reinforcement,
      whyNewBeliefWorks,
      counterEvidences,
      avgReinforcedStrength,
    },
  };
}
