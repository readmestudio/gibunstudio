import type { BasicEmotion } from "./emotion-mapping";

export type Step2Answer = {
  questionId: number;
  emotion: BasicEmotion;
  weight: number; // 1 or 0.5
};

export function computeResult(
  step2Answers: Step2Answer[],
  step1Basics: BasicEmotion[]
): { primary: BasicEmotion; secondary: BasicEmotion[] } {
  const scores: Record<BasicEmotion, number> = {
    joy: 0,
    trust: 0,
    fear: 0,
    surprise: 0,
    sadness: 0,
    disgust: 0,
    anger: 0,
    anticipation: 0,
  };

  step2Answers.forEach(({ emotion, weight }) => {
    scores[emotion] = (scores[emotion] ?? 0) + weight;
  });

  const sorted = (Object.entries(scores) as [BasicEmotion, number][])
    .sort(([, a], [, b]) => b - a);

  let primary = sorted[0][0];
  let secondary: BasicEmotion[] = [sorted[1][0], sorted[2][0]];

  // 동점 처리: Q10~Q12 (최근성 가중치)
  const lastThreeAnswers = step2Answers.filter((a) => a.questionId >= 10);
  const step1Set = new Set(step1Basics);

  const resolveTie = (a: BasicEmotion, b: BasicEmotion): BasicEmotion => {
    const aInLast = lastThreeAnswers.some((ans) => ans.emotion === a);
    const bInLast = lastThreeAnswers.some((ans) => ans.emotion === b);
    if (aInLast && !bInLast) return a;
    if (bInLast && !aInLast) return b;
    if (step1Set.has(a) && !step1Set.has(b)) return a;
    if (step1Set.has(b) && !step1Set.has(a)) return b;
    return a;
  };

  // primary/secondary 동점 처리
  if (sorted[0][1] === sorted[1][1]) {
    primary = resolveTie(sorted[0][0], sorted[1][0]);
    secondary = [primary === sorted[0][0] ? sorted[1][0] : sorted[0][0], sorted[2][0]];
  }
  if (sorted[1][1] === sorted[2][1]) {
    secondary[1] = resolveTie(sorted[1][0], sorted[2][0]);
    if (secondary[1] === sorted[1][0]) secondary[0] = sorted[2][0];
  }

  return { primary, secondary };
}
