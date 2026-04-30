/**
 * 핸드오프 §07 COPY DECK — P0/P1/P2 키워드별 카피.
 *
 * Stage 02 INSIGHT 카드와 Stage 06 REWRITE 카드 3종을 키워드별로 보유.
 * 카피 변경은 핸드오프 문서를 우선 출처로 함 — 이 파일은 그 사본.
 */

import type {
  GainCheckId,
  OriginCheckId,
  PrimaryKeyword,
  RewriteCardId,
} from "./belief-verification";

export interface RewriteCard {
  id: RewriteCardId;
  /** 모노 라벨 — STEP A · SOFTEN 형태 */
  stepLabel: string;
  /** 카드 본문 (큰 따옴표 안에 들어갈 신념의 더 정확한 버전) */
  body: string;
  /** "↳ 왜 이게 더 정확할까:" 부연 한 줄 */
  why: string;
}

/* ─────────────────────────── Stage 02 INSIGHT ─────────────────────────── */

/**
 * Stage 02 진입 시 본문 맨 위에 노출되는 키워드별 INSIGHT 카드의 closing brief.
 * P0/P1/P2 공통 — 다음 실습이 무엇인지 안내.
 */
export const STAGE_02_BRIEF =
  "앞서 발견한 핵심 믿음들이 어디서 시작됐는지, 당시의 나에게 어떤 베네핏을 줬는지 함께 살펴볼게요. 신념별로 짧게 답해보세요.";

export const STAGE_02_INSIGHT: Record<PrimaryKeyword, string> = {
  P0:
    "성취와 자기 가치를 연결하는 신념은 대부분 '잘 해냈을 때만 안전했던' " +
    "환경에서 형성돼요. 이건 잘못된 게 아니라, 한때 우리를 살아남게 해준 " +
    "적응이었어요. 다만 지금도 같은 강도로 작동할 필요는 없을 수 있어요.",
  P1:
    '"결국 실패할 것"이라는 예측은 보통 *기대가 꺾여본 경험*이 누적될 때 ' +
    "생겨요. 이건 당신이 약해서가 아니라, 마음이 다음 실망을 미리 막으려는 " +
    "보호 기제예요. 다만 그 보호가 *시작 자체*를 막을 때, 한 번 들여다볼 " +
    "가치가 있어요.",
  P2:
    '"부족한 모습이 드러나면 떠날 것"이라는 두려움은 보통 *조건부 사랑*을 ' +
    "경험했을 때 새겨져요. 한때 당신을 안전하게 보호해준 신념이지만, " +
    "지금은 진짜 가까워질 기회 자체를 막고 있을 수 있어요.",
};

/* ─────────────────────────── Stage 03 INSIGHT ─────────────────────────── */

/**
 * Stage 03 상단 INSIGHT 카드 본문 — P0/P1/P2 공통.
 * 양쪽 사실을 모으는 행위 자체의 의미를 설명.
 */
export const STAGE_03_INSIGHT =
  "신념은 한 가지 면만 보면 늘 사실로 느껴져요. " +
  "양쪽 사실을 같이 모아볼 때 비로소 *어디까지가 진짜인지* 가늠이 잡혀요. " +
  "신념을 부정하려는 게 아니라, 더 정확하게 보려는 작업이에요.";

/**
 * Stage 03 INSIGHT 카드 closing brief — 단계 안내.
 */
export const STAGE_03_BRIEF =
  "위에 정리된 핵심 신념을 떠올리며, 그 신념을 *지지하는 사실*과 " +
  "*사실이 아닐 수도 있는 증거*를 함께 모아볼게요. 감정이나 해석은 빼고, 사실만요.";

/* ─────────────────────────── Stage 06 REWRITE 카드 3종 ─────────────────────────── */

export const STAGE_06_CARDS: Record<PrimaryKeyword, [RewriteCard, RewriteCard, RewriteCard]> = {
  P0: [
    {
      id: "soften",
      stepLabel: "STEP A · SOFTEN",
      body:
        "성과는 내 가치의 *중요한 한 부분*이다. 다만, 성과가 잠시 없을 때도 " +
        "내 가치가 0이 되는 것은 아니다.",
      why:
        "'증명된다'는 결과가 0 또는 1이지만, 가치는 그렇게 움직이지 않아요.",
    },
    {
      id: "reframe",
      stepLabel: "STEP B · REFRAME",
      body:
        "성과를 내는 것은 내가 추구하는 *방향*이지, 내 가치의 *조건*은 " +
        "아니다.",
      why:
        "성취를 포기하라는 게 아니라, 성취가 가치의 입장권이 아니라는 뜻이에요.",
    },
    {
      id: "decouple",
      stepLabel: "STEP C · DECOUPLE",
      body:
        "내 가치는 내가 어떤 결과를 내는지와 *별개로* 존재한다. 결과는 내 " +
        "행동의 결과이지, 내 존재의 평가가 아니다.",
      why: "가치와 성과를 완전히 분리하는 관점이에요.",
    },
  ],
  P1: [
    {
      id: "soften",
      stepLabel: "STEP A · SOFTEN",
      body:
        "나는 어떤 환경에서 꾸준함을 잃는 *패턴*이 있다. 이건 영구적 결함이 " +
        "아니라 *조건에 반응하는 패턴*이다.",
      why:
        "'본질적'이라는 단어가 가장 무거워요. 본질이 아니라 패턴이라면, " +
        "패턴은 바꿀 수 있어요.",
    },
    {
      id: "reframe",
      stepLabel: "STEP B · REFRAME",
      body:
        "꾸준하지 못했던 *순간들*이 있었다. 동시에, 끝까지 해낸 *순간들*도 " +
        "있었다. 둘 다 나의 일부다.",
      why:
        "한 가지 패턴으로 자신을 정의하는 대신, 다양한 모습이 공존한다고 " +
        "보는 관점이에요.",
    },
    {
      id: "decouple",
      stepLabel: "STEP C · DECOUPLE",
      body:
        "결과를 못 내는 것은 내가 결함이 있어서가 아니라, 아직 *맞는 방법과 " +
        "환경*을 못 찾았기 때문일 수 있다.",
      why: "원인을 '나 자체'에서 '아직 찾지 못한 방법'으로 옮겨요.",
    },
  ],
  P2: [
    {
      id: "soften",
      stepLabel: "STEP A · SOFTEN",
      body:
        "어떤 사람은 내 부족함을 보고 멀어질 수도 있다. 하지만 *모든 사람*이 " +
        "그런 건 아니다.",
      why:
        "'모든 사람이 떠날 것'이라는 전체화를 '일부 사람'으로 좁혀요.",
    },
    {
      id: "reframe",
      stepLabel: "STEP B · REFRAME",
      body:
        "진짜 가까운 관계는, 내 부족한 모습을 *본 후에도* 남아있는 관계다. " +
        "부족함을 보이는 것이 진짜 관계를 거르는 과정일 수 있다.",
      why:
        "부족함을 보이는 것을 '위협'이 아니라 '관계의 검증'으로 보는 " +
        "관점이에요.",
    },
    {
      id: "decouple",
      stepLabel: "STEP C · DECOUPLE",
      body:
        "사람들이 나를 좋아하는 이유는 내가 완벽해서가 아니라, 내가 " +
        "*나*이기 때문이다. 부족함은 그 사람됨의 일부다.",
      why: "완벽함과 사랑받음을 분리해요.",
    },
  ],
};

/* ─────────────────────────── Stage 02 객관식 옵션 ─────────────────────────── */

export interface CheckOption<T extends string> {
  id: T;
  label: string;
  sub?: string;
}

/** Q1 — 신념의 기원: "어디서부터 왔을까?" */
export const STAGE_02_ORIGIN_OPTIONS: ReadonlyArray<CheckOption<OriginCheckId>> = [
  {
    id: "family",
    label: "가족의 기대 또는 비교",
    sub: "어릴 적 부모·형제 관계 안에서",
  },
  {
    id: "school",
    label: "학교의 평가나 등수",
    sub: "성적·발표·시험으로 매겨졌던 순간",
  },
  {
    id: "work",
    label: "직장·사회의 평가",
    sub: "상사 한마디·동료와의 비교",
  },
  {
    id: "peer",
    label: "또래 안에서의 경험",
    sub: "친구 그룹·인정받고 싶은 마음",
  },
  {
    id: "failure",
    label: "큰 실패나 실수 이후",
    sub: "한 번의 무너짐이 강하게 새겨짐",
  },
  {
    id: "single_remark",
    label: "어느 한 사람의 말 한마디",
    sub: "결정적인 한 문장이 오래 남음",
  },
  {
    id: "unknown",
    label: "잘 떠오르지 않아요",
    sub: "구체적인 사건이 없어도 괜찮아요",
  },
];

/** Q2 — 이 신념대로 살았을 때 얻었던 것: "무엇을 받았나?" */
export const STAGE_02_GAIN_OPTIONS: ReadonlyArray<CheckOption<GainCheckId>> = [
  {
    id: "approval",
    label: "인정",
    sub: "다른 사람의 칭찬·좋은 평가",
  },
  {
    id: "safety",
    label: "안전감",
    sub: "비난받거나 무시당하지 않음",
  },
  {
    id: "control",
    label: "통제감",
    sub: "예측 가능한 결과·관리되는 일상",
  },
  {
    id: "self_esteem",
    label: "자존감",
    sub: "스스로에 대한 확신",
  },
  {
    id: "belonging",
    label: "소속감",
    sub: "집단·관계 안에서의 자리",
  },
  {
    id: "avoidance",
    label: "회피",
    sub: "불안·실망에서 잠시 멀어지는 안도감",
  },
];

/* ─────────────────────────── Stage 03 EMPTY HINTS (counter 비어있을 때 순환) ─────────────────────────── */

export const STAGE_03_COUNTER_HINTS: string[] = [
  "최근 14일 동안 작은 약속이라도 지킨 적이 있었나요?",
  "프로젝트 일부라도 완성한 게 있나요? 미완이어도 끝까지 가본 부분이 있다면 그것도 사실이에요.",
  "주변 사람이 당신에 대해 했던 긍정적인 말이 떠오르나요?",
  "어제, 그제, 그 전날 — 사소하게 *해낸* 것이 있나요?",
];

/* ─────────────────────────── 공통 카피 ─────────────────────────── */

export const SHARED_COPY = {
  /** 헤더 영문 라벨 (모노) */
  reportLabel: "BELIEF VERIFICATION",
  /** Persistent Exit 라벨 */
  exitLabel: "지금은 여기까지 — 나중에 이어할게요",
  /** Pause Interstitial */
  pauseText: "잠시 숨 쉬세요.",
  pauseTextEn: "Take a breath.",
  /** Disclaimer 푸터 */
  disclaimer:
    "이 실습은 자기 이해를 돕는 도구이며, 임상 치료를 대체하지 않습니다. " +
    "지속적인 어려움이 있다면 전문가와 함께 다루는 것을 권합니다.",
} as const;

/* ─────────────────────────── 스테이지 메타 (헤더 라벨용) ─────────────────────────── */

export const STAGE_META: Record<
  1 | 2 | 3 | 4 | 5 | 6,
  { eyebrowEn: string; headlineKr: string; headlineEn: string }
> = {
  1: {
    eyebrowEn: "STAGE 01 — RECOGNIZE",
    headlineKr: "이 문장은 사실일까, 마음이 만든 가설일까",
    headlineEn: "What is this — a fact, or an interpretation?",
  },
  2: {
    eyebrowEn: "STAGE 02 — ORIGIN",
    headlineKr: "이 신념은 어디로부터 왔을까",
    headlineEn: "Where did this belief come from?",
  },
  3: {
    eyebrowEn: "STAGE 03 — EVIDENCE",
    headlineKr: "양쪽의 사실을 모아봐요",
    headlineEn: "Collect evidence from both sides.",
  },
  4: {
    eyebrowEn: "STAGE 04 — PERSPECTIVE",
    headlineKr: "가장 친한 친구가 같은 말을 한다면",
    headlineEn: "If your closest friend said the same thing.",
  },
  5: {
    eyebrowEn: "STAGE 05 — SPECTRUM",
    headlineKr: "흑백을 그라데이션으로",
    headlineEn: "Replace black-and-white with a spectrum.",
  },
  6: {
    eyebrowEn: "STAGE 06 — REWRITE",
    headlineKr: "더 정확한 버전을 골라보세요",
    headlineEn: "Choose a more accurate version.",
  },
};
