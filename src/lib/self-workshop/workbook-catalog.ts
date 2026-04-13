/**
 * 마음 챙김 워크북 카탈로그
 * 워크북 추가/삭제 시 이 파일만 수정하면 목록 페이지에 자동 반영됩니다.
 */

export interface WorkbookInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  slug: string;
  features: string[];
  estimatedMinutes: string;
  comingSoon: boolean;
  order: number;
  illustration: string;
}

export const WORKBOOK_CATALOG: WorkbookInfo[] = [
  {
    id: "achievement-addiction",
    title: "성취 중독",
    subtitle: "멈출 수 없는 나를 위한 워크북",
    description:
      "멈출 수 없는 성취 욕구, 쉼에 대한 죄책감. CBT 기반 자가 진단과 실습으로 나만의 순환 패턴을 발견하고 대처법을 찾아보세요.",
    price: 99000,
    slug: "workbook-achievement",
    features: [
      "성취 중독 자가 진단 (20문항)",
      "나의 메커니즘 분석 + AI 교차검증",
      "인지 재구조화 · 행동 실험 · 자기 돌봄 워크시트",
      "전체 요약 리포트",
    ],
    estimatedMinutes: "65~100분",
    comingSoon: false,
    order: 1,
    illustration: "anchor-storm",
  },
  {
    id: "people-pleasing",
    title: "타인 중심 사고",
    subtitle: "나를 잃지 않는 관계를 위한 워크북",
    description:
      "거절이 어렵고, 남의 기분을 내 것보다 먼저 챙기나요? 나를 잃지 않으면서 관계를 유지하는 법을 찾아보세요.",
    price: 99000,
    slug: "workbook-people-pleasing",
    features: [
      "타인 중심 사고 자가 진단",
      "경계 설정 실습",
      "자기 욕구 탐색 워크시트",
      "관계 패턴 분석 리포트",
    ],
    estimatedMinutes: "60~90분",
    comingSoon: true,
    order: 2,
    illustration: "face-smile",
  },
  {
    id: "anxiety-loop",
    title: "불안 루프",
    subtitle: "같은 걱정이 반복되는 나를 위한 워크북",
    description:
      "같은 걱정이 끝없이 반복되나요? 불안의 구조를 이해하고, 반복을 끊는 나만의 방법을 만들어 보세요.",
    price: 99000,
    slug: "workbook-anxiety",
    features: [
      "불안 패턴 자가 진단",
      "걱정 사이클 분석 실습",
      "노출 기반 행동 실험",
      "이완 훈련 가이드",
    ],
    estimatedMinutes: "60~90분",
    comingSoon: true,
    order: 3,
    illustration: "arrow-squiggle",
  },
];

export function getWorkbookById(id: string) {
  return WORKBOOK_CATALOG.find((w) => w.id === id);
}
