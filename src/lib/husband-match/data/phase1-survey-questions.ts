/**
 * Phase 1 전용 서베이 문항 (12문항 S1~S12)
 * YouTube 대체: 서베이 응답만으로 ChannelCategories + TCI/Enneagram/MBTI 산출
 */

export type Phase1SurveyAnswer = {
  S1?: [string, string, string]; // 이미지 카드 9개 중 1·2·3위 (카드 id 3개)
  S2?: string[]; // 채널 목록 체크박스 복수 선택 (채널 id)
  S3?: ['A' | 'B', 'A' | 'B', 'A' | 'B', 'A' | 'B']; // 양자택일 4쌍
  S4?: [string, string]; // 무드보드 6개 중 2개 선택
  S5?: [string, string, string]; // 검색어 3개 선택
  S6?: [number, number, number]; // 슬라이더 3개 (0-100)
  S7?: [string, string, string]; // 단일 선택 3문항 (각 문항별 option id)
  S8?: [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2]; // 상황 시나리오 3개, 각 3지선다
  S9?: [string, string]; // 울컥 영상 2개 선택
  S10?: { first: string; second: string; third: string }; // 6개 항목 1·2·3위
  S11?: string; // 4개 중 1개 선택
  S12?: [string, string]; // 7개 중 2개 선택
};

export type Phase1QuestionType =
  | 'rank3of9'   // S1
  | 'multi'      // S2, S4, S9, S12
  | 'binary4'    // S3
  | 'keywords3'  // S5
  | 'slider3'    // S6
  | 'single3'    // S7
  | 'scenario3'  // S8
  | 'rank3of6'   // S10
  | 'single';    // S11

export interface Phase1QuestionOption {
  id: string;
  label: string;
  /** ChannelCategories 키에 대한 가중치 (음악분위기→music 등) */
  categoryWeights?: Partial<Record<'music' | 'reading' | 'sports' | 'cooking' | 'travel' | 'gaming' | 'tech' | 'art' | 'education' | 'entertainment', number>>;
}

export interface Phase1SurveyQuestionDef {
  id: keyof Phase1SurveyAnswer;
  title: string;
  subtitle?: string;
  type: Phase1QuestionType;
  options?: Phase1QuestionOption[];
  /** S3용: 4쌍 질문 [질문, A옵션, B옵션] */
  pairs?: [string, string, string][];
  /** S5용: 검색어 후보 */
  keywordOptions?: string[];
  /** S6용: 슬라이더 라벨 3개 */
  sliderLabels?: [string, string, string];
  /** S7용: 3개 문항 + 각 선택지 */
  single3Questions?: { question: string; options: Phase1QuestionOption[] }[];
  /** S8용: 시나리오 3개, 각 3지선다 */
  scenarios?: { situation: string; choices: [string, string, string] }[];
  /** S10용: 6개 항목 */
  rank6Options?: Phase1QuestionOption[];
}

// 10개 카테고리 키 (ChannelCategories)
const CAT_KEYS = ['music', 'reading', 'sports', 'cooking', 'travel', 'gaming', 'tech', 'art', 'education', 'entertainment'] as const;

// S1: 이미지 카드 9개 (1·2·3위 순위) — 취향 카드
const S1_OPTIONS: Phase1QuestionOption[] = [
  { id: 'music', label: '음악·연주', categoryWeights: { music: 100 } },
  { id: 'reading', label: '독서·인문학', categoryWeights: { reading: 100 } },
  { id: 'sports', label: '스포츠·아웃도어', categoryWeights: { sports: 100 } },
  { id: 'cooking', label: '요리·라이프스타일', categoryWeights: { cooking: 100 } },
  { id: 'travel', label: '여행·맛집', categoryWeights: { travel: 100 } },
  { id: 'gaming', label: '게임', categoryWeights: { gaming: 100 } },
  { id: 'tech', label: 'IT·테크', categoryWeights: { tech: 100 } },
  { id: 'art', label: '힐링·영성·패션뷰티', categoryWeights: { art: 100 } },
  { id: 'entertainment', label: '예능·브이로그', categoryWeights: { entertainment: 100 } },
];

// S2: 채널 목록 체크박스 (복수 선택) — 유사 채널 타입
const S2_OPTIONS: Phase1QuestionOption[] = [
  { id: 'music_ch', label: '음악/인디·밴드 채널', categoryWeights: { music: 100 } },
  { id: 'reading_ch', label: '책·강연·인문 채널', categoryWeights: { reading: 100 } },
  { id: 'sports_ch', label: '운동·등산·골프 채널', categoryWeights: { sports: 100 } },
  { id: 'cooking_ch', label: '요리·홈카페 채널', categoryWeights: { cooking: 100 } },
  { id: 'travel_ch', label: '여행·맛집 채널', categoryWeights: { travel: 100 } },
  { id: 'gaming_ch', label: '게임·e스포츠 채널', categoryWeights: { gaming: 100 } },
  { id: 'tech_ch', label: 'IT·재테크·창업 채널', categoryWeights: { tech: 50, education: 50 } },
  { id: 'art_ch', label: '힐링·명상·뷰티 채널', categoryWeights: { art: 100 } },
  { id: 'edu_ch', label: '교육·강의 채널', categoryWeights: { education: 100 } },
  { id: 'ent_ch', label: '예능·브이로그 채널', categoryWeights: { entertainment: 100 } },
];

// S3: 양자택일 4쌍
const S3_PAIRS: [string, string, string][] = [
  ['휴일에는?', '집에서 푹 쉬는 게 좋아요', '밖에서 뭔가 하는 게 좋아요'],
  ['정보는?', '글·정리된 콘텐츠를 선호해요', '영상·쇼츠를 더 많이 봐요'],
  ['결정은?', '계획하고 차근차근해요', '즉흥적으로 움직여요'],
  ['스트레스는?', '운동·활동으로 풀어요', '음악·영상으로 풀어요'],
];

// S4: 무드보드 6개 중 2개
const S4_OPTIONS: Phase1QuestionOption[] = [
  { id: 'calm', label: '차분·힐링', categoryWeights: { art: 60, reading: 40 } },
  { id: 'active', label: '활동·에너지', categoryWeights: { sports: 70, travel: 30 } },
  { id: 'fun', label: '유머·재미', categoryWeights: { entertainment: 100 } },
  { id: 'learn', label: '배움·성장', categoryWeights: { education: 60, tech: 40 } },
  { id: 'taste', label: '맛·라이프스타일', categoryWeights: { cooking: 50, travel: 50 } },
  { id: 'creative', label: '창작·예술', categoryWeights: { music: 50, art: 50 } },
];

// S5: 검색어 3개 선택
const S5_KEYWORDS = [
  '요리 레시피', '힐링 음악', '재테크', '게임 공략', '여행 vlog',
  '독서 정리', '운동 루틴', 'IT 리뷰', '명상', '예능 하이라이트',
];

// S6: 슬라이더 3개 라벨
const S6_LABELS: [string, string, string] = [
  '집 vs 밖 (왼쪽: 집 선호, 오른쪽: 밖 선호)',
  '글 vs 영상 (왼쪽: 글 선호, 오른쪽: 영상 선호)',
  '계획 vs 즉흥 (왼쪽: 계획, 오른쪽: 즉흥)',
];

// S7: 단일 선택 3문항
const S7_QUESTIONS: { question: string; options: Phase1QuestionOption[] }[] = [
  {
    question: '스트레스 해소 방법은?',
    options: [
      { id: 'sport', label: '운동·등산', categoryWeights: { sports: 100 } },
      { id: 'media', label: '영상·음악', categoryWeights: { entertainment: 50, music: 50 } },
      { id: 'read', label: '책·글 읽기', categoryWeights: { reading: 100 } },
      { id: 'rest', label: '잠·쉬기', categoryWeights: { art: 60 } },
    ],
  },
  {
    question: '시간 날 때 자주 하는 것은?',
    options: [
      { id: 'watch', label: '유튜브·넷플릭스', categoryWeights: { entertainment: 100 } },
      { id: 'learn', label: '강의·공부', categoryWeights: { education: 100 } },
      { id: 'out', label: '밖에 나가기', categoryWeights: { travel: 50, sports: 50 } },
      { id: 'home', label: '집에서 취미', categoryWeights: { cooking: 40, art: 60 } },
    ],
  },
  {
    question: '관심 있는 분야는?',
    options: [
      { id: 'money', label: '경제·재테크', categoryWeights: { tech: 50, education: 50 } },
      { id: 'culture', label: '인문·예술', categoryWeights: { reading: 50, art: 50 } },
      { id: 'life', label: '일상·라이프', categoryWeights: { cooking: 50, entertainment: 50 } },
      { id: 'active', label: '스포츠·아웃도어', categoryWeights: { sports: 100 } },
    ],
  },
];

// S8: 상황 시나리오 3개, 각 3지선다
const S8_SCENARIOS: { situation: string; choices: [string, string, string] }[] = [
  {
    situation: '주말에 친구가 갑자기 만나자고 해요.',
    choices: ['즉시 만나러 간다', '일정 확인 후 답한다', '집에서 쉬고 싶으면 거절한다'],
  },
  {
    situation: '새로 관심 생긴 분야가 있어요.',
    choices: ['영상부터 많이 본다', '글·책으로 정리해서 본다', '직접 체험해 본다'],
  },
  {
    situation: '스트레스를 받았어요.',
    choices: ['운동하거나 밖에 나간다', '영상·음악으로 쉰다', '혼자 조용히 쉰다'],
  },
];

// S9: 울컥 영상 2개 선택
const S9_OPTIONS: Phase1QuestionOption[] = [
  { id: 'family', label: '가족·감동', categoryWeights: { entertainment: 60, art: 40 } },
  { id: 'success', label: '성공·역전', categoryWeights: { education: 60, entertainment: 40 } },
  { id: 'nature', label: '자연·힐링', categoryWeights: { art: 60, travel: 40 } },
  { id: 'music', label: '음악·공연', categoryWeights: { music: 100 } },
  { id: 'human', label: '인간극·리얼', categoryWeights: { entertainment: 100 } },
  { id: 'sport', label: '스포츠·승부', categoryWeights: { sports: 100 } },
];

// S10: 6개 항목 1·2·3위
const S10_OPTIONS: Phase1QuestionOption[] = [
  { id: 'music', label: '음악', categoryWeights: { music: 100 } },
  { id: 'reading', label: '독서·지식', categoryWeights: { reading: 100 } },
  { id: 'sports', label: '스포츠·활동', categoryWeights: { sports: 100 } },
  { id: 'lifestyle', label: '라이프·요리', categoryWeights: { cooking: 100 } },
  { id: 'career', label: '커리어·재테크', categoryWeights: { tech: 50, education: 50 } },
  { id: 'fun', label: '예능·유머', categoryWeights: { entertainment: 100 } },
];

// S11: 4개 중 1개
const S11_OPTIONS: Phase1QuestionOption[] = [
  { id: 'stability', label: '안정·평온', categoryWeights: { art: 50, reading: 50 } },
  { id: 'growth', label: '성장·도전', categoryWeights: { education: 50, sports: 50 } },
  { id: 'fun', label: '재미·유대', categoryWeights: { entertainment: 100 } },
  { id: 'depth', label: '깊이·이해', categoryWeights: { reading: 50, art: 50 } },
];

// S12: 7개 중 2개
const S12_OPTIONS: Phase1QuestionOption[] = [
  { id: 'music', label: '음악', categoryWeights: { music: 100 } },
  { id: 'book', label: '책·강연', categoryWeights: { reading: 100 } },
  { id: 'sports', label: '운동·아웃도어', categoryWeights: { sports: 100 } },
  { id: 'cook', label: '요리·홈', categoryWeights: { cooking: 100 } },
  { id: 'tech', label: 'IT·재테크', categoryWeights: { tech: 100 } },
  { id: 'heal', label: '힐링·뷰티', categoryWeights: { art: 100 } },
  { id: 'ent', label: '예능·브이로그', categoryWeights: { entertainment: 100 } },
];

export const PHASE1_SURVEY_QUESTIONS: Phase1SurveyQuestionDef[] = [
  {
    id: 'S1',
    title: '가장 끌리는 취향 카드 3가지를 순서대로 골라주세요',
    subtitle: '1위, 2위, 3위',
    type: 'rank3of9',
    options: S1_OPTIONS,
  },
  {
    id: 'S2',
    title: '관심 있는 채널 유형을 모두 골라주세요',
    type: 'multi',
    options: S2_OPTIONS,
  },
  {
    id: 'S3',
    title: '더 가까운 쪽을 골라주세요',
    type: 'binary4',
    pairs: S3_PAIRS,
  },
  {
    id: 'S4',
    title: '나의 무드를 나타내는 보드 2개를 골라주세요',
    type: 'multi',
    options: S4_OPTIONS,
  },
  {
    id: 'S5',
    title: '검색해 보고 싶은 키워드 3개를 골라주세요',
    type: 'keywords3',
    keywordOptions: S5_KEYWORDS,
  },
  {
    id: 'S6',
    title: '슬라이더로 선호도를 표시해 주세요',
    type: 'slider3',
    sliderLabels: S6_LABELS,
  },
  {
    id: 'S7',
    title: '각 질문에 하나씩 답해 주세요',
    type: 'single3',
    single3Questions: S7_QUESTIONS,
  },
  {
    id: 'S8',
    title: '상황에 맞는 선택을 해 주세요',
    type: 'scenario3',
    scenarios: S8_SCENARIOS,
  },
  {
    id: 'S9',
    title: '울컥했던 영상 유형 2가지를 골라주세요',
    type: 'multi',
    options: S9_OPTIONS,
  },
  {
    id: 'S10',
    title: '중요한 순서대로 1·2·3위를 골라주세요',
    type: 'rank3of6',
    rank6Options: S10_OPTIONS,
  },
  {
    id: 'S11',
    title: '가장 중요하게 생각하는 것은?',
    type: 'single',
    options: S11_OPTIONS,
  },
  {
    id: 'S12',
    title: '좋아하는 콘텐츠 2가지를 골라주세요',
    type: 'multi',
    options: S12_OPTIONS,
  },
];
