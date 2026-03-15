/**
 * 연애 애착 검사 — ECR-R(친밀 관계 경험 척도) 기반 24문항
 *
 * 5점 리커트 척도: 1=전혀 아니다 ~ 5=매우 그렇다
 * 2개 차원: 불안(anxiety) 12문항 + 회피(avoidance) 12문항
 * 역채점 문항 포함
 */

export interface AttachmentQuestion {
  id: number;
  text: string;
  dimension: "anxiety" | "avoidance";
  reverse: boolean;
}

export const ATTACHMENT_QUESTIONS: AttachmentQuestion[] = [
  // ── 불안(Anxiety) 차원: 12문항 ──
  {
    id: 1,
    text: "연인이 나를 정말 사랑하는지 자주 걱정된다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 2,
    text: "연인이 나만큼 나를 원하지 않을까 봐 두렵다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 3,
    text: "연인이 나를 떠날까 봐 자주 불안하다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 4,
    text: "연인이 다른 사람에게 관심을 보이면 마음이 많이 불편하다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 5,
    text: "연인에게 버림받을까 봐 걱정이 된다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 6,
    text: "연인이 연락이 없으면 무슨 일이 생긴 건 아닌지 불안해진다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 7,
    text: "나는 연인과의 관계에서 안정감을 잘 느끼는 편이다.",
    dimension: "anxiety",
    reverse: true,
  },
  {
    id: 8,
    text: "연인이 나에게 충분한 관심을 주지 않는 것 같아 속상할 때가 많다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 9,
    text: "연인이 나를 진심으로 아껴 주는지 확인하고 싶을 때가 많다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 10,
    text: "혼자 남겨지는 것이 두렵다.",
    dimension: "anxiety",
    reverse: false,
  },
  {
    id: 11,
    text: "나는 연인에 대해 크게 걱정하지 않는다.",
    dimension: "anxiety",
    reverse: true,
  },
  {
    id: 12,
    text: "연인과 떨어져 있으면 그 사람이 다른 누군가를 만나지 않을까 걱정된다.",
    dimension: "anxiety",
    reverse: false,
  },

  // ── 회피(Avoidance) 차원: 12문항 ──
  {
    id: 13,
    text: "연인에게 나의 속마음을 터놓는 것이 편하다.",
    dimension: "avoidance",
    reverse: true,
  },
  {
    id: 14,
    text: "누군가에게 너무 가까워지는 것이 불편하다.",
    dimension: "avoidance",
    reverse: false,
  },
  {
    id: 15,
    text: "나는 연인에게 의지하는 것이 어렵다.",
    dimension: "avoidance",
    reverse: false,
  },
  {
    id: 16,
    text: "연인과 지나치게 친밀해지면 부담스럽다.",
    dimension: "avoidance",
    reverse: false,
  },
  {
    id: 17,
    text: "나는 연인에게 마음을 여는 편이다.",
    dimension: "avoidance",
    reverse: true,
  },
  {
    id: 18,
    text: "연인이 너무 가까이 다가오면 뒤로 물러나고 싶어진다.",
    dimension: "avoidance",
    reverse: false,
  },
  {
    id: 19,
    text: "나는 혼자만의 시간이 연인과의 시간보다 더 편하다.",
    dimension: "avoidance",
    reverse: false,
  },
  {
    id: 20,
    text: "연인에게 도움을 요청하는 것이 불편하다.",
    dimension: "avoidance",
    reverse: false,
  },
  {
    id: 21,
    text: "나는 연인과 깊은 감정을 나누는 것이 자연스럽다.",
    dimension: "avoidance",
    reverse: true,
  },
  {
    id: 22,
    text: "연인에게 감정적으로 의존하게 되는 것이 싫다.",
    dimension: "avoidance",
    reverse: false,
  },
  {
    id: 23,
    text: "연인과 함께 있어도 진정한 친밀감을 느끼기 어렵다.",
    dimension: "avoidance",
    reverse: false,
  },
  {
    id: 24,
    text: "나는 연인과 가까운 관계를 유지하는 것이 편안하다.",
    dimension: "avoidance",
    reverse: true,
  },
];

export const TOTAL_QUESTIONS = ATTACHMENT_QUESTIONS.length;

/** 리커트 척도 라벨 */
export const LIKERT_LABELS = [
  "전혀 아니다",
  "별로 아니다",
  "보통이다",
  "약간 그렇다",
  "매우 그렇다",
] as const;

/** 4가지 애착 유형 */
export type AttachmentStyle = "secure" | "anxious" | "avoidant" | "fearful";

export interface AttachmentScores {
  anxiety: number; // 1~5 평균
  avoidance: number; // 1~5 평균
  style: AttachmentStyle;
}

/** 애착 유형 한국어 이름 */
export const ATTACHMENT_STYLE_NAMES: Record<AttachmentStyle, string> = {
  secure: "안정형",
  anxious: "불안형 (집착형)",
  avoidant: "회피형 (거부형)",
  fearful: "혼란형 (공포형)",
};

/** 애착 유형별 간단 설명 */
export const ATTACHMENT_STYLE_DESCRIPTIONS: Record<AttachmentStyle, string> = {
  secure:
    "관계에서 안정감을 느끼고, 상대에게 편안하게 의지하며, 친밀감을 자연스럽게 형성합니다.",
  anxious:
    "관계에서 불안을 자주 느끼고, 상대의 사랑을 확인받고 싶어 하며, 거절에 민감합니다.",
  avoidant:
    "친밀한 관계에서 거리를 두려 하고, 감정 표현이 어려우며, 독립성을 중시합니다.",
  fearful:
    "친밀감을 원하면서도 두려워하고, 관계에서 다가갔다 멀어지기를 반복합니다.",
};

/**
 * 채점 함수
 *
 * 각 차원별 평균 계산 (역채점 반영) 후 중간값(3.0) 기준으로 4유형 분류
 * - 안정형: 불안 < 3.0 & 회피 < 3.0
 * - 불안형: 불안 >= 3.0 & 회피 < 3.0
 * - 회피형: 불안 < 3.0 & 회피 >= 3.0
 * - 혼란형: 불안 >= 3.0 & 회피 >= 3.0
 */
export function calculateAttachmentScores(
  answers: Record<number, number>
): AttachmentScores {
  let anxietySum = 0;
  let anxietyCount = 0;
  let avoidanceSum = 0;
  let avoidanceCount = 0;

  for (const q of ATTACHMENT_QUESTIONS) {
    const raw = answers[q.id];
    if (raw === undefined) continue;

    // 역채점: 1↔5, 2↔4, 3은 그대로
    const score = q.reverse ? 6 - raw : raw;

    if (q.dimension === "anxiety") {
      anxietySum += score;
      anxietyCount++;
    } else {
      avoidanceSum += score;
      avoidanceCount++;
    }
  }

  const anxiety =
    anxietyCount > 0 ? Math.round((anxietySum / anxietyCount) * 100) / 100 : 0;
  const avoidance =
    avoidanceCount > 0
      ? Math.round((avoidanceSum / avoidanceCount) * 100) / 100
      : 0;

  let style: AttachmentStyle;
  if (anxiety < 3.0 && avoidance < 3.0) {
    style = "secure";
  } else if (anxiety >= 3.0 && avoidance < 3.0) {
    style = "anxious";
  } else if (anxiety < 3.0 && avoidance >= 3.0) {
    style = "avoidant";
  } else {
    style = "fearful";
  }

  return { anxiety, avoidance, style };
}
