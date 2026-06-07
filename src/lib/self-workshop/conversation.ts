/**
 * IFS 상담사형 적응형 대화의 transcript 데이터 모델 + 순수 헬퍼.
 *
 * 클라이언트(WorkshopConversation)와 서버(explore-followup/explore-extract)가
 * 같은 타입을 공유하도록 React/서버 의존 없는 순수 TS로 유지한다.
 *
 * 저장 위치: 각 단계의 기존 JSONB 컬럼 안에 `dialogue` 키로 중첩
 * (mechanism_analysis.dialogue, core_belief_excavation.dialogue 등).
 * → save-progress whitelist·deriveExpectedMinStep 변경 불필요.
 */

export type StepKey =
  // legacy CBT 흐름 (2026-05-29 작업) — 호환성 유지
  | "mechanism"
  | "core_belief"
  | "new_belief"
  | "belief_evidence"
  // IFS 재설계 (2026-05-31) — 새 워크북의 기본 흐름
  | "parts_discovery" // Step 3 — IFS 활동지2 부분 발견
  | "schema_inquiry" // Step 4 — 18 도식 5 도메인 반응형 대화
  | "parts_integration"; // Step 6·7·8 — 관리자·긍정 의도·역할 통찰

/** 대화를 앵커하는 핵심 질문(탐색 지점). 단계별로 하드코딩해 주입한다. */
export interface ExplorePoint {
  /** 안정적 slug. 구조화 필드 매핑 키로도 쓰임 (예: "situation", "self_value"). */
  id: string;
  /** 폴백 시작 질문 / 첫 주제(이전 답 없음)용 정적 질문. */
  opening: string;
  /**
   * LLM이 "다음 시작 질문"을 동적으로 생성할 때 참조하는 주제 가이드
   * (예: "이 순간에 올라온 감정·신체 반응"). 미지정이면 동적 생성 없이
   * opening을 그대로 사용한다. 보통 두 번째 주제부터 지정.
   */
  topic?: string;
  /** 이 길이 미만이면 "확실히 얕음" — 후속질문 호출의 힌트. */
  minChars?: number;
  /** optional 지점은 빈 답이어도 후속질문 없이 넘어갈 수 있음. */
  optional?: boolean;
  /**
   * 이 지점에서 허용하는 최대 후속질문("한 걸음 더") 횟수.
   * 미지정이면 MAX_FOLLOWUP_TURN_INDEX(2). 0이면 후속 없이 바로 다음 지점으로.
   */
  maxFollowups?: number;
}

export interface ConversationTurn {
  explore_point_id: string;
  /** 0 = 오프닝 질문, 1·2 = 후속질문. MAX_FOLLOWUP_TURN_INDEX에서 캡. */
  turn_index: number;
  /** 이 턴에 던진 질문(오프닝 또는 후속질문 텍스트). */
  question: string;
  /** 이 질문에 대한 사용자 답. */
  answer: string;
  was_followup: boolean;
  /** 서버의 충실도 판정(API를 건너뛰었으면 undefined). */
  sufficient?: boolean;
  asked_at: string;
}

export interface ConversationTranscript {
  version: 1;
  step_key: StepKey;
  turns: ConversationTurn[];
  completed: boolean;
  updated_at: string;
}

/**
 * turn_index 0,1,2 → 한 탐색 지점당 최대 3턴(오프닝 + 후속 2회).
 * turn_index가 이 값에 도달하면 클라이언트는 더 호출하지 않고,
 * 서버도 방어적으로 단락(sufficient:true)한다.
 */
export const MAX_FOLLOWUP_TURN_INDEX = 2;

export function emptyTranscript(stepKey: StepKey): ConversationTranscript {
  return {
    version: 1,
    step_key: stepKey,
    turns: [],
    completed: false,
    updated_at: new Date().toISOString(),
  };
}

/** 한 탐색 지점의 턴들을 turn_index 오름차순으로. */
export function turnsForPoint(
  t: ConversationTranscript,
  pointId: string
): ConversationTurn[] {
  return t.turns
    .filter((turn) => turn.explore_point_id === pointId)
    .sort((a, b) => a.turn_index - b.turn_index);
}

/** 한 탐색 지점에서 사용자가 마지막으로 적은 답. */
export function latestAnswerForPoint(
  t: ConversationTranscript,
  pointId: string
): string {
  const turns = turnsForPoint(t, pointId);
  return turns.length ? turns[turns.length - 1].answer : "";
}

/**
 * 질문 텍스트의 토큰을 이전 답으로 치환한다.
 * tokens: { 토큰문자열 → 그 답을 가져올 explore_point_id }.
 * 예: { "{이름}": "name_part", "{대사}": "part_dialogue" }.
 * 해당 답이 비어 있으면 "그 마음"으로 폴백.
 * (Step 3에서 #3 이름·#4 대사를 이후 질문에 끼워넣는 데 사용.)
 */
export function substituteAnswerTokens(
  text: string,
  t: ConversationTranscript,
  tokens: Record<string, string>
): string {
  let out = text;
  for (const [token, pointId] of Object.entries(tokens)) {
    if (!out.includes(token)) continue;
    const val = latestAnswerForPoint(t, pointId).trim();
    out = out.replaceAll(token, val || "그 마음");
  }
  return out;
}

/** 해당 지점의 최대 turn_index가 캡에 도달했는지 (더 후속질문 금지). */
export function isPointCapped(
  t: ConversationTranscript,
  pointId: string
): boolean {
  const turns = turnsForPoint(t, pointId);
  if (!turns.length) return false;
  return turns[turns.length - 1].turn_index >= MAX_FOLLOWUP_TURN_INDEX;
}

/**
 * followup API에 보낼 "최소 컨텍스트" — 같은 탐색 지점의 최근 n턴만.
 * 전체 transcript를 재전송하지 않아 토큰을 절약한다.
 */
export function compactRecentContext(
  t: ConversationTranscript,
  pointId: string,
  n = 2
): string {
  const recent = turnsForPoint(t, pointId).slice(-n);
  return recent
    .map((turn) => `Q: ${turn.question}\nA: ${turn.answer}`)
    .join("\n");
}

/**
 * 탐색 지점별 결합 답변 맵 — 구조화 추출(explore-extract)의 입력.
 * 한 지점에서 여러 턴이 오갔으면 답을 줄바꿈으로 이어붙인다.
 */
export function pointAnswersMap(
  t: ConversationTranscript
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const turn of t.turns) {
    const answer = turn.answer.trim();
    if (!answer) continue;
    out[turn.explore_point_id] = out[turn.explore_point_id]
      ? `${out[turn.explore_point_id]}\n${answer}`
      : answer;
  }
  return out;
}

/** 답이 있는(=비어있지 않은) 탐색 지점 수. 진행 가능 임계치 비교용. */
export function answeredPointCount(t: ConversationTranscript): number {
  return Object.keys(pointAnswersMap(t)).length;
}

/* ─────────────────── Step 종료 리캡 ─────────────────── */

/**
 * 한 step 완료 후 사용자에게 되돌려주는 통찰 카드 데이터.
 * step-recap API의 응답 형식이자, 각 단계 JSONB 컬럼의 `dialogue_recap` 키로 캐싱된다.
 * Step 5·9·10 LLM/표시 컴포넌트가 이 캐시를 참조해 통찰 띠를 그린다.
 */
export interface RecapCard {
  headline: string;
  body: string;
}

/* ─── 시각화 카드 데이터 (2026-06-03 추가) ───
 *
 * Step 종료 done 화면을 narrative + 카드 2장에서 시각화 인포그래픽 3카드로
 * 교체. step-recap LLM이 transcript에서 직접 추출하며, 각 카드는 옛 사용자
 * 호환을 위해 모두 optional. UI는 빠진 필드를 폴백 처리.
 */

/** 카드 1 — 표면 · 그때 든 생각 (WHAT IT FELT LIKE) */
export interface SurfaceCardData {
  /**
   * 사용자가 답한 그 *상황*을 한 문장으로 짚어주는 리마인드. "그때"가 어떤
   * 순간이었는지 카드 맨 위에서 다시 떠올리게 한다. 예: "마감을 앞두고 매출이
   * 안 나오던 그 밤" — 없으면 빈 문자열.
   */
  situation: string;
  /** 자동으로 떠오른 생각 한 문장 (원문 인용). 예: "큰일났다. 내가 하는 게 틀렸다" */
  thought: string;
  /** 몸의 신호 — 헤드라인(예: "목이 조이는 느낌") + 짧은 묘사. */
  body_signal: { headline: string; description: string };
  /** 내면의 목소리 — 짧은 칩 라벨들. 3~5개, 각 10자 내외. */
  inner_voices: string[];
  /** 올라온 감정 — 라벨 + 0~100 강도. 1~3개. */
  emotions: Array<{ label: string; intensity: number }>;
  /**
   * 카드 하단 상담사 코멘트. "이런 상황에서 이런 마음이 들었고…" 톤으로
   * 표면을 따뜻하게 비춰주는 2~3문장. 없으면 빈 문자열.
   */
  counselor_comment: string;
}

/** 카드 2 — 진심 · 사실, 그 마음이 바란 것 (WHAT WAS TRUE) */
export interface TruthCardData {
  /** 01 진짜 바란 모습 — 인용 한 문장 + 풀어쓴 본문. */
  true_wish: { quote: string; body: string };
  /** 02 그 마음의 이유 — 키워드 칩 2~3개 + 인라인 본문. */
  reason: { keywords: string[]; body: string };
  /** 03 그리고 그 덕분에 — 한 줄. */
  thanks_to: string;
  /**
   * 카드 하단(진심 도식 아래) 상담사 코멘트. 그 마음의 긍정 의도를 인정해주는
   * 2~3문장. 없으면 빈 문자열.
   */
  counselor_comment: string;
}

/**
 * 마음 프로필 (Step 3 parts_discovery 전용, 2026-06-06 추가).
 * done 화면 맨 위 임상 내러티브 카드. "이 마음이 무엇이고·왜 생겼고·어떤
 * 상황에·어떤 역할로 발현되며·어떤 자동사고를 만드는지"를 정확히 짚는다.
 * 모두 optional 컨테이너 안에 들어가며, 누락 시 카드 자체를 숨긴다.
 */
export interface PartProfileData {
  /** #3 name_part — 사용자가 붙인 마음 이름 (그대로). 예: "다그치는 나" */
  name: string;
  /** #6 origin — 언제·왜 생겼는지(계기). 가설형. */
  origin: string;
  /** #1 situation 요약 — 어떤 상황에 발현되는가. */
  trigger_situation: string;
  /** #2/#5 추론 — 무엇을 하려고(어떤 역할로) 발현되는가. */
  role: string;
  /** #4 part_dialogue — 만들어내는 자동사고(대사 원문 인용 우선). */
  automatic_thought: string;
  /** #7 self_compassion — 소중한 사람에게 해주고 싶은 말. */
  self_compassion: string;
  /** 위를 잇는 임상 한 문단. UI 본문에 그대로 표시. */
  narrative: string;
}

/** 카드 3 — CORE WISH (다크 배너) */
export interface CoreWishData {
  /** 결국 이 모든 마음의 가장 깊은 곳 — 1~2문장. 각 30자 이내. */
  text: string;
  /** "VOL · 01" 같은 메타. 없으면 우측 영역 숨김. */
  vol_label?: string;
  /**
   * 배너 아래에 풀어쓴 친절한 설명. "결국 마음 깊은 곳엔 이런 마음이 있어요.
   * 이 마음은 다음 단계에서 함께 알아봐요" 톤의 2~3문장. 없으면 숨김.
   */
  comment?: string;
}

export interface StepRecap {
  /**
   * @deprecated 2026-06-03 시각화 3카드 도입으로 UI에서 표시 안 함.
   * 옛 사용자 dialogue_recap 호환을 위해 타입은 유지.
   */
  narrative?: string;
  /** @deprecated 2026-06-03. 옛 데이터 호환만. */
  motive: RecapCard;
  /** @deprecated 2026-06-03. 옛 데이터 호환만. */
  emotion: RecapCard;
  /** @deprecated 2026-06-03. 옛 데이터 호환만. */
  closing_line: string;
  /* 신규 시각화 필드 (2026-06-03) — 모두 optional, 누락 시 카드별 폴백. */
  surface_card?: SurfaceCardData;
  truth_card?: TruthCardData;
  core_wish?: CoreWishData;
  /** 마음 프로필 (Step 3 전용, 2026-06-06). 누락 시 카드 숨김. */
  part_profile?: PartProfileData;
  /** 4단계로 자연스럽게 잇는 한 줄. 예: "다음 단계에서는 ~한 패턴을 함께 살펴볼 거예요." */
  next_step_bridge?: string;
}

/** JSONB 컨테이너에서 dialogue_recap을 안전하게 읽는다. 형식이 안 맞으면 undefined. */
export function readDialogueRecap(container: unknown): StepRecap | undefined {
  if (!container || typeof container !== "object") return undefined;
  const r = (container as { dialogue_recap?: unknown }).dialogue_recap;
  if (!r || typeof r !== "object") return undefined;
  const o = r as {
    narrative?: unknown;
    motive?: unknown;
    emotion?: unknown;
    closing_line?: unknown;
    surface_card?: unknown;
    truth_card?: unknown;
    core_wish?: unknown;
    part_profile?: unknown;
    next_step_bridge?: unknown;
  };
  return {
    narrative: typeof o.narrative === "string" ? o.narrative : "",
    motive: readCard(o.motive),
    emotion: readCard(o.emotion),
    closing_line: typeof o.closing_line === "string" ? o.closing_line : "",
    surface_card: readSurfaceCard(o.surface_card),
    truth_card: readTruthCard(o.truth_card),
    core_wish: readCoreWish(o.core_wish),
    part_profile: readPartProfile(o.part_profile),
    next_step_bridge:
      typeof o.next_step_bridge === "string" ? o.next_step_bridge : undefined,
  };
}

function readPartProfile(v: unknown): PartProfileData | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as {
    name?: unknown;
    origin?: unknown;
    trigger_situation?: unknown;
    role?: unknown;
    automatic_thought?: unknown;
    self_compassion?: unknown;
    narrative?: unknown;
  };
  const str = (x: unknown) => (typeof x === "string" ? x : "");
  const name = str(o.name);
  const narrative = str(o.narrative);
  // 이름이나 내러티브가 둘 다 없으면 의미 없는 프로필 → 숨김.
  if (!name && !narrative) return undefined;
  return {
    name,
    origin: str(o.origin),
    trigger_situation: str(o.trigger_situation),
    role: str(o.role),
    automatic_thought: str(o.automatic_thought),
    self_compassion: str(o.self_compassion),
    narrative,
  };
}

function readSurfaceCard(v: unknown): SurfaceCardData | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as {
    situation?: unknown;
    thought?: unknown;
    body_signal?: unknown;
    inner_voices?: unknown;
    emotions?: unknown;
    counselor_comment?: unknown;
  };
  const situation = typeof o.situation === "string" ? o.situation : "";
  const thought = typeof o.thought === "string" ? o.thought : "";
  const body_signal = readBodySignal(o.body_signal);
  const inner_voices = Array.isArray(o.inner_voices)
    ? o.inner_voices.filter((x): x is string => typeof x === "string")
    : [];
  const emotions = Array.isArray(o.emotions)
    ? o.emotions
        .map((e) => {
          if (!e || typeof e !== "object") return null;
          const ee = e as { label?: unknown; intensity?: unknown };
          const label = typeof ee.label === "string" ? ee.label : "";
          const intensity =
            typeof ee.intensity === "number"
              ? Math.max(0, Math.min(100, ee.intensity))
              : 50;
          return label ? { label, intensity } : null;
        })
        .filter((x): x is { label: string; intensity: number } => x !== null)
    : [];
  const counselor_comment =
    typeof o.counselor_comment === "string" ? o.counselor_comment : "";
  // 의미 있는 데이터가 하나도 없으면 undefined.
  if (
    !thought &&
    !body_signal.headline &&
    inner_voices.length === 0 &&
    emotions.length === 0
  ) {
    return undefined;
  }
  return { situation, thought, body_signal, inner_voices, emotions, counselor_comment };
}

function readBodySignal(v: unknown): { headline: string; description: string } {
  if (!v || typeof v !== "object") return { headline: "", description: "" };
  const o = v as { headline?: unknown; description?: unknown };
  return {
    headline: typeof o.headline === "string" ? o.headline : "",
    description: typeof o.description === "string" ? o.description : "",
  };
}

function readTruthCard(v: unknown): TruthCardData | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as {
    true_wish?: unknown;
    reason?: unknown;
    thanks_to?: unknown;
    counselor_comment?: unknown;
  };
  const true_wish = readQuoteBody(o.true_wish);
  const reason = readReason(o.reason);
  const thanks_to = typeof o.thanks_to === "string" ? o.thanks_to : "";
  const counselor_comment =
    typeof o.counselor_comment === "string" ? o.counselor_comment : "";
  if (!true_wish.quote && !true_wish.body && reason.keywords.length === 0 && !thanks_to) {
    return undefined;
  }
  return { true_wish, reason, thanks_to, counselor_comment };
}

function readQuoteBody(v: unknown): { quote: string; body: string } {
  if (!v || typeof v !== "object") return { quote: "", body: "" };
  const o = v as { quote?: unknown; body?: unknown };
  return {
    quote: typeof o.quote === "string" ? o.quote : "",
    body: typeof o.body === "string" ? o.body : "",
  };
}

function readReason(v: unknown): { keywords: string[]; body: string } {
  if (!v || typeof v !== "object") return { keywords: [], body: "" };
  const o = v as { keywords?: unknown; body?: unknown };
  const keywords = Array.isArray(o.keywords)
    ? o.keywords.filter((x): x is string => typeof x === "string")
    : [];
  return {
    keywords,
    body: typeof o.body === "string" ? o.body : "",
  };
}

function readCoreWish(v: unknown): CoreWishData | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as { text?: unknown; vol_label?: unknown; comment?: unknown };
  const text = typeof o.text === "string" ? o.text : "";
  if (!text) return undefined;
  return {
    text,
    vol_label: typeof o.vol_label === "string" ? o.vol_label : undefined,
    comment:
      typeof o.comment === "string" && o.comment.trim()
        ? o.comment
        : undefined,
  };
}

function readCard(v: unknown): RecapCard {
  if (!v || typeof v !== "object") return { headline: "", body: "" };
  const o = v as { headline?: unknown; body?: unknown };
  return {
    headline: typeof o.headline === "string" ? o.headline : "",
    body: typeof o.body === "string" ? o.body : "",
  };
}

/**
 * JSONB 컬럼 값(예: mechanism_analysis, core_belief_excavation)에 중첩된
 * `dialogue`를 안전하게 읽는다. 형식이 안 맞으면 undefined.
 */
export function readDialogue(
  container: unknown
): ConversationTranscript | undefined {
  if (!container || typeof container !== "object") return undefined;
  const d = (container as { dialogue?: unknown }).dialogue;
  if (
    d &&
    typeof d === "object" &&
    (d as ConversationTranscript).version === 1 &&
    Array.isArray((d as ConversationTranscript).turns)
  ) {
    return d as ConversationTranscript;
  }
  return undefined;
}
