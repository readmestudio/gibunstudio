/**
 * 상담 유형 상수 정의
 * 프라이싱, 상담 페이지, 예약, 결제에서 공통 사용
 */

export interface CounselingType {
  id: string;
  title: string;
  price: number;
  priceLabel: string;
  duration: string;
  requirement: string | null;
  description: string;
  recommended: string;
  features: { text: string; included: boolean }[];
}

export const COUNSELING_TYPES: CounselingType[] = [
  {
    id: "report-interpret",
    title: "리포트 해석 상담",
    price: 80000,
    priceLabel: "80,000",
    duration: "1시간",
    requirement: "7일 내면 아이 찾기 프로그램 수료자",
    description:
      "7일 내면 아이 찾기 결과 리포트를 전문 상담사가 심층 해석해주는 상담입니다.",
    recommended: "7일 프로그램을 완료하고 결과를 더 깊이 이해하고 싶은 분",
    features: [
      { text: "7일 리포트 심층 해석", included: true },
      { text: "핵심 신념 패턴 분석", included: true },
      { text: "맞춤 성장 방향 제시", included: true },
      { text: "Zoom 화상 상담", included: true },
      { text: "심리검사 포함", included: false },
    ],
  },
  {
    id: "relationship",
    title: "관계 해석 상담 (2인)",
    price: 150000,
    priceLabel: "150,000",
    duration: "1시간",
    requirement: "2인 모두 참여 필요",
    description:
      "커플/부부가 함께 관계 패턴을 탐색하고, 서로의 내면을 이해하는 상담입니다.",
    recommended: "결혼을 앞둔 커플, 관계 개선을 원하는 부부",
    features: [
      { text: "2인 동시 참여 Zoom 상담", included: true },
      { text: "관계 패턴 교차 분석", included: true },
      { text: "갈등 원인 탐색", included: true },
      { text: "커뮤니케이션 가이드", included: true },
      { text: "심리검사 포함", included: false },
    ],
  },
  {
    id: "test-package",
    title: "심리검사 패키지 상담",
    price: 200000,
    priceLabel: "200,000",
    duration: "1시간",
    requirement: null,
    description:
      "유료 심리검사 3종을 포함한 풀패키지 상담으로 자신을 심층적으로 알아봅니다.",
    recommended: "자신을 더 깊이 알고 싶은 분",
    features: [
      { text: "유료 심리검사 3종 포함", included: true },
      { text: "검사 결과 전문 해석", included: true },
      { text: "맞춤 상담 진행", included: true },
      { text: "Zoom 화상 상담", included: true },
      { text: "후속 관리 안내", included: true },
    ],
  },
  {
    id: "personal",
    title: "1:1 심리 상담",
    price: 100000,
    priceLabel: "100,000",
    duration: "1시간",
    requirement: null,
    description:
      "이별, 불안, 우울 등 개인 고민에 맞춘 1:1 심리 상담입니다.",
    recommended: "개인적 어려움으로 상담이 필요한 분",
    features: [
      { text: "1:1 Zoom 화상 상담", included: true },
      { text: "개인 맞춤 상담 진행", included: true },
      { text: "후속 관리 안내", included: true },
      { text: "심리검사 포함", included: false },
      { text: "관계 패턴 분석", included: false },
    ],
  },
];

export type CounselingTypeId = (typeof COUNSELING_TYPES)[number]["id"];

/** id로 상담 유형 조회 */
export function getCounselingType(id: string): CounselingType | undefined {
  return COUNSELING_TYPES.find((t) => t.id === id);
}

/** 최대 선택 가능 슬롯 수 (상담사와 시간 조율용) */
export const MAX_SLOT_SELECTIONS = 3;
