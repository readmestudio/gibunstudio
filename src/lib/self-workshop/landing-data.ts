/**
 * 성취 중독 워크북 랜딩페이지 공유 데이터
 */

/* ── 방치 시 결과 (WorkshopPaymentGate에서도 사용) ── */

export const CONSEQUENCES = [
  {
    title: "만성 번아웃",
    description:
      "매일 최선을 다하는데 '충분하지 않다'는 느낌이 사라지지 않아요. 어느 날 갑자기 아무것도 하기 싫어지는 순간이 찾아옵니다.",
  },
  {
    title: "관계 갈등",
    description:
      "가까운 사람에게 '왜 너는 노력을 안 해?'라는 말이 나오기 시작해요. 나의 기준을 타인에게 강요하게 되고, 관계가 멀어집니다.",
  },
  {
    title: "자기 회의",
    description:
      "이 정도면 됐다고 스스로를 인정하지 못해요. 성과를 쌓아도 '운이 좋았을 뿐'이라는 생각이 반복됩니다.",
  },
  {
    title: "신체 증상",
    description:
      "불면, 만성 피로, 두통, 소화 불량. 몸이 보내는 신호를 무시하다가 건강이 무너지는 경우가 많아요.",
  },
];

/* ── 4가지 해결 솔루션 ── */

export interface SolutionCard {
  step: number;
  title: string;
  tag: string;
  bullets: string[];
  summary: string;
}

export const SOLUTION_CARDS: SolutionCard[] = [
  {
    step: 1,
    title: "진단",
    tag: "자가 진단 20문항",
    bullets: [
      "4개 하위 영역별 점수 측정",
      "성취 중독 레벨 판정 (1~4단계)",
      "나의 패턴이 어디에 집중되어 있는지 확인",
    ],
    summary: "무엇이 문제인지 정확히 압니다",
  },
  {
    step: 2,
    title: "인지 패턴 분석",
    tag: "AI 교차검증",
    bullets: [
      "직접 쓴 상황을 AI가 심리학적으로 분석",
      "자동적 사고 패턴을 객관적으로 추출",
      "나도 몰랐던 반복 구조를 시각화",
    ],
    summary: "숨겨진 패턴을 발견합니다",
  },
  {
    step: 3,
    title: "인지 재구조화",
    tag: "CBT 기반 실습",
    bullets: [
      "인지적 오류 6가지 중 나의 패턴 식별",
      "자동적 사고 → 대안 사고 전환 훈련",
      "감정 도미노 구조를 직접 분해",
    ],
    summary: "생각의 습관을 바꿉니다",
  },
  {
    step: 4,
    title: "대처 계획",
    tag: "행동 실험",
    bullets: [
      "나만의 자기 돌봄 계획 수립",
      "구체적인 행동 실험 설계",
      "전체 여정 요약 리포트 제공",
    ],
    summary: "아는 것에서 실천으로 넘어갑니다",
  },
];

/* ── 워크북 스크린샷 (플레이스홀더) ── */

export const WORKBOOK_SCREENSHOTS = [
  { label: "자가 진단", description: "20문항 리커트 척도" },
  { label: "진단 결과", description: "4개 영역별 점수 분석" },
  { label: "메커니즘 실습", description: "나의 성취 순환 추적" },
  { label: "인지 패턴 분석", description: "자동적 사고 패턴 발견" },
  { label: "인지 재구조화", description: "대안 사고 훈련" },
  { label: "대처 계획", description: "행동 실험 설계" },
  { label: "요약 리포트", description: "전체 여정 AI 요약" },
  { label: "마무리 성찰", description: "변화 다짐 기록" },
];

/* ── 통계 배너 ── */

export const WORKBOOK_STATS = [
  { value: "96%", label: "완주율" },
  { value: "4.8", label: "만족도 (5점)" },
  { value: "85분", label: "평균 소요 시간" },
  { value: "★★★★★", label: "\"패턴이 보이기 시작했어요\"" },
];

/* ── 유저 후기 ── */

export interface WorkbookReview {
  content: string;
  highlight: string;
  name: string;
  age: string;
  occupation: string;
  badge: string;
}

export const FEATURED_REVIEW = {
  badge: "워크북 수강 후기",
  content:
    "매일 야근하면서도 '아직 부족해'라는 생각이 떠나지 않았어요. 워크북 진단에서 '자기 가치의 조건화' 점수가 24/25로 나왔을 때 소름이 돋았습니다. 내가 왜 쉬지 못하는지, 왜 칭찬을 받아도 불안한지 처음으로 구조적으로 이해했어요. 3단계 실습에서 '성과 없는 나도 괜찮다'는 대안 사고를 써보는데 눈물이 났습니다.",
};

export const WORKBOOK_REVIEWS: WorkbookReview[] = [
  {
    badge: "워크북 수강 후기",
    content:
      "승진했는데 기쁘기보다 '다음엔 뭘 해야 하지'가 먼저 떠올랐어요. 워크북에서 이걸 '과잉 추동'이라고 설명하는데, 제 10년 직장생활이 한 문장으로 요약되는 느낌이었습니다. 인지 패턴 분석에서 제가 쓴 일상 패턴을 짚어주는데, 진짜 상담받는 것 같았어요.",
    highlight: "상담 예약 3개월 대기보다 이 워크북이 훨씬 빨랐어요.",
    name: "지현",
    age: "34세",
    occupation: "직장인 8년차",
  },
  {
    badge: "워크북 수강 후기",
    content:
      "주말에 쉬면 죄책감이 들어서 항상 자격증 공부를 했어요. 워크북 진단에서 '정서적 회피' 점수가 높게 나왔는데, '바쁘면 생각을 안 해도 되니까'라는 설명이 정확히 제 상태였어요. 대처 계획 세우면서 처음으로 '아무것도 안 하는 주말'을 계획해봤습니다.",
    highlight: "85분 투자로 10년간 몰랐던 패턴을 발견했어요.",
    name: "민수",
    age: "31세",
    occupation: "직장인 5년차",
  },
  {
    badge: "워크북 수강 후기",
    content:
      "팀원들한테 '왜 이것도 못 해?'라는 말이 자꾸 나와서 관계가 나빠지고 있었어요. 워크북에서 '나의 기준을 타인에게 강요'하는 패턴이라고 짚어주는데 뜨끔했습니다. 인지 재구조화 실습에서 '완벽하지 않아도 괜찮다'를 연습하는 게 생각보다 어렵더라고요. 근데 그게 핵심이었어요.",
    highlight: "팀장이 되기 전에 이걸 했으면 관계가 덜 망가졌을 텐데.",
    name: "서연",
    age: "37세",
    occupation: "직장인 12년차",
  },
  {
    badge: "워크북 수강 후기",
    content:
      "번아웃이 와서 퇴사까지 고민했는데, 문제는 회사가 아니라 제 패턴이었어요. 진단 결과 레벨 4가 나왔을 때 충격이었지만, 오히려 '이건 내 잘못이 아니라 자동적 사고'라는 걸 알게 되면서 안도감이 들었습니다.",
    highlight: "퇴사 대신 패턴을 바꾸기로 했어요. 훨씬 현명한 선택이었습니다.",
    name: "준혁",
    age: "29세",
    occupation: "직장인 4년차",
  },
];

/* ── 워크북 포함 내용 ── */

export const WORKBOOK_FEATURES = [
  "나의 순환 메커니즘 직접 추적",
  "AI 교차검증으로 숨겨진 패턴 발견",
  "인지 재구조화 · 행동 실험 · 자기 돌봄 워크시트",
  "전체 요약 리포트",
];

export const WORKSHOP_ORIGINAL_PRICE = 99000;
export const WORKSHOP_PRICE = 69000;
export const WORKSHOP_DISCOUNT_PERCENT = Math.round(
  (1 - WORKSHOP_PRICE / WORKSHOP_ORIGINAL_PRICE) * 100
);
