// Type definitions for husband-match analysis

export interface ChannelData {
  channel_id: string;
  channel_title: string;
  channel_description: string;
}

// 문서 명세 기준 10대 카테고리
export interface ChannelCategories {
  musicMood: number;           // 음악/분위기
  readingHumanities: number;   // 독서/인문학
  sportsOutdoor: number;       // 스포츠/아웃도어
  entertainmentVlog: number;   // 예능/브이로그
  languageCulture: number;     // 언어/다문화
  lifestyleSpace: number;      // 라이프스타일/공간
  careerBusiness: number;      // 커리어/창업
  healingSpirituality: number; // 힐링/영성
  fashionBeauty: number;       // 패션/뷰티
  financeInvest: number;       // 경제/재테크
}

export interface TCIScores {
  NS: number; // Novelty Seeking (0-100)
  HA: number; // Harm Avoidance (0-100)
  RD: number; // Reward Dependence (0-100)
  P: number;  // Persistence (0-100)
  SD: number; // Self-Directedness (0-100)
  CO: number; // Cooperativeness (0-100)
  ST: number; // Self-Transcendence (0-100)
}

export interface EnneagramCenter {
  head: number;  // 0-100
  heart: number; // 0-100
  body: number;  // 0-100
}

export interface MBTIScores {
  E: number; // Extraversion (0-100)
  I: number; // Introversion (0-100)
  S: number; // Sensing (0-100)
  N: number; // Intuition (0-100)
  T: number; // Thinking (0-100)
  F: number; // Feeling (0-100)
  J: number; // Judging (0-100)
  P: number; // Perceiving (0-100)
}

// 문서 명세 기준 18차원 벡터
export interface UserVector {
  // TCI dimensions (7) [0-6]
  NS: number;
  HA: number;
  RD: number;
  P: number;
  SD: number;
  CO: number;
  ST: number;
  // Enneagram centers (3) [7-9]
  head: number;
  heart: number;
  body: number;
  // Content 8차원 [10-17]
  sensory_sensitivity: number;     // 감각적 민감성: 음악+패션뷰티
  intellectual_curiosity: number;  // 지적 호기심: 독서+경제재테크
  cultural_openness: number;       // 문화적 개방성: 언어다문화
  sociability: number;             // 사회성: 예능브이로그
  nurturing: number;               // 돌봄 관심: 힐링영성
  adventurousness: number;         // 모험성: 스포츠아웃도어
  stability_orientation: number;   // 안정 지향: 라이프스타일+경제재테크
  achievement_orientation: number; // 성취 지향: 커리어창업
}

export interface HusbandType {
  id: string;
  name: string;
  category: string; // e.g., "성장파트너형"
  subcategory: string; // e.g., "모험가"
  variant: 'extrovert' | 'introvert'; // E/I 변형
  description: string;
  idealVector: number[]; // 18-dimensional vector
  metaphor_e?: string; // Extrovert variant metaphor
  metaphor_i?: string; // Introvert variant metaphor
}

export interface BirthInfo {
  year: number;
  month: number;  // 1-12
  day: number;    // 1-31
}

export interface Phase1Result {
  id: string;
  user_id: string;
  channel_categories: ChannelCategories;
  tci_scores: TCIScores;
  enneagram_center: EnneagramCenter;
  enneagram_type: number | null; // 1-9
  mbti_scores: MBTIScores;
  mbti_type: string | null; // e.g., "INFP"
  user_vector: number[]; // 18-dimensional
  matched_husband_type: string;
  match_score: number; // 0-1
  match_method: string;
  cards: ReportCard[];
  user_name?: string;      // 사용자 이름
  birth_date?: string;     // ISO date "1995-03-15"
  created_at: string;
}

export interface ReportCard {
  card_number: number;
  title: string;
  subtitle?: string;
  content: string;
  card_type: 'intro' | 'personality' | 'values' | 'matching' | 'result';
  tags?: string[];
  highlight?: string;
  metadata?: Record<string, any>;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'choice' | 'text' | 'scale' | 'sct' | 'scenario' | 'multi_sct';
  options?: string[];
  placeholder?: string;
  sctPrompt?: string; // SCT 문장완성 시작 문장 (예: "연인과 갈등이 생기면, 나는 보통...")
  scenarioText?: string;      // scenario 타입용 시나리오 텍스트
  multiSctPrompts?: string[]; // multi_sct 타입용 하위 프롬프트 목록
  min?: number;
  max?: number;
}

export interface Phase2Survey {
  id: string;
  user_id: string;
  phase1_id: string;
  payment_id: string;
  survey_responses: Record<string, any>;
  submitted_at: string;
}

export interface Phase2Result {
  id: string;
  user_id: string;
  phase1_id: string;
  survey_id: string;
  payment_id: string;
  cross_validation_insights: {
    discrepancies: Array<{
      dimension: string;
      youtube_value: number;
      survey_value: number;
      interpretation: string;
    }>;
    hidden_desires: string[];
    authenticity_score: number;
  };
  deep_cards: ReportCard[];
  created_at: string;
  published_at?: string | null;
  published_by?: string | null;
}

export interface Payment {
  id: string;
  user_id: string;
  phase1_id: string;
  amount: number;
  payment_method: string;
  order_id: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  paid_at: string | null;
  created_at: string;
}

// ── Phase 2 심층 분석 타입 ──

/** 7차원 교차검증의 개별 차원 결과 */
export interface CrossValidationDimension {
  dimension: string;
  youtube_value: number;
  survey_value: number;
  diff: number;
  interpretation: string;
}

/** 성격 3층 구조 — 겉모습 / 의식적 욕구 / 무의식 */
export interface PersonalityLayer {
  surface: string;    // YouTube 기반 겉모습
  conscious: string;  // 설문 기반 의식적 욕구
  unconscious: string; // 불일치에서 도출된 무의식
}

/** 숨겨진 욕구 */
export interface HiddenDesire {
  label: string;      // 짧은 제목 (예: "인정받고 싶은 마음")
  description: string; // 상세 설명
  source: string;     // 도출 근거 (예: "HA↑ + q9 키워드 '불안'")
}

/** 감정 청사진 */
export interface EmotionalBlueprint {
  stressResponse: string;    // 스트레스 시 반응 패턴
  healingPattern: string;    // 회복 방식
  emotionalExpression: number; // 감정 표현도 (0-100)
  conflictStyle: string;     // 갈등 해결 스타일
}

// ── CBT 분석 타입 (Mind Over Mood 2판 기반) ──

/** 인지 왜곡 패턴 */
export interface CognitiveDistortion {
  type: string;              // 'catastrophizing' | 'mind_reading' 등
  label: string;             // '파국화' | '독심술'
  evidence: string;          // 근거 원문
  relationshipImpact: string; // 관계에서의 영향
}

/** 5-Part Model (상황→사고→감정→신체→행동) */
export interface FivePartModel {
  situation: string;
  automaticThought: string;  // q16 Hot Thought
  emotion: string;           // q5 + q12에서 추론
  physicalReaction: string;  // q10 신체 반응
  behavior: string;          // q9 + q6
}

/** 중간 신념 (규칙/태도/가정) */
export interface IntermediateBelief {
  rules: string;             // q17 ① "~해야 한다"
  positiveAssumption: string; // q17 ② "~한다면, ~할 것이다"
  negativeAssumption: string; // q17 ③ "~하면, ~할 것이다"
  theme: string;             // 관통 주제
}

/** 핵심 신념 카테고리 */
export interface CoreBeliefCategory {
  category: 'self_worth' | 'abandonment' | 'safety' | 'conditional_worth' | 'helplessness' | 'other';
  label: string;
  selectedOption: string;    // q18 선택지
  convergingEvidence: string[]; // q12, q15, q17에서 수렴
}

/** CBT 통합 분석 결과 */
export interface CBTAnalysis {
  fivePartModel: FivePartModel;
  cognitiveDistortions: CognitiveDistortion[];
  intermediateBelief: IntermediateBelief;
  coreBelief: CoreBeliefCategory;
  thoughtChain: string;      // 자동사고→중간신념→핵심신념 서사
}

/** 7차원 교차검증 전체 결과 */
export interface DeepCrossValidation {
  dimensions: CrossValidationDimension[];
  hiddenDesires: HiddenDesire[];
  personalityLayers: PersonalityLayer;
  emotionalBlueprint: EmotionalBlueprint;
  authenticityScore: number; // 0-1
  cbtAnalysis?: CBTAnalysis; // CBT 분석 (Phase 2 CBT 강화)
}

/** Phase 2 카드 데이터 (확장판) */
export interface Phase2CardDataExtended {
  phase1: {
    tci_scores: TCIScores;
    channel_categories: ChannelCategories;
    enneagram_center: EnneagramCenter;
    enneagram_type: number | null;
    mbti_scores: MBTIScores;
    mbti_type: string | null;
    matched_husband_type: string;
    match_score: number;
    cards: ReportCard[];
    user_name?: string;
  };
  survey: {
    // 스케일 (q1-q5)
    q1_together_time?: number;        // 1-10: 함께 보내는 시간 이상 (E/I + RD)
    q2_anxiety_influence?: number;    // 1-10: 불안이 결정에 미치는 영향 (HA)
    q3_logic_vs_emotion?: number;     // 1-10: 논리 vs 감정 (T/F)
    q4_independence?: number;         // 1-10: 나만의 영역 중요도 (SD)
    q5_emotional_expression?: number; // 1-10: 감정 표현 정도

    // SCT — 관계 패턴 (q6-q8)
    q6_conflict_pattern?: string;     // "연인과 갈등이 생기면, 나는 보통..."
    q7_partner_distance?: string;     // "연인이 나에게서 멀어진다고 느낄 때, 나는..."
    q8_recurring_issue?: string;      // "관계에서 반복되는 문제가 있다면, 그건..."

    // SCT — 감정 처리 (q9-q11)
    q9_stress_response?: string;      // "나는 스트레스를 받으면 가장 먼저..."
    q10_body_signal?: string;         // "불안하거나 두려울 때, 내 몸에서 가장 먼저 느껴지는 변화는..."
    q11_comfort_source?: string;      // "나를 가장 편하게 만들어주는 사람이나 상황은..."

    // SCT — 성장/두려움 (q12-q13)
    q12_deepest_fear?: string;        // "결혼이나 깊은 관계를 생각할 때 가장 두려운 것은..."
    q13_want_to_change?: string;      // "관계에서 내가 바꾸고 싶지만 잘 안 되는 것은..."

    // SCT — 이상형/욕구 (q14-q15)
    q14_ideal_day?: string;           // "내가 꿈꾸는 파트너와의 가장 이상적인 하루는..."
    q15_core_desire?: string;         // "내가 진짜 원하는 관계는 한마디로..."

    // CBT 강화 (q16-q18)
    q16_hot_scenario?: string;        // Hot Thought 시나리오 응답
    q17_relationship_rules?: {        // 중간 신념 (규칙/가정)
      rules: string;
      positive_assumption: string;
      negative_assumption: string;
    };
    q18_core_belief_choice?: string;  // 핵심 신념 선택지
  };
  deepCrossValidation: DeepCrossValidation;
  husbandType: {
    id: string;
    name: string;
    category: string;
    subcategory: string;
    description: string;
    metaphor?: string;
  };
}
