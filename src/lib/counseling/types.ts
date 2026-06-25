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
  /** true면 아직 판매하지 않고 알림신청만 받는 상담 */
  notifyOnly: boolean;
  /** true면 일반 가격표(PricingTable 등)에 노출하지 않음 — 통일 결제 페이지 전용 상품 */
  hidden?: boolean;
}

export const COUNSELING_TYPES: CounselingType[] = [
  // ── 통일 결제 페이지(/payment/start) 전용 상담 상품 ──
  // 모든 무료 테스트(성취중독·minds·멘탈헬스)의 마지막 결제 화면에서 공통으로 노출.
  // 결제 유도 기본가는 1회 체험(₩129,000). 일반 가격표에는 hidden 처리.
  {
    id: "trial",
    title: "1회 체험 상담",
    price: 129000,
    priceLabel: "129,000",
    duration: "50분",
    requirement: null,
    description:
      "유료 심리검사부터 1급 심리상담사의 50분 1:1 화상 상담까지, 검사·해석·상담을 한 번에 경험하는 1회 체험 상담입니다.",
    recommended: "상담이 처음이라 1회 먼저 경험해보고 싶은 분",
    features: [
      { text: "유료 심리검사 (MMPI·TCI 등) 실시", included: true },
      { text: "검사 결과 전문 해석 상담", included: true },
      { text: "1급 심리상담사 50분 1:1 화상 상담", included: true },
      { text: "사전 질문지 + 사후 리포트", included: true },
    ],
    notifyOnly: false,
    hidden: true,
  },
  {
    id: "package-8",
    title: "8회 패키지",
    price: 792000,
    priceLabel: "792,000",
    duration: "주 1회 · 50분",
    requirement: null,
    description:
      "주 1회·회당 50분, 8회차 구조화 커리큘럼으로 진행하는 정규 심리상담 패키지입니다. 회당 99,000원으로 1회 체험가보다 저렴합니다.",
    recommended: "구조화된 커리큘럼으로 끝까지 변화를 만들고 싶은 분",
    features: [
      { text: "8회차 구조화 커리큘럼 전체 진행", included: true },
      { text: "유료 심리검사 (MMPI·TCI 등) + 전문 해석", included: true },
      { text: "매 회차 사전 질문지 + 사후 리포트 + 심층 분석", included: true },
      { text: "8회 종합 리포트 (전체 여정 정리)", included: true },
      { text: "회당 99,000원 — 1회 체험가 대비 23% 할인", included: true },
    ],
    notifyOnly: false,
    hidden: true,
  },
  {
    id: "report-interpret",
    title: "결과 해석 상담",
    price: 80000,
    priceLabel: "80,000",
    duration: "1시간",
    requirement: "셀프 검사 리포트 보유자",
    description:
      "셀프 해킹 프로그램의 결과를 한국상담심리학회 1급 심리 상담사가 심층 해석해주는 상담입니다.",
    recommended: "셀프 해킹 리포트를 받고 더 깊이 이해하고 싶은 분",
    features: [
      { text: "셀프 해킹 리포트 심층 해석", included: true },
      { text: "핵심 신념 패턴 분석", included: true },
      { text: "맞춤 성장 방향 제시", included: true },
      { text: "Zoom 화상 상담", included: true },
      { text: "심리검사 포함", included: false },
    ],
    notifyOnly: false,
  },
  {
    id: "relationship",
    title: "관계 해석 상담 (2인)",
    price: 150000,
    priceLabel: "150,000",
    duration: "1시간",
    requirement: "2인 모두 참여 필요",
    description:
      "커플/부부가 함께 서로의 관계 패턴을 해독하고, 반복되는 갈등의 구조적 원인을 찾는 상담입니다.",
    recommended: "결혼을 앞둔 커플, 관계 개선을 원하는 부부",
    features: [
      { text: "2인 동시 참여 Zoom 상담", included: true },
      { text: "관계 패턴 교차 분석", included: true },
      { text: "갈등 원인 탐색", included: true },
      { text: "커뮤니케이션 가이드", included: true },
      { text: "심리검사 포함", included: false },
    ],
    notifyOnly: false,
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
    notifyOnly: false,
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
    notifyOnly: false,
  },
  {
    id: "mind-spill",
    title: "마음 정리 50분 상담",
    price: 99000,
    priceLabel: "99,000",
    duration: "50분",
    requirement: "Mind Spill 워크북 작성자",
    description:
      "Mind Spill 워크북에서 발견한 마음의 주제를 한국상담심리학회 1급 심리 상담사와 50분 동안 깊이 다루는 1:1 상담입니다.",
    recommended: "워크북을 쓰며 반복되는 패턴을 발견했고, 혼자가 아니라 전문가와 함께 짚어보고 싶은 분",
    features: [
      { text: "워크북 리포트 기반 1:1 Zoom 상담", included: true },
      { text: "코치 리포트에서 짚은 주제 심층 탐색", included: true },
      { text: "반복되는 생각·감정 패턴 분석", included: true },
      { text: "맞춤 성장 방향 제시", included: true },
      { text: "심리검사 포함", included: false },
    ],
    notifyOnly: false,
  },
];

export type CounselingTypeId = (typeof COUNSELING_TYPES)[number]["id"];

/** id로 상담 유형 조회 */
export function getCounselingType(id: string): CounselingType | undefined {
  return COUNSELING_TYPES.find((t) => t.id === id);
}

/** 최대 선택 가능 슬롯 수 (상담사와 시간 조율용) */
export const MAX_SLOT_SELECTIONS = 3;
