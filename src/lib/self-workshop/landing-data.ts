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
    title: "진단 테스트",
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
    title: "분석 리포트",
    tag: "진단에 따른 패턴 분석",
    bullets: [
      "진단 결과를 기반으로 한 심층 해석",
      "자동적 사고 패턴을 객관적으로 추출",
      "나도 몰랐던 반복 구조를 시각화",
    ],
    summary: "숨겨진 패턴을 발견합니다",
  },
  {
    step: 3,
    title: "심리학에 근거한 실습",
    tag: "CBT · 라이팅 테라피",
    bullets: [
      "인지적 오류 6가지 중 나의 패턴 식별",
      "자동적 사고 → 대안 사고 전환 훈련",
      "직접 쓰는 라이팅 테라피로 감정 정리",
    ],
    summary: "생각의 습관을 바꿉니다",
  },
  {
    step: 4,
    title: "실전 적용 DO&DON'T 리스트",
    tag: "실전 체크리스트",
    bullets: [
      "직장 생활에서 바로 쓰는 DO 리스트",
      "피해야 할 반응 패턴 DON'T 리스트",
      "나만의 자기 돌봄·행동 실험 설계",
    ],
    summary: "성취 중독을 극복하고 퍼포먼스를 극대화합니다",
  },
];

/* ── 워크북 효과 (얻을 수 있는 것) ── */

export const WORKBOOK_BENEFITS = [
  {
    title: "정확한 진단",
    description:
      "내 성취 중독 레벨과 하위 영역 점수로, 무엇이 문제인지 구체적으로 확인합니다.",
  },
  {
    title: "악순환 해결",
    description:
      "6단계 성취 중독 순환 고리를 끊어내는 실전 전략을 직접 설계합니다.",
  },
  {
    title: "마음의 작용이 사라짐",
    description:
      "내 퍼포먼스를 가로막던 완벽주의·자기 의심·과잉 추동이 힘을 잃습니다.",
  },
  {
    title: "일의 성과가 좋아짐",
    description:
      "마음에 쓰던 에너지가 일로 돌아와, 실제 능력만큼의 성과가 나오기 시작합니다.",
  },
  {
    title: "자신감",
    description:
      "성과에 기대지 않고도 '나는 충분하다'는 감각을 스스로 만들어 냅니다.",
  },
  {
    title: "일의 지속 가능성",
    description:
      "번아웃·퇴사 충동 없이, 오래 일할 수 있는 마음의 체력이 생깁니다.",
  },
];

/* ── 일반 심리 검사 vs 워크북 비교 ── */

export const WORKSHOP_COMPARISON = {
  standard: {
    label: "일반적인 심리 검사",
    summary: "진단에서 끝납니다",
    points: [
      "결과지 한 장으로 끝",
      "해석은 남의 이야기 같아서 생활에 적용이 어려움",
      "'뭘 해야 할지'는 스스로 찾아야 함",
    ],
  },
  workbook: {
    label: "마음 챙김 워크북",
    summary: "진단 → 실습 → 실전 적용까지",
    points: [
      "직접 써 내려가는 라이팅 테라피로 마음이 정리됩니다",
      "증상이 나타난 진짜 원인을 찾고, 대체 생각을 훈련합니다",
      "실전 훈련으로 직장 생활의 문제를 직접 해결합니다",
      "성취 중독을 극복하고 퍼포먼스를 극대화합니다",
    ],
  },
};

/* ── 이런 분에게 추천드려요 ── */

export const WORKBOOK_RECOMMEND = [
  "완벽주의·인정욕구·불안 때문에 직장 생활이 지옥이 된 분",
  "재능은 충분한데 성과가 그만큼 나오지 않는다고 느끼는 분",
  "성취해도 기쁨은 하루, 곧 '다음은?' 걱정이 먼저 드는 분",
  "번아웃이 반복되거나, 회사를 그만둘까 고민 중인 분",
  "상담은 부담스럽지만 혼자서라도 내 마음을 정리하고 싶은 분",
  "'마음부터 챙기면 성과는 따라온다'는 말에 공감하는 3~15년차 직장인",
];

/* ── FAQ ── */

export const WORKBOOK_FAQ: { question: string; answer: string }[] = [
  {
    question: "이 워크북은 누구를 위해 만들어졌나요?",
    answer:
      "완벽주의·인정욕구·불안 때문에 실력만큼 성과가 나지 않는 3~15년차 직장인을 위해 설계됐어요. 성취해도 공허하거나, 번아웃·퇴사를 고민해 본 분이라면 가장 큰 도움을 받으실 수 있습니다.",
  },
  {
    question: "얼마나 시간이 걸리나요?",
    answer:
      "한 번에 몰아 하면 약 65~100분 정도 소요됩니다. 중간에 저장하고 며칠에 걸쳐 나눠 진행하셔도 괜찮아요. 컨텐츠 조회 기간은 결제 후 90일입니다.",
  },
  {
    question: "일반 심리 검사와 무엇이 다른가요?",
    answer:
      "일반 심리 검사는 진단 결과지로 끝나지만, 이 워크북은 진단 → 분석 → 심리학 기반 실습 → 실전 DO&DON'T 리스트까지 이어집니다. 직접 쓰는 라이팅 테라피로 감정이 정리되고, 실전 훈련으로 직장 생활의 문제까지 해결합니다.",
  },
  {
    question: "상담 없이 혼자 해도 효과가 있나요?",
    answer:
      "네. CBT(인지행동치료) 기반으로 설계돼 있어서 혼자서도 따라갈 수 있도록 구조화되어 있습니다. 라이팅 테라피 효과와 AI 기반 패턴 분석이 전문가의 질문을 대신해 줍니다. 더 깊은 해석이 필요하다면 '결과 해석 상담'을 추가로 이용하실 수 있어요.",
  },
  {
    question: "PC에서만 할 수 있나요?",
    answer:
      "작성 경험과 레이아웃 품질을 보장하기 위해 PC 환경을 권장드립니다. 모바일에서는 일부 작성 영역이 좁게 표시될 수 있어요.",
  },
  {
    question: "환불이 가능한가요?",
    answer:
      "워크북 1단계 진단을 시작하기 전까지는 전액 환불이 가능합니다. 진단을 시작한 이후에는 환불이 제한될 수 있으니, 카카오톡 gibun_studio로 먼저 문의해 주세요.",
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
    "회사를 그만두려고 마음먹었었는데, 워크북으로 내 문제가 뭔지 파악하고 마음이 편해지니까, 성취 중독이 풀리고 예전 퍼포먼스가 돌아왔어요. 성과도 좋아지고, 주변에서 '얼굴 좋아졌다'는 얘기를 자주 들어요. 진짜 '기분 마사지' 받은 느낌이었습니다.",
};

export const WORKBOOK_REVIEWS: WorkbookReview[] = [
  {
    badge: "워크북 수강 후기",
    content:
      "진단-리포트-실습-DO&DON'T까지 따라가면서, 머리로만 알던 제 패턴을 종이에 직접 풀어내니 마음이 스르륵 풀렸어요. 상담을 받은 것도 아닌데 진짜 '기분 마사지'를 받은 느낌입니다.",
    highlight: "라이팅 테라피라는 게 어떤 건지 처음으로 체감했어요.",
    name: "지현",
    age: "34세",
    occupation: "직장인 8년차",
  },
  {
    badge: "워크북 수강 후기",
    content:
      "사직서를 세 번이나 쓰다 지웠어요. 워크북 하면서 '문제는 회사가 아니라 내 자동적 사고'였다는 걸 알고 나니, 같은 상황인데 전혀 다르게 보이더라고요. 지금은 예전처럼 일에 집중할 수 있게 됐습니다.",
    highlight: "퇴사 직전이었는데, 다시 성과가 나오기 시작했어요.",
    name: "민수",
    age: "31세",
    occupation: "직장인 5년차",
  },
  {
    badge: "워크북 수강 후기",
    content:
      "마음에 쓰던 에너지가 일로 돌아오니까 같은 시간 일해도 결과물이 달라졌어요. 분기 평가에서 처음으로 상위 고과를 받았습니다. 실력이 갑자기 는 게 아니라, 원래 제 실력이 나오기 시작한 거예요.",
    highlight: "마음을 챙기니 정말 성과가 따라왔습니다.",
    name: "서연",
    age: "37세",
    occupation: "직장인 12년차",
  },
  {
    badge: "워크북 수강 후기",
    content:
      "요즘 주변에서 '얼굴 좋아졌다', '표정이 편해졌다'는 얘기를 자주 들어요. 저는 특별히 뭘 바꾼 적이 없는데, 워크북으로 내 안의 압박 구조를 풀어낸 이후로 몸과 얼굴이 같이 편해진 것 같습니다.",
    highlight: "얼굴 좋아졌다는 말을 이렇게 자주 들을 줄 몰랐어요.",
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
