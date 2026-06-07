/**
 * Young 심리도식 18가지 (한국판 YSQ-S3-K) — Step 4 도식 판별 자료.
 *
 * 출처:
 * - 한국판 YSQ-S3-K 90문항 + 채점기록지 (최영희·이동우 역, 2017, 인싸이트)
 * - 18 도식 특성·기원 자료 (사용자 PDF 41~69 슬라이드)
 *
 * 사용자에게는 도식 이름·해석을 가설형으로만 노출. 단정 진단 금지.
 * "도식"이라는 용어 자체는 노출 가능하지만 화면에서는 "마음의 패턴" 같은
 * 더 부드러운 표현도 같이 쓴다.
 */

/* ─────────────────── 타입 ─────────────────── */

export type SchemaCode =
  | "ED" // 정서적 결핍
  | "AB" // 유기
  | "MA" // 불신/학대
  | "SI" // 사회적 고립
  | "DS" // 결함/수치심
  | "FA" // 실패
  | "DI" // 의존/무능감
  | "VH" // 위험/질병에 대한 취약성
  | "EM" // 융합/미발달된 자기
  | "SB" // 복종
  | "SS" // 자기희생
  | "EI" // 정서적 억제
  | "US" // 엄격한 기준/과잉비판
  | "ET" // 특권의식
  | "IS" // 부족한 자기 통제
  | "AS" // 승인/인정추구
  | "NP" // 부정적/비관주의
  | "PU"; // 처벌

export type SchemaDomain =
  | "I_disconnection" // 단절 및 거부
  | "II_impaired_autonomy" // 손상된 자율성 및 수행
  | "III_impaired_limits" // 손상된 한계
  | "IV_other_directedness" // 타인 지향성
  | "V_overvigilance"; // 과잉경계 및 억제

export interface Schema {
  code: SchemaCode;
  /** 채점기록지 순서 (1~18). */
  number: number;
  name_ko: string;
  name_en: string;
  domain: SchemaDomain;
  /** YSQ-S3 90문항 중 이 도식에 해당하는 5개 문항 번호. */
  items: [number, number, number, number, number];
  /** 도식 특성 (사용자 PDF 또는 표준 자료에서). */
  traits: string[];
  /** 발달적 기원 (어릴 적 환경·경험). */
  origin: string[];
  /** 출처가 사용자 PDF인지 (true), 표준 보완인지 (false). 검수 표시용. */
  source_user_pdf: boolean;
}

/* ─────────────────── 5 도식 도메인 ─────────────────── */

export interface SchemaDomainDef {
  code: SchemaDomain;
  name_ko: string;
  description_ko: string;
  schemas: SchemaCode[];
}

export const SCHEMA_DOMAINS: SchemaDomainDef[] = [
  {
    code: "I_disconnection",
    name_ko: "단절 및 거부",
    description_ko:
      "안전한 애착, 정서적 욕구, 수용·소속의 욕구가 어린 시절 충분히 채워지지 않은 영역",
    schemas: ["ED", "AB", "MA", "SI", "DS"],
  },
  {
    code: "II_impaired_autonomy",
    name_ko: "손상된 자율성 및 수행",
    description_ko: "혼자 생존하거나 성공하기 어렵다고 믿는 영역",
    schemas: ["FA", "DI", "VH", "EM"],
  },
  {
    code: "III_impaired_limits",
    name_ko: "손상된 한계",
    description_ko: "충동·욕구 조절, 책임감의 한계가 약한 영역",
    schemas: ["ET", "IS"],
  },
  {
    code: "IV_other_directedness",
    name_ko: "타인 지향성",
    description_ko: "타인의 인정·욕구를 위해 자기 욕구를 억압하는 영역",
    schemas: ["SB", "SS", "AS"],
  },
  {
    code: "V_overvigilance",
    name_ko: "과잉경계 및 억제",
    description_ko: "실수 방지·규칙 준수에 과도하게 집착하는 영역",
    schemas: ["EI", "US", "NP", "PU"],
  },
];

/* ─────────────────── 18 도식 데이터 ─────────────────── */

export const SCHEMA_18: Schema[] = [
  {
    code: "ED",
    number: 1,
    name_ko: "정서적 결핍",
    name_en: "Emotional Deprivation",
    domain: "I_disconnection",
    items: [1, 19, 37, 55, 73],
    traits: [
      "사랑받을 수 없다고 느낌",
      "이해받고 싶지만 표현하지 못함",
      "속으로 분노가 축적됨",
      "돌봄을 요구하면서도 비난함",
    ],
    origin: ["애정과 관심의 부족", "정서적 돌봄의 부족"],
    source_user_pdf: true,
  },
  {
    code: "AB",
    number: 2,
    name_ko: "유기",
    name_en: "Abandonment / Instability",
    domain: "I_disconnection",
    items: [2, 20, 38, 56, 74],
    traits: [
      "가까운 사람들이 떠날까 두려워 매달리게 됨",
      "혼자 있는 것에 대한 강한 불안",
      "상대의 작은 거리감에도 과민",
      "잃을까 봐 걱정이 끊이지 않음",
    ],
    origin: [
      "주요 양육자의 일관되지 않은 돌봄",
      "이별·상실·예측 불가능한 양육 환경",
    ],
    source_user_pdf: false,
  },
  {
    code: "MA",
    number: 3,
    name_ko: "불신/학대",
    name_en: "Mistrust / Abuse",
    domain: "I_disconnection",
    items: [3, 21, 39, 57, 75],
    traits: [
      "사람들이 결국 나를 이용하거나 해칠 것이라 믿음",
      "타인에게 경계심·방어적 태도",
      "친밀해지는 것을 회피",
      "고의로 해를 입힐 것 같은 느낌",
    ],
    origin: ["학대·배신·괴롭힘 경험", "신뢰가 반복적으로 깨진 환경"],
    source_user_pdf: false,
  },
  {
    code: "SI",
    number: 4,
    name_ko: "사회적 고립",
    name_en: "Social Isolation / Alienation",
    domain: "I_disconnection",
    items: [4, 22, 40, 58, 76],
    traits: [
      "소속되지 못했다고 느낌",
      "열등감",
      "외로움",
      "타인의 평가에 민감",
    ],
    origin: ["외모·말더듬 등으로 괴롭힘 경험", "가족의 사회적 고립"],
    source_user_pdf: true,
  },
  {
    code: "DS",
    number: 5,
    name_ko: "결함/수치심",
    name_en: "Defectiveness / Shame",
    domain: "I_disconnection",
    items: [5, 23, 41, 59, 77],
    traits: [
      "자신을 결함 있는 존재로 느낌",
      "진짜 모습을 보이면 버림받을 것 같음",
      "비판과 거절에 과민",
      "방어적이고 적대적",
    ],
    origin: ["비판적·처벌적인 부모"],
    source_user_pdf: true,
  },
  {
    code: "FA",
    number: 6,
    name_ko: "실패",
    name_en: "Failure",
    domain: "II_impaired_autonomy",
    items: [6, 24, 42, 60, 78],
    traits: [
      "근본적으로 무능하다고 느낌",
      "동료들에 비해 실패할 것이라 예상",
      "성취 영역에서 자신을 부족한 사람으로 봄",
      "새로운 도전을 회피",
    ],
    origin: ["성취에 대한 비판·비교", "조건부 인정"],
    source_user_pdf: false,
  },
  {
    code: "DI",
    number: 7,
    name_ko: "의존/무능감",
    name_en: "Dependence / Incompetence",
    domain: "II_impaired_autonomy",
    items: [7, 25, 43, 61, 79],
    traits: [
      "스스로 결정 못함",
      "조언을 과도하게 구함",
      "새로운 도전 회피",
      "보호자 같은 사람에게 의존",
    ],
    origin: ["과보호 부모", "과도한 간섭과 지시"],
    source_user_pdf: true,
  },
  {
    code: "VH",
    number: 8,
    name_ko: "위험/질병에 대한 취약성",
    name_en: "Vulnerability to Harm or Illness",
    domain: "II_impaired_autonomy",
    items: [8, 26, 44, 62, 80],
    traits: [
      "재난(자연재해·범죄·질병·재정곤란)이 언제든 일어날 것 같다고 믿음",
      "과도한 걱정·예측",
      "안전에 집착",
      "통제할 수 없는 외부 위협에 민감",
    ],
    origin: [
      "불안한 양육 환경",
      "양육자의 과도한 두려움·과보호 모델링",
    ],
    source_user_pdf: false,
  },
  {
    code: "EM",
    number: 9,
    name_ko: "융합/미발달된 자기",
    name_en: "Enmeshment / Undeveloped Self",
    domain: "II_impaired_autonomy",
    items: [9, 27, 45, 63, 81],
    traits: [
      "자기 정체성이 약함",
      "양육자(특히 부모)와의 정서적 융합",
      "자기 개별성을 발달시키지 못함",
      "부모에게서 분리되는 것에 죄책감",
    ],
    origin: ["과보호·과밀착 양육", "양육자의 자기 정체성 부재"],
    source_user_pdf: false,
  },
  {
    code: "SB",
    number: 10,
    name_ko: "복종",
    name_en: "Subjugation",
    domain: "IV_other_directedness",
    items: [10, 28, 46, 64, 82],
    traits: [
      "자기 욕구·감정을 억압",
      "타인의 의지에 따름",
      "분노·원망이 누적되어 폭발하거나 신체화",
      "강요당하거나 원하는 것을 하지 못하게 되는 것을 싫어함",
    ],
    origin: ["권위적·통제적 양육자", "복종 강요 환경"],
    source_user_pdf: false,
  },
  {
    code: "SS",
    number: 11,
    name_ko: "자기희생",
    name_en: "Self-Sacrifice",
    domain: "IV_other_directedness",
    items: [11, 29, 47, 65, 83],
    traits: [
      "자신의 권리를 주장하기 어려움",
      "타인을 위해 자신을 희생",
      "결국 원망감이 발생",
      "나 자신을 위한 시간이 거의 없음",
    ],
    origin: [
      "죄책감을 유발하는 부모",
      "부모의 돌봄 역할 수행 (parentification)",
    ],
    source_user_pdf: true,
  },
  {
    code: "EI",
    number: 12,
    name_ko: "정서적 억제",
    name_en: "Emotional Inhibition",
    domain: "V_overvigilance",
    items: [12, 30, 48, 66, 84],
    traits: [
      "감정 표현 억제",
      "기쁨·애정·취약성 표현이 어려움",
      "이성을 지나치게 강조",
      "스스로를 너무 억제해서 감정이 없어 보임",
    ],
    origin: ["감정 표현이 약점·결함으로 여겨진 환경"],
    source_user_pdf: true,
  },
  {
    code: "US",
    number: 13,
    name_ko: "엄격한 기준/과잉비판",
    name_en: "Unrelenting Standards / Hypercriticalness",
    domain: "V_overvigilance",
    items: [13, 31, 49, 67, 85],
    traits: [
      "완벽주의",
      "자신과 타인에게 엄격",
      "쉬지 못함",
      "성취해도 만족 못함",
      "끊임없는 압력감",
    ],
    origin: ["조건부 사랑", "지나치게 높은 부모의 기준"],
    source_user_pdf: true,
  },
  {
    code: "ET",
    number: 14,
    name_ko: "특권의식",
    name_en: "Entitlement / Grandiosity",
    domain: "III_impaired_limits",
    items: [14, 32, 50, 68, 86],
    traits: [
      "자신을 특별하다고 여김",
      "규칙·한계를 무시하거나 따를 필요가 없다고 느낌",
      "타인의 욕구를 무시",
      "원하는 것을 못 하게 되는 것을 견디기 어려워함",
    ],
    origin: [
      "과도한 응석·요구 충족",
      "한계의 부족",
      "보상적 양육 (과시·우월감 모델링)",
    ],
    source_user_pdf: false,
  },
  {
    code: "IS",
    number: 15,
    name_ko: "부족한 자기 통제",
    name_en: "Insufficient Self-Control",
    domain: "III_impaired_limits",
    items: [15, 33, 51, 69, 87],
    traits: [
      "충동 통제가 어려움",
      "좌절 인내가 부족",
      "장기 목표 추구가 어려움",
      "즐기지 않는 일을 억지로 하기 힘듦",
    ],
    origin: ["일관된 한계·규율 부족"],
    source_user_pdf: false,
  },
  {
    code: "AS",
    number: 16,
    name_ko: "승인/인정추구",
    name_en: "Approval-Seeking / Recognition-Seeking",
    domain: "IV_other_directedness",
    items: [16, 34, 52, 70, 88],
    traits: [
      "인정받아야 가치 있다고 느낌",
      "타인 평가에 자존감이 의존",
      "외모·성취·지위에 집착",
      "거절에 민감",
    ],
    origin: ["조건부 사랑"],
    source_user_pdf: true,
  },
  {
    code: "NP",
    number: 17,
    name_ko: "부정적/비관주의",
    name_en: "Negativity / Pessimism",
    domain: "V_overvigilance",
    items: [17, 35, 53, 71, 89],
    traits: [
      "긍정적 측면은 무시",
      "문제와 위험에 집중",
      "결국 망할 것이라 예상",
      "실수에 대한 과도한 두려움",
    ],
    origin: ["비관적 양육자 모델링", "부정적 사건이 강조된 환경"],
    source_user_pdf: true,
  },
  {
    code: "PU",
    number: 18,
    name_ko: "처벌",
    name_en: "Punitiveness",
    domain: "V_overvigilance",
    items: [18, 36, 54, 72, 90],
    traits: [
      "실수하면 벌받아야 한다고 믿음",
      "자신·타인의 실수에 가혹",
      "용서가 어려움",
      "잘못의 이유는 중요하지 않다고 느낌",
    ],
    origin: ["처벌적 양육", "엄격한 규율 환경"],
    source_user_pdf: false, // 사용자 PDF에 일부만 — 표준으로 보완
  },
];

/* ─────────────────── 채점 ─────────────────── */

/**
 * 90문항 1~6점 척도 응답에서 18 도식 평균 점수 계산.
 * 답하지 않은 문항은 0점으로 처리(또는 평균 계산에서 제외).
 */
export function computeSchemaScores(
  answers: Record<number, number>
): Record<SchemaCode, number> {
  const out = {} as Record<SchemaCode, number>;
  for (const s of SCHEMA_18) {
    let sum = 0;
    let n = 0;
    for (const item of s.items) {
      const v = answers[item];
      if (typeof v === "number" && v >= 1 && v <= 6) {
        sum += v;
        n += 1;
      }
    }
    out[s.code] = n > 0 ? sum / n : 0;
  }
  return out;
}

/* ─────────────────── Step 4 적응형 대화 ─────────────────── */
/* YSQ 90문항 정적 풀이가 아니라, 5개 도식 도메인 시작 질문으로 반응형 대화 진행. */

export interface SchemaDomainExploreStep {
  /** dialogue turn explore_point_id. */
  id: SchemaDomain;
  opening: string;
  topic: string;
}

export const SCHEMA_DOMAIN_EXPLORE_STEPS: SchemaDomainExploreStep[] = [
  {
    id: "I_disconnection",
    opening:
      "지금까지 살아오면서 마음을 진심으로 알아주거나 보살펴주는 사람이 있다고 느껴왔나요?",
    topic:
      "안전한 관계·정서적 돌봄·소속·신뢰에 대한 경험과 감정 (도메인 I 단절·거부)",
  },
  {
    id: "II_impaired_autonomy",
    opening:
      "혼자 결정을 내리거나 새로운 도전을 시작할 때, 어떤 마음이 가장 먼저 드나요?",
    topic:
      "자율성·자기 능력감·세상에 대한 안전감 (도메인 II 손상된 자율성·수행)",
  },
  {
    id: "III_impaired_limits",
    opening:
      "내가 원하는 것과 해야 할 일 사이에서, 어떤 갈등이 자주 일어나나요?",
    topic: "충동·욕구·한계·책임감의 균형 (도메인 III 손상된 한계)",
  },
  {
    id: "IV_other_directedness",
    opening:
      "다른 사람의 기대나 평가가 내 선택에 얼마나 큰 영향을 미치나요?",
    topic:
      "타인 인정·평가에 대한 의존, 자기 욕구 표현 (도메인 IV 타인 지향성)",
  },
  {
    id: "V_overvigilance",
    opening: "실수나 잘못에 대해 자신에게 얼마나 엄격한 편인가요?",
    topic:
      "완벽주의·자기비판·감정 억제·부정적 예측 (도메인 V 과잉경계·억제)",
  },
];

/* ─────────────────── 헬퍼 ─────────────────── */

export function getSchema(code: SchemaCode): Schema | undefined {
  return SCHEMA_18.find((s) => s.code === code);
}

export function getDomain(code: SchemaDomain): SchemaDomainDef | undefined {
  return SCHEMA_DOMAINS.find((d) => d.code === code);
}

export function topNSchemas(
  scores: Record<SchemaCode, number>,
  n = 3
): { code: SchemaCode; score: number }[] {
  return (Object.entries(scores) as [SchemaCode, number][])
    .map(([code, score]) => ({ code, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}
