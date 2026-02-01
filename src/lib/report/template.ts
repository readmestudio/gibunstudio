/**
 * 리포트 양식 템플릿
 * ChatGPT가 로우데이터를 기반으로 각 섹션 생성
 */
export const REPORT_SECTIONS = [
  "profile",
  "emotionChart",
  "frequentThoughts",
  "coreBeliefs",
  "originStory",
  "lifeImpact",
  "counselorSummary",
] as const;

export type ReportSection = (typeof REPORT_SECTIONS)[number];

export const REPORT_SECTION_LABELS: Record<ReportSection, string> = {
  profile: "검사 결과 프로파일",
  emotionChart: "지난 일주일간의 감정 분포도",
  frequentThoughts: "이 아이는 이런 생각을 자주 해요",
  coreBeliefs: "이 아이는 나와 타인, 세상에 대해 이렇게 철썩같이 믿어요",
  originStory: "이 아이는 왜 생겨났을까요?",
  lifeImpact: "이 아이는 나의 삶에 이렇게 영향을 미쳐요",
  counselorSummary: "상담사 총평",
};
