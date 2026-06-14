/**
 * Mind Spill — 타입 정의.
 * 단일 워크북 × 10회 모델.
 */

export type BDItem = {
  id: string;
  text: string;
  created_at: string;
};

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export type MindSpillSubscription = {
  id: string;
  user_id: string;
  purchase_id: string | null;
  started_at: string;
  expires_at: string;
  quota_total: number;
  quota_used: number;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
};

export const MIND_SPILL_VALID_DAYS = 180;
export const MIND_SPILL_QUOTA = 10;

/* ========== 워크북 본체 ========== */

export type WeeklyScan = {
  emotions: string[];
  emotion_intensity: number | null;
  /** 감정별 개별 강도 (0~10). 라벨 → 값. 없으면 emotion_intensity 로 폴백. */
  emotion_intensities?: Record<string, number>;
  sleep_avg_hours: number | null;
  sleep_latency_min: number | null;
  sleep_recovery: number | null;
  /** 자다 중간에 깬 횟수. */
  sleep_wake_count?: number | null;
  body_signs: string[];
  energy: number | null;
  focus: number | null;
  motivation: number | null;
};

export type BrainDump = {
  recurring: BDItem[];
  discomfort: BDItem[];
  todos: BDItem[];
};

export type Classification = {
  controllable: string[];     // bd_id[]
  influenceable: string[];
  uncontrollable: string[];
  /**
   * 사실/생각 체크 — bd_id → "fact" | "thought".
   * 통제권 분류 전에 사용자가 먼저 표시. 사실로 표시한 항목만
   * controllable/influenceable/uncontrollable 후보가 된다.
   */
  fact_check?: Record<string, "fact" | "thought">;
};

export type Action = {
  id: string;
  target_bd_id: string | null;
  goal: string;
  first_step: string;
  when: string;
  where: string;
  if_then: string;
  completed: boolean;
};

export type Moment = {
  id: string;
  title: string;
  experience: string;
  /** 사용자가 직접 적는 "좋았던 이유". */
  reason?: string;
  /** LLM 이 좋았던 경험/이유를 보고 짚어준 행동들. 사용자 입력 X. */
  actions: string[];
  /** LLM 이 짚어준 강점들. 사용자 입력 X. */
  strengths: string[];
};

/** Mirror Report (LLM) */
export type MirrorReport = {
  intro: string;
  emotion_clusters: Array<{
    category: string;
    percent: number;
    keywords: string[];
  }>;
  cognitive_distortions: Array<{
    distortion_type: string;
    quoted_text: string;
    frequency: number;
    brief_explanation: string;
    /** 부드러운 톤의 "생각의 전환" 한 줄 (reframe). */
    reframe: string;
  }>;
  body_thought_links: Array<{ body: string; linked_thought: string }>;
};

/**
 * Daily Analysis (LLM) — "오늘 하루 정리하기".
 * 오늘 작성한 체크인을 읽고, 이전 기록이 있으면 그 맥락까지 엮어
 * 변화 · 반복되는 사고 · 희망적인 부분을 짚어준다. mirror_report를 대체.
 */
export type DailyAnalysis = {
  /** 오늘에 대한 따뜻한 도입 2~3문장. */
  intro: string;
  /** 오늘 가장 두드러진 감정·생각 한 줄. */
  today_focus: string;
  /** 이전 기록 대비 달라진 점(변화). 첫 기록이면 빈 배열. */
  changes: string[];
  /** 여러 날에 걸쳐 반복되는 사고/패턴. */
  recurring_themes: string[];
  /** 희망적인 부분 · 강점의 씨앗. */
  hopeful: string[];
  /** 마무리 한 문장. */
  closing: string;
};

/** Strengths Report (LLM) — vii. 단계 상담사 종합 코멘트. */
export type StrengthsReport = {
  /** 종합 줄글 (vii. 끝에 표시). */
  narrative: string;
  /** 핵심 강점 3개 — Closing 04 카드용. */
  top_strengths?: Array<{ name: string; reason: string }>;
  generated_at?: string;
};

/** Coach's Note (LLM) */
export type CoachNote = {
  title: string;
  lede: string;
  intro: string;
  findings: Array<{ num: "i" | "ii" | "iii" | "iv"; text: string }>;
  closing: string;
  /**
   * 심리 상담 연결 — 워크북에서 관찰된 핵심 심리 주제를 50분 상담의 주제로 제안.
   * coach_note jsonb 안에 중첩되므로 별도 마이그레이션 불필요. 옵셔널(구버전 데이터 호환).
   */
  counseling?: {
    /** 워크북을 통해 발견한 심리적 과제 1~2문장. */
    issue: string;
    /** 그 과제를 50분 상담의 주제로 만든 한 줄. */
    topic: string;
    /** "이런 것들을 해결할 수 있어요" — 상담으로 다룰 수 있는 것들 2~4개. */
    outcomes: string[];
  };
};

/** Prescription (LLM) */
export type Prescription = {
  num: "01" | "02" | "03";
  title: string;
  body: string;
  meta: Array<{ key: string; val: string }>;
};

export type WorkbookStep = 1 | 2 | 3;

export type Workbook = {
  id: string;
  user_id: string;
  subscription_id: string;
  volume_no: number;
  week_label: string | null;

  status: "draft" | "completed";
  current_step: WorkbookStep;

  weekly_scan: WeeklyScan;
  brain_dump: BrainDump;
  mirror_report: MirrorReport | null;

  classification: Classification;
  released: string[];
  actions: Action[];
  moments: Moment[];
  /** vii. 강점 발견 — 상담사 종합 코멘트(줄글). LLM 결과 캐싱. */
  strengths_report: StrengthsReport | null;

  coach_note: CoachNote | null;
  prescriptions: Prescription[] | null;

  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type WorkbookPatch = Partial<
  Pick<
    Workbook,
    | "weekly_scan"
    | "brain_dump"
    | "classification"
    | "released"
    | "actions"
    | "moments"
    | "current_step"
    | "status"
    | "week_label"
  >
>;

export const EMPTY_WEEKLY_SCAN: WeeklyScan = {
  emotions: [],
  emotion_intensity: null,
  emotion_intensities: {},
  sleep_avg_hours: null,
  sleep_latency_min: null,
  sleep_recovery: null,
  sleep_wake_count: null,
  body_signs: [],
  energy: null,
  focus: null,
  motivation: null,
};

export const EMPTY_BRAIN_DUMP: BrainDump = {
  recurring: [],
  discomfort: [],
  todos: [],
};

export const EMPTY_CLASSIFICATION: Classification = {
  controllable: [],
  influenceable: [],
  uncontrollable: [],
  fact_check: {},
};

/** 보유 사용권 잔여 등을 함께 들고 다닐 때. */
export type SubscriptionAccess = {
  subscription: MindSpillSubscription;
  remaining: number;
  daysLeft: number;
};

/* ========== 신규: Daily Entry 모델 (캘린더 기반) ========== */

/**
 * 감정/수면/에너지 스캔 — 일자 단위 의미로 재해석.
 * WeeklyScan과 동일한 필드 구조를 사용하지만 "하루의 상태"를 기록.
 */
export type DailyScan = WeeklyScan;

/**
 * 데일리 체크인 엔트리 — 캘린더의 한 칸.
 *   · 사용자 입력 (무료): daily_scan, brain_dump, classification, released, actions, moments.
 *   · LLM 출력 (매일 무료): mirror_report (entry당 1회 멱등).
 *
 * Strengths / Coach Note / Prescriptions는 entry가 아니라 PeriodReport(3일치 누적)로 이동.
 * 기존 strengths_report/coach_note/prescriptions/report_generated_at 컬럼은 deprecated (DB에는 잔존하나 사용 X).
 *
 * `entry_date`는 YYYY-MM-DD. 한 사용자에 같은 날짜의 엔트리는 단 하나.
 */
export type DailyEntry = {
  id: string;
  user_id: string;
  /** YYYY-MM-DD (UTC date 기준이 아니라 사용자 로컬 기준으로 저장 권장). */
  entry_date: string;

  // 사용자 입력 — 무료 워크북 활동.
  daily_scan: DailyScan;
  brain_dump: BrainDump;
  classification: Classification;
  released: string[];
  actions: Action[];
  moments: Moment[];

  // 매일 무료 LLM 결과 (entry당 1회).
  // @deprecated mirror_report는 daily_analysis("오늘 하루 정리하기")로 대체됨.
  mirror_report: MirrorReport | null;
  mirror_generated_at: string | null;

  /**
   * "오늘 하루 정리하기" 분석 결과 (entry당 1회, 멱등).
   * 월 무료 3회 + 이후 데일리 구독. 생성 시각으로 월간 무료 사용량을 집계.
   */
  daily_analysis: DailyAnalysis | null;
  daily_analysis_generated_at: string | null;

  created_at: string;
  updated_at: string;
};

/* ========== 데일리 구독 (오늘 하루 정리하기 무제한) ========== */

/**
 * 데일리 분석 무제한 이용권. 1건 = 한 달 이용권(현재는 일회성 구매로 31일 부여,
 * 자동 갱신 빌링키는 후속). 종합 리포트(period) 결제와 별개.
 */
export type MindSpillDailySubscription = {
  id: string;
  user_id: string;
  started_at: string;
  expires_at: string;
  status: SubscriptionStatus;
  order_id: string | null;
  amount: number | null;
  payment_key: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

/** PATCH 가능한 필드만 — LLM 출력은 서버에서만 갱신. */
export type DailyEntryPatch = Partial<
  Pick<DailyEntry,
    | "daily_scan"
    | "brain_dump"
    | "classification"
    | "released"
    | "actions"
    | "moments"
  >
>;

export const EMPTY_DAILY_SCAN: DailyScan = EMPTY_WEEKLY_SCAN;

/* ========== 신규: Period Report (3일치 누적 종합) ========== */

/**
 * 3개 이상의 entry를 묶어 LLM이 종합 분석한 결과.
 * 결제 단위 — period 1건 = ₩4,900.
 */
export type PeriodReport = {
  id: string;
  user_id: string;
  /** 묶인 entry id 목록 (3개 이상). */
  entry_ids: string[];
  period_start: string;  // YYYY-MM-DD
  period_end: string;    // YYYY-MM-DD

  // LLM 결과 (결제 + 트리거 완료 후).
  coach_note: CoachNote | null;
  strengths_report: StrengthsReport | null;
  prescriptions: Prescription[] | null;
  /** 3일간 발견된 반복 패턴. */
  patterns: Array<{
    title: string;
    description: string;
    evidence_entries: string[];  // entry_id[]
  }> | null;

  generated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PeriodPurchaseStatus = "pending" | "confirmed" | "cancelled";

export type PeriodPurchase = {
  id: string;
  user_id: string;
  period_report_id: string;
  amount: number;
  order_id: string;          // MS-{timestamp}-{nanoid}
  payment_key: string | null;
  status: PeriodPurchaseStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};
