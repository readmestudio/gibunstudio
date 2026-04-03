/* ── 검사 카탈로그 ──
 * 모든 검사의 메타데이터를 한 곳에서 관리합니다.
 * 리스트 페이지(카드)와 상세 페이지 모두 이 데이터를 참조합니다.
 */

/* ── 타입 정의 ── */
export type TestCategory = "free" | "paid" | "package";

export interface TestDetail {
  hero: {
    hook: string;
    tagline: string;
  };
  socialProof: string[];
  painPoints: string[];
  cause: { before: string; highlight: string };
  insightLine: string;
  intro: { headline: string; body: string };
  testIntro: {
    question: string;
    answer: string;
    explanation: string;
  };
  comparison?: {
    rows: { label: string; ours: string; general: string }[];
  };
  specs: { questions: string; duration: string; target: string };
  deliverables: string[];
  steps: string[];
  faq: { q: string; a: string }[];
}

export interface TestInfo {
  id: string;
  category: TestCategory;
  title: string;
  description: string;
  price: string;
  testHref: string;
  /** true면 아직 판매하지 않고 알림신청만 받는 검사 */
  notifyOnly: boolean;
  detail: TestDetail;
}

/* ── 카테고리 메타 ── */
export const CATEGORY_LABELS: Record<TestCategory, string> = {
  free: "무료 검사",
  paid: "심리 검사",
  package: "토탈 패키지",
};

export const CATEGORY_ORDER: TestCategory[] = ["free", "paid", "package"];

/* ── 배경 이미지 (카드용) ── */
export const PROGRAM_BG = [
  "/program-bg/program-bg-1.png",
  "/program-bg/program-bg-2.png",
  "/program-bg/program-bg-1.png",
];

/* ── 전문가 정보 (모든 검사 상세 페이지 공통) ── */
export const EXPERT_PROFILE = {
  name: "김연지",
  title: "1급 심리상담사",
  description:
    "임상 현장에서 10년 이상 심리검사 해석과 상담을 진행해온 전문가입니다. 기분스튜디오의 모든 리포트는 김연지 상담사가 직접 작성합니다.",
};

/* ── 검사 데이터 ── */
export const TEST_CATALOG: TestInfo[] = [
  /* ───── 무료 검사 ───── */
  {
    id: "husband-match",
    category: "free",
    title: "나에게 맞는 배우자 검사",
    description:
      "유튜브 구독 목록으로 기질과 성격을 읽어요. 어떤 사람이 옆에 있으면 좋을지, 데이터가 말해줘요.",
    price: "검사·리포트 무료 / 세부 리포트 ₩9,900",
    testHref: "/husband-match/birth-info",
    notifyOnly: false,
    detail: {
      hero: {
        hook: "나와 맞는 사람,\n정말 알고 있나요?",
        tagline: "유튜브 구독 데이터로 읽는 나의 기질과 이상형",
      },
      socialProof: [
        "런칭 후 5,000명 이상 분석 완료",
        "TCI 기질 이론 기반 매칭 알고리즘",
      ],
      painPoints: [
        "나랑 맞는 사람이 어떤 사람인지 모르겠다",
        "연애할 때 항상 비슷한 패턴으로 힘들어진다",
        "이상형이라고 생각했는데 만나면 안 맞는다",
      ],
      cause: {
        before: "눈이 높아서가 아니라",
        highlight: "내 기질에 맞는 유형을 모르기 때문입니다",
      },
      insightLine:
        "내가 끌리는 이유, 관계에서 지치는 이유까지 데이터가 말해줍니다",
      intro: {
        headline: "유튜브 구독이 말해주는 나의 기질",
        body: "구독 채널에는 내 관심사, 가치관, 감정 패턴이 담겨 있어요. TCI 기질 이론을 기반으로 구독 데이터를 분석해 나와 잘 맞는 배우자 유형을 찾아드립니다.",
      },
      testIntro: {
        question: "좋아하는 유튜브가 연애랑 무슨 상관이야?",
        answer: "생각보다 많은 상관이 있습니다.",
        explanation:
          "유튜브 구독 목록에는 내가 무의식적으로 끌리는 콘텐츠, 가치관, 감정 처리 방식이 담겨 있어요. 이걸 TCI 기질 이론으로 분석하면 나에게 맞는 사람의 유형이 보입니다.",
      },
      specs: {
        questions: "유튜브 구독 연동",
        duration: "약 3분",
        target: "유튜브 구독 채널 10개 이상",
      },
      deliverables: [
        "TCI 6축 기질 분석 그래프",
        "11장 카드 리포트 (Spotify Wrapped 스타일)",
        "나에게 맞는 배우자 유형 매칭 결과",
      ],
      steps: [
        "유튜브 계정 연동 및 생년월일 입력",
        "AI가 구독 채널을 분석하고 기질을 도출",
        "11장 카드 리포트와 배우자 유형을 확인",
      ],
      faq: [
        {
          q: "구독 채널이 적어도 되나요?",
          a: "10개 이상이면 분석이 가능합니다. 채널이 많을수록 정확도가 높아져요.",
        },
        {
          q: "세부 리포트는 뭐가 다른가요?",
          a: "무료 리포트는 11장 카드 요약이고, 세부 리포트(₩9,900)는 기질별 심층 해석과 관계 조언이 포함됩니다.",
        },
        {
          q: "검사는 몇 번 할 수 있나요?",
          a: "1인 1회 제공됩니다. 한번 분석된 결과는 1년간 보관됩니다.",
        },
      ],
    },
  },
  {
    id: "core-belief",
    category: "free",
    title: "핵심 신념 검사",
    description:
      "25개 문장을 완성하면 돼요. 나에 대한 믿음, 타인에 대한 믿음, 세상에 대한 믿음. 무의식에 적혀 있던 것들이 보여요.",
    price: "검사 무료 / 세부 리포트 ₩9,900",
    testHref: "/self-hacking/core-belief",
    notifyOnly: true,
    detail: {
      hero: {
        hook: "왜 나는 항상\n같은 실수를 반복할까?",
        tagline: "25개 문장이 드러내는 무의식 속 핵심 신념",
      },
      socialProof: [
        "CBT 인지행동치료 기반 검사",
        "AI 분석으로 즉시 결과 확인",
      ],
      painPoints: [
        "같은 실수를 반복하는 이유를 모르겠다",
        "자존감이 낮다는 걸 알지만 어디서부터 바꿔야 할지 모르겠다",
        "머리로는 아는데 감정이 따라가지 않는다",
      ],
      cause: {
        before: "의지가 부족해서가 아니라",
        highlight: "무의식에 새겨진 핵심 신념 때문입니다",
      },
      insightLine:
        "바꿔야 할 건 성격이 아니라, 무의식에 적힌 믿음입니다",
      intro: {
        headline: "문장 완성으로 읽는 무의식의 믿음",
        body: "핵심 신념은 어린 시절 형성되어 지금도 나의 선택과 감정에 영향을 미치는 깊은 믿음이에요. 25개 문장을 완성하면 AI가 세 가지 축(나/타인/세상)으로 분석해드립니다.",
      },
      testIntro: {
        question: "자존감이 낮은 건 타고난 성격 때문이다?",
        answer: "아닙니다. 학습된 믿음입니다.",
        explanation:
          "핵심 신념은 어린 시절 경험에서 만들어진 '나/타인/세상에 대한 무의식적 믿음'이에요. 이 믿음이 지금도 선택, 감정, 관계 패턴을 지배하고 있습니다. 알아야 바꿀 수 있어요.",
      },
      specs: {
        questions: "25문항",
        duration: "약 10분",
        target: "성인 누구나",
      },
      deliverables: [
        "핵심 신념 3축 분석 (나/타인/세상)",
        "신념 패턴 요약 리포트",
        "변화를 위한 인지 리프레이밍 가이드",
      ],
      steps: [
        "25개 문장 빈칸을 자유롭게 완성",
        "AI가 응답 패턴을 분석하고 핵심 신념을 도출",
        "3축 분석 리포트와 리프레이밍 가이드를 확인",
      ],
      faq: [
        {
          q: "문장을 잘 못 쓰면 어떡하나요?",
          a: "정답은 없어요. 떠오르는 대로 쓰는 것이 가장 정확한 결과를 만듭니다.",
        },
        {
          q: "세부 리포트는 뭐가 다른가요?",
          a: "무료 리포트는 핵심 신념 요약이고, 세부 리포트(₩9,900)는 신념의 형성 원인과 구체적인 변화 전략이 포함됩니다.",
        },
      ],
    },
  },
  {
    id: "attachment",
    category: "free",
    title: "연애 애착 검사",
    description:
      "24문항이에요. 가까워지고 싶으면서 두려운 마음, 불안과 회피 두 축으로 풀어봐요.",
    price: "검사 무료 / 세부 리포트 ₩9,900",
    testHref: "/self-hacking/attachment",
    notifyOnly: true,
    detail: {
      hero: {
        hook: "가까워지면\n왜 불안해질까?",
        tagline: "24문항으로 읽는 나의 연애 애착 유형",
      },
      socialProof: [
        "애착 이론 기반 심리학 표준 검사",
        "AI 분석으로 즉시 결과 확인",
      ],
      painPoints: [
        "연인이 연락이 안 되면 불안해서 견딜 수 없다",
        "가까워질수록 도망치고 싶어진다",
        "좋아하는데 표현을 못 해서 관계가 멀어진다",
      ],
      cause: {
        before: "사랑을 못 해서가 아니라",
        highlight: "애착 패턴이 관계를 방해하기 때문입니다",
      },
      insightLine:
        "연애가 힘든 건 상대 탓이 아니라, 어린 시절 만들어진 패턴 때문입니다",
      intro: {
        headline: "불안과 회피, 두 축으로 읽는 연애 패턴",
        body: "애착 이론은 어린 시절 양육자와의 관계에서 형성된 패턴이 성인 연애에도 반복된다고 봅니다. 24문항으로 나의 애착 유형(안정/불안/회피/혼란)을 파악해보세요.",
      },
      testIntro: {
        question: "연애를 못하는 건 경험이 부족해서다?",
        answer: "아닙니다. 애착 패턴의 문제입니다.",
        explanation:
          "애착 유형은 생후 18개월 전후로 양육자와의 관계에서 형성됩니다. 이 패턴이 성인이 된 지금도 연애에서 그대로 반복돼요. 내 패턴을 알면 관계가 달라집니다.",
      },
      specs: {
        questions: "24문항",
        duration: "약 5분",
        target: "성인 누구나",
      },
      deliverables: [
        "애착 유형 판정 (안정/불안/회피/혼란)",
        "불안-회피 2축 그래프",
        "연애 패턴 분석 및 관계 개선 가이드",
      ],
      steps: [
        "24개 문항에 솔직하게 응답",
        "AI가 불안-회피 두 축을 분석",
        "애착 유형 리포트와 관계 개선 팁을 확인",
      ],
      faq: [
        {
          q: "연애 경험이 없어도 할 수 있나요?",
          a: "네, 가까운 관계(가족, 친구)를 떠올리며 응답해도 유의미한 결과가 나옵니다.",
        },
        {
          q: "세부 리포트는 뭐가 다른가요?",
          a: "무료 리포트는 유형 판정과 요약이고, 세부 리포트(₩9,900)는 패턴의 형성 원인과 구체적인 관계 개선 전략이 포함됩니다.",
        },
      ],
    },
  },

  /* ───── 유료 심리 검사 ───── */
  {
    id: "tci",
    category: "paid",
    title: "TCI 기질성격검사",
    description:
      "타고난 기질과 발달된 성격을 과학적으로 분석합니다. 1급 심리상담사가 직접 해석 리포트를 작성해드려요.",
    price: "₩29,900",
    testHref: "/self-hacking/tci/payment",
    notifyOnly: true,
    detail: {
      hero: {
        hook: "나는 누구지?",
        tagline: "TCI 검사로 알아보는 타고난 기질과 29가지 심리 척도",
      },
      socialProof: [
        "런칭 후 20,000명 이상 실시",
        "개인 심리검사 누적 40,000건 이상",
        "1급 심리상담사 직접 해석",
      ],
      painPoints: [
        "사람 관계가 반복해서 힘들다",
        "감정 소모가 크고 쉽게 지친다",
        "내가 왜 이런 선택을 하는지 모르겠다",
      ],
      cause: {
        before: "의지가 부족해서가 아니라",
        highlight: "타고난 기질을 모르기 때문입니다",
      },
      insightLine:
        "지금의 고민이 왜 반복되는지, 앞으로 어떤 선택이 맞는지까지 이해할 수 있습니다",
      intro: {
        headline: "기질과 성격, 과학으로 읽다",
        body: "TCI(Temperament and Character Inventory)는 타고난 기질(유전)과 변화하는 성격(발달)을 함께 분석하는 검사입니다. 왜 특정 상황에서 늘 같은 반응이 나오는지, 어떤 관계에서 에너지가 채워지고 소모되는지를 과학적으로 이해할 수 있어요.",
      },
      testIntro: {
        question: "사람은 고쳐 쓰는 거 아니다?",
        answer: "반은 맞고, 반은 틀립니다.",
        explanation:
          "TCI 검사는 타고난 기질(유전)과 발달된 성격(환경)을 구분합니다. 기질은 바뀌지 않지만 성격은 변할 수 있어요. 무엇이 타고난 것이고 무엇이 바꿀 수 있는 것인지, 그 경계를 아는 것이 시작입니다.",
      },
      comparison: {
        rows: [
          {
            label: "과학적 신뢰도",
            ours: "높음 (표준화 검사)",
            general: "낮음",
          },
          {
            label: "개인 맞춤 해석",
            ours: "1급 심리상담사 직접 해석",
            general: "없음 (자동 결과만)",
          },
          {
            label: "적용 영역",
            ours: "가족 / 연인 / 친구 / 직장",
            general: "제한적",
          },
        ],
      },
      specs: {
        questions: "140문항",
        duration: "약 20분",
        target: "성인",
      },
      deliverables: [
        "TCI 7축 결과 그래프",
        "기질-성격 종합 해석 보고서 (김연지 1급 심리상담사 직접 작성)",
      ],
      steps: [
        "결제 완료",
        "카카오톡 / 이메일로 검사 링크 발송",
        "온라인 검사 실시 (140문항, 약 20분)",
        "카카오톡으로 리포트 완료 알림",
        "사이트 내 리포트 확인",
      ],
      faq: [
        {
          q: "검사 링크는 언제 받나요?",
          a: "결제 완료 후 24시간 이내에 카카오톡과 이메일로 발송됩니다.",
        },
        {
          q: "리포트는 얼마나 걸리나요?",
          a: "검사 완료 후 영업일 기준 3~5일 이내에 리포트가 완성됩니다.",
        },
        {
          q: "환불이 가능한가요?",
          a: "검사 링크 발송 전에는 전액 환불 가능합니다. 검사 실시 후에는 환불이 불가합니다. 환불 신청은 카카오톡 gibun_studio로 문의해주세요.",
        },
      ],
    },
  },
  {
    id: "mmpi",
    category: "paid",
    title: "MMPI 다면적 인성검사",
    description:
      "세계적으로 가장 널리 사용되는 심리검사로, 다면적 인성을 과학적으로 분석합니다. 1급 심리상담사가 직접 해석합니다.",
    price: "₩29,900",
    testHref: "/self-hacking/mmpi/payment",
    notifyOnly: true,
    detail: {
      hero: {
        hook: "내 마음,\n지금 괜찮은 걸까?",
        tagline: "567문항이 그려내는 마음의 정밀 지도, MMPI",
      },
      socialProof: [
        "세계에서 가장 널리 사용되는 심리검사",
        "임상 심리 현장 60년 이상 활용",
        "1급 심리상담사 직접 해석",
      ],
      painPoints: [
        "나도 모르는 내 마음의 상태가 궁금하다",
        "스트레스를 받으면 유독 힘든 이유를 알고 싶다",
        "심리 상담 전에 나를 객관적으로 파악하고 싶다",
      ],
      cause: {
        before: "마음이 약해서가 아니라",
        highlight: "내면의 심리 패턴을 모르기 때문입니다",
      },
      insightLine:
        "막연한 불안의 정체를 알면, 마음을 다루는 방법도 보입니다",
      intro: {
        headline: "567문항이 그리는 마음의 지도",
        body: "MMPI(Minnesota Multiphasic Personality Inventory)는 세계적으로 가장 널리 사용되는 심리검사입니다. 다면적 인성을 과학적으로 분석해 지금 내 마음의 상태를 객관적으로 파악할 수 있어요.",
      },
      testIntro: {
        question: "마음이 힘든 건 약해서가 아니다?",
        answer: "맞습니다. 패턴의 문제입니다.",
        explanation:
          "MMPI는 10개 임상 척도로 내면의 심리 패턴을 정밀하게 분석합니다. 불안, 우울, 스트레스 반응 — 원인을 객관적으로 파악하면 적절한 대처 방법을 찾을 수 있어요.",
      },
      comparison: {
        rows: [
          {
            label: "과학적 신뢰도",
            ours: "높음 (세계 표준 검사)",
            general: "낮음",
          },
          {
            label: "개인 맞춤 해석",
            ours: "1급 심리상담사 직접 해석",
            general: "없음 (자동 결과만)",
          },
          {
            label: "분석 깊이",
            ours: "10개 임상 척도 + 내용 척도",
            general: "단일 유형 분류",
          },
        ],
      },
      specs: {
        questions: "567문항",
        duration: "약 40~60분",
        target: "성인",
      },
      deliverables: [
        "MMPI 결과 프로파일 그래프",
        "다면적 인성 종합 해석 보고서 (김연지 1급 심리상담사 직접 작성)",
      ],
      steps: [
        "결제 완료",
        "카카오톡 / 이메일로 검사 링크 발송",
        "온라인 검사 실시 (567문항, 약 40~60분)",
        "카카오톡으로 리포트 완료 알림",
        "사이트 내 리포트 확인",
      ],
      faq: [
        {
          q: "567문항이면 너무 많지 않나요?",
          a: "문항 수가 많지만 대부분 예/아니오로 답하기 때문에 40~60분 정도면 충분합니다. 중간에 저장하고 이어서 할 수도 있어요.",
        },
        {
          q: "리포트는 얼마나 걸리나요?",
          a: "검사 완료 후 영업일 기준 3~5일 이내에 리포트가 완성됩니다.",
        },
        {
          q: "환불이 가능한가요?",
          a: "검사 링크 발송 전에는 전액 환불 가능합니다. 검사 실시 후에는 환불이 불가합니다. 환불 신청은 카카오톡 gibun_studio로 문의해주세요.",
        },
      ],
    },
  },
];

/* ── 유틸리티 ── */
export function getTestById(id: string): TestInfo | undefined {
  return TEST_CATALOG.find((t) => t.id === id);
}

export function getTestsByCategory(category: TestCategory): TestInfo[] {
  return TEST_CATALOG.filter((t) => t.category === category);
}
