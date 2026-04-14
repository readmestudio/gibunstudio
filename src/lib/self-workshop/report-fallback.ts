import {
  DIAGNOSIS_LEVELS,
  DIMENSIONS,
  type DiagnosisScores,
  type DimensionKey,
} from "./diagnosis";

const DIMENSION_PATTERN: Record<DimensionKey, string> = {
  conditional_self_worth:
    "성과가 있어야만 '내가 괜찮다'고 느껴지는 순간들 — 인정받지 못하면 존재 자체가 흔들리는 감각",
  compulsive_striving:
    "하나를 끝내면 곧바로 다음 목표를 찾는 습관 — 쉬는 시간마저 낭비처럼 느껴지는 조급함",
  fear_of_failure:
    "작은 실수도 오래 남는 완벽주의 — '완벽하지 않으면 의미 없다'는 생각이 자주 따라붙는 패턴",
  emotional_avoidance:
    "불편한 감정을 일로 덮는 방식 — 바쁨이 사실상 감정 회피의 도구가 되는 반복",
};

export function buildFallbackReport(
  scores: DiagnosisScores,
  userName: string | null
): string {
  const addressee = userName ? `${userName}님` : "당신";
  const levelInfo =
    DIAGNOSIS_LEVELS.find((l) => l.level === scores.level) ??
    DIAGNOSIS_LEVELS[DIAGNOSIS_LEVELS.length - 1];

  const sorted = [...DIMENSIONS].sort(
    (a, b) => scores.dimensions[b.key] - scores.dimensions[a.key]
  );
  const top1 = sorted[0];
  const top2 = sorted[1];

  const p1 =
    `${addressee}의 진단 점수는 ${scores.total}/100점, Level ${scores.level} ${levelInfo.name}입니다. ` +
    `${levelInfo.description}`;

  const p2 =
    `특히 "${top1.label}" 영역이 ${scores.dimensions[top1.key]}/25점으로 가장 두드러져요. ` +
    `이는 ${DIMENSION_PATTERN[top1.key]}이 일상에서 자주 나타날 가능성이 높다는 신호예요. ` +
    `여기에 "${top2.label}"(${scores.dimensions[top2.key]}/25점)도 함께 높은 편이라, ` +
    `${DIMENSION_PATTERN[top2.key]}도 겹쳐서 나타나는 패턴일 수 있어요.`;

  const p3 =
    `이 결과 자체가 문제인 것은 아닙니다. 다만 같은 패턴이 계속 반복되며 스스로를 소진시키고 있다면, ` +
    `그 안쪽에서 어떤 메커니즘이 작동하는지 이해할 가치가 있어요. ` +
    `지금부터 그 구조를 함께 살펴보겠습니다.`;

  return `${p1}\n\n${p2}\n\n${p3}`;
}
