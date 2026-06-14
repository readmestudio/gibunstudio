// 심리 상담 워크북 대기신청 설문 — 선택지 정의.
// DB(workbook_waitlist)와 폼/검증 양쪽에서 같은 id를 쓰도록 단일 출처로 관리한다.

export interface ChoiceOption {
  id: string;
  label: string;
}

export interface WaitlistWorkbook extends ChoiceOption {
  description: string;
}

/** 대기신청 대상 워크북 목록(복수 선택). id는 DB workbooks[] 저장값과 동일. */
export const WAITLIST_WORKBOOKS: WaitlistWorkbook[] = [
  {
    id: "anxiety",
    label: "불안",
    description: "막연한 걱정과 초조함이 자주 마음을 점령할 때",
  },
  {
    id: "achievement_addiction",
    label: "성취중독",
    description: "쉬면 불안하고, 늘 더 해내야 할 것 같을 때",
  },
  {
    id: "self_criticism",
    label: "자기비판",
    description: "세상에서 나에게 가장 가혹한 사람이 나일 때",
  },
  {
    id: "perfectionism",
    label: "완벽주의",
    description: "충분히 잘해냈는데도 늘 부족하게 느껴질 때",
  },
  {
    id: "relationship_pattern",
    label: "관계 패턴",
    description: "비슷한 갈등과 상처가 관계마다 반복될 때",
  },
  {
    id: "etc",
    label: "기타",
    description: "그 밖에 다루고 싶은 주제가 있다면",
  },
];

/** 요즘 가장 마음 쓰이는 고민(복수 선택). */
export const CONCERN_OPTIONS: ChoiceOption[] = [
  { id: "anxious", label: "이유 없이 불안하고 초조해요" },
  { id: "cant_rest", label: "쉬어도 마음이 편하지 않아요" },
  { id: "self_blame", label: "자꾸 나를 탓하고 깎아내려요" },
  { id: "never_enough", label: "아무리 해내도 부족하게 느껴져요" },
  { id: "relationship", label: "관계에서 비슷한 갈등이 반복돼요" },
  { id: "mood_swing", label: "감정 기복이 크고 휘둘려요" },
  { id: "burnout", label: "지치고 번아웃이 온 것 같아요" },
  { id: "empty", label: "공허하고 무기력해요" },
  { id: "etc", label: "기타" },
];

/** 직업/하는 일(단일 선택). */
export const JOB_OPTIONS: ChoiceOption[] = [
  { id: "office", label: "직장인 (사무·관리직)" },
  { id: "professional", label: "전문직 (의료·법조·교육 등)" },
  { id: "freelancer", label: "자영업 · 프리랜서 · 1인기업" },
  { id: "creator", label: "창작자 · 크리에이터" },
  { id: "student", label: "학생 · 취업준비생" },
  { id: "homemaker", label: "주부 · 육아 중" },
  { id: "resignation_prep", label: "퇴사 준비 중" },
  { id: "job_change_prep", label: "이직 준비 중" },
  { id: "etc", label: "기타" },
];

/** 구매 의향 — 워크북 단독 vs 워크북+심리상담(단일 선택).
 *  가격은 기분스튜디오_README.md 기준(워크북 ₩49,000 / 워크북+상담 ₩129,000). */
export interface PurchaseOption extends ChoiceOption {
  price?: string;
  description: string;
}
export const PURCHASE_TYPE_OPTIONS: PurchaseOption[] = [
  {
    id: "workbook_only",
    label: "워크북 단독",
    price: "₩49,000",
    description: "10단계 워크북 전 과정 + 3가지 분석 리포트 + 자기 확언 카드",
  },
  {
    id: "workbook_counseling",
    label: "워크북 + 1:1 심리상담",
    price: "₩129,000",
    description: "워크북 전 과정 + 1급 심리상담사 Zoom 1:1 상담 1회 포함",
  },
  {
    id: "undecided",
    label: "아직 고민 중이에요",
    description: "둘 다 안내받고 천천히 정할게요",
  },
];

/** 현재 일/분야에서의 연차(단일 선택). */
export const YEARS_OPTIONS: ChoiceOption[] = [
  { id: "lt1", label: "1년 미만" },
  { id: "y1_3", label: "1–3년차" },
  { id: "y4_7", label: "4–7년차" },
  { id: "y8_15", label: "8–15년차" },
  { id: "gt15", label: "15년 이상" },
  { id: "na", label: "해당 없음" },
];

/** 심리상담 경험(단일 선택). */
export const COUNSELING_EXPERIENCE_OPTIONS: ChoiceOption[] = [
  { id: "ongoing", label: "꾸준히 받고 있거나 받은 적 있어요" },
  { id: "quit", label: "몇 번 받다가 그만뒀어요" },
  { id: "once_twice", label: "딱 한두 번 받아봤어요" },
  { id: "never", label: "받아본 적 없어요" },
];

/** 상담을 지속/중단/시작 못 한 이유(복수 선택). */
export const COUNSELING_REASON_OPTIONS: ChoiceOption[] = [
  { id: "cost", label: "비용이 부담돼요" },
  { id: "time", label: "시간 내기가 어려워요" },
  { id: "where_start", label: "어디서 시작해야 할지 모르겠어요" },
  { id: "bad_fit", label: "상담사와 잘 맞지 않았어요" },
  { id: "no_effect", label: "효과를 잘 느끼지 못했어요" },
  { id: "self_solve", label: "혼자 해결해보고 싶어요" },
  { id: "hard_to_open", label: "막상 말로 꺼내기가 어려워요" },
  { id: "helpful", label: "도움이 되어서 계속 받고 있어요" },
  { id: "etc", label: "기타" },
];

/** 언제부터 쓰고 싶은지(단일 선택). */
export const DESIRED_START_OPTIONS: ChoiceOption[] = [
  { id: "asap", label: "지금 당장" },
  { id: "within_2w", label: "1–2주 내" },
  { id: "within_1m", label: "1개월 이내" },
  { id: "within_3m", label: "3개월 이내" },
  { id: "undecided", label: "아직 정하지 않았어요" },
];

/** 워크북·상담을 통해 알고 싶은 내용(복수 선택). */
export const GOAL_OPTIONS: ChoiceOption[] = [
  { id: "why_repeat", label: "내가 왜 이런 반응을 반복하는지" },
  { id: "calm_anxiety", label: "불안을 다스리는 구체적인 방법" },
  { id: "less_harsh", label: "나를 덜 몰아붙이는 법" },
  { id: "healthy_relationship", label: "건강하게 관계 맺는 법" },
  { id: "notice_emotion", label: "내 감정을 잘 알아차리는 법" },
  { id: "find_strength", label: "나의 강점과 회복 자원 찾기" },
  { id: "root_cause", label: "지금 마음의 뿌리·원인 이해하기" },
  { id: "etc", label: "기타" },
];

/** id → label 조회용 맵을 만든다. 어드민 화면에서 저장된 id를 한글로 보여줄 때 사용. */
function toLabelMap(options: ChoiceOption[]): Record<string, string> {
  return Object.fromEntries(options.map((o) => [o.id, o.label]));
}

/** 질문별 id→label 매핑. DB에 저장된 값(영문 id)을 사람이 읽는 라벨로 변환할 때 참조. */
export const WAITLIST_LABELS = {
  workbooks: toLabelMap(WAITLIST_WORKBOOKS),
  purchaseType: toLabelMap(PURCHASE_TYPE_OPTIONS),
  concern: toLabelMap(CONCERN_OPTIONS),
  job: toLabelMap(JOB_OPTIONS),
  yearsExperience: toLabelMap(YEARS_OPTIONS),
  counselingExperience: toLabelMap(COUNSELING_EXPERIENCE_OPTIONS),
  counselingReason: toLabelMap(COUNSELING_REASON_OPTIONS),
  desiredStart: toLabelMap(DESIRED_START_OPTIONS),
  goals: toLabelMap(GOAL_OPTIONS),
} as const;

/** 폼 → API 로 전송하는 페이로드 형태. */
export interface WaitlistPayload {
  name: string;
  email: string;
  phone: string;
  workbooks: string[];
  purchaseType?: string;
  concern: string[];
  job?: string;
  yearsExperience?: string;
  counselingExperience?: string;
  counselingReason: string[];
  desiredStart?: string;
  goals: string[];
  inquiry?: string;
}
