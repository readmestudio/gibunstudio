/**
 * 마음 체크 — 온보딩 심리 스크리너
 *
 * 심리상담 키워드로 유입된 방문자가 로그인 없이 바로 시작할 수 있는 간단한
 * 자가 점검 테스트. 7개 영역(불안·우울·번아웃·스트레스·성취중독·자존감·ADHD)을
 * 한 번에 거른 뒤, "주 유형 + 부 유형"을 짚어 진단 리포트를 보여주고 상담으로 잇는다.
 *
 * 설계 원칙:
 *  - 점수는 순수 함수(calculateScreener)로 클라이언트에서 계산 → 로그인/DB/API 불필요(마찰 0)
 *  - 각 영역 3문항 × 4점 척도 = 영역별 0~12점. 최고점 영역이 "주 유형"
 *  - 표준 척도(GAD-7·PHQ-9·MBI·PSS·Rosenberg·ASRS)에서 대표 문항만 추려 온보딩에 맞게 경량화
 *  - ⚠️ 본 결과는 "의학적 진단"이 아닌 "자가 점검"이다. 카피·라벨에서 단정을 피한다.
 *  - 우울 영역의 안전 문항(flag: "safety")이 높으면 위기 자원 안내를 먼저 띄운다.
 */

// ── 7개 영역 ──

export type AxisKey =
  | "anxiety"      // 불안
  | "depression"   // 우울
  | "burnout"      // 번아웃
  | "stress"       // 스트레스
  | "achievement"  // 성취중독
  | "selfEsteem"   // 자존감(낮음) — 높은 점수 = 자기비판 강함
  | "adhd";        // 주의력

export interface AxisMeta {
  key: AxisKey;
  userLabel: string;     // 유저 노출용 유형명 (부드러운 표현)
  clinicalLabel: string; // 임상 표기 (보조)
  enLabel: string;       // Mono 영문 라벨
  order: number;         // 동점 시 안정 정렬 + 막대 표시 순서
}

export const AXES: AxisMeta[] = [
  { key: "anxiety",     userLabel: "불안 민감형",   clinicalLabel: "범불안 경향",       enLabel: "ANXIETY",      order: 1 },
  { key: "depression",  userLabel: "가라앉은 마음", clinicalLabel: "우울 경향",         enLabel: "DEPRESSION",   order: 2 },
  { key: "burnout",     userLabel: "소진된 마음",   clinicalLabel: "번아웃 경향",       enLabel: "BURNOUT",      order: 3 },
  { key: "stress",      userLabel: "과부하형",     clinicalLabel: "지각된 스트레스",   enLabel: "STRESS",       order: 4 },
  { key: "achievement", userLabel: "성취 의존형",   clinicalLabel: "성취중독 경향",     enLabel: "ACHIEVEMENT",  order: 5 },
  { key: "selfEsteem",  userLabel: "자기 비판형",   clinicalLabel: "낮은 자존감 경향",  enLabel: "SELF-ESTEEM",  order: 6 },
  { key: "adhd",        userLabel: "주의 분산형",   clinicalLabel: "성인 ADHD 경향",    enLabel: "ATTENTION",    order: 7 },
];

export const AXIS_MAX = 12; // 영역당 3문항 × 4점

// ── 4점 척도 ──

export const SCALE_OPTIONS = [
  { value: 1, label: "전혀 아니다" },
  { value: 2, label: "가끔 그렇다" },
  { value: 3, label: "자주 그렇다" },
  { value: 4, label: "거의 항상 그렇다" },
] as const;

// ── 21문항 ──
// 응답 편향을 줄이려고 영역을 라운드로빈으로 섞어 배치한다(같은 주제 3연속 회피).
// 채점은 axis 태그로 합산하므로 표시 순서는 점수에 영향이 없다.

export interface ScreenerQuestion {
  id: number;
  text: string;
  axis: AxisKey;
  flag?: "safety"; // 우울 안전 문항 — 높으면 위기 자원 우선 안내
}

export const SCREENER_QUESTIONS: ScreenerQuestion[] = [
  // ── Round 1 ──
  { id: 1, axis: "anxiety", text: "사소한 일에도 걱정이 꼬리를 물고 멈추지 않는다." },
  { id: 2, axis: "depression", text: "예전엔 즐겁던 일들이 시들하고 흥미가 줄었다." },
  { id: 3, axis: "burnout", text: "일을 마쳐도 회복되는 느낌 없이 늘 지쳐 있다." },
  { id: 4, axis: "stress", text: "내가 통제할 수 없는 일이 너무 많게 느껴진다." },
  { id: 5, axis: "achievement", text: "쉬거나 멈춰 있으면 불안하고 죄책감이 든다." },
  { id: 6, axis: "selfEsteem", text: "나는 다른 사람들만큼 가치 있는 사람이라고 느끼기 어렵다." },
  { id: 7, axis: "adhd", text: "끝까지 집중해서 일을 마무리하는 것이 어렵다." },

  // ── Round 2 ──
  { id: 8, axis: "anxiety", text: "초조하거나 안절부절못하는 느낌이 자주 든다." },
  { id: 9, axis: "depression", text: "이유 없이 가라앉고 우울한 기분이 자주 든다." },
  { id: 10, axis: "burnout", text: "예전만큼 일이나 사람에게 마음을 쏟기가 어렵다." },
  { id: 11, axis: "stress", text: "해야 할 일에 치여 늘 쫓기는 기분이다." },
  { id: 12, axis: "achievement", text: "성과가 없으면 내 가치가 없는 것처럼 느껴진다." },
  { id: 13, axis: "selfEsteem", text: "스스로를 떠올리면 잘한 것보다 부족한 점이 먼저 보인다." },
  { id: 14, axis: "adhd", text: "중요한 일도 자꾸 미루거나 마감에 임박해서야 하게 된다." },

  // ── Round 3 ──
  { id: 15, axis: "anxiety", text: "곧 나쁜 일이 일어날 것 같은 막연한 불안을 느낀다." },
  { id: 16, axis: "depression", text: "차라리 모든 걸 멈추고 사라지고 싶다는 생각이 들 때가 있다.", flag: "safety" },
  { id: 17, axis: "burnout", text: "아침에 일어나 또 하루를 시작하는 것이 버겁게 느껴진다." },
  { id: 18, axis: "stress", text: "신경이 곤두서서 작은 일에도 예민하게 반응하게 된다." },
  { id: 19, axis: "achievement", text: "하나를 끝내면 곧장 다음 목표를 세우지 않으면 불편하다." },
  { id: 20, axis: "selfEsteem", text: "나는 내가 마음에 들지 않을 때가 많다." },
  { id: 21, axis: "adhd", text: "물건을 자주 잃어버리거나 약속·할 일을 깜빡한다." },
];

export const TOTAL_QUESTIONS = SCREENER_QUESTIONS.length;

// ── 심각도 ──

export type Severity = "low" | "moderate" | "high";

export interface SeverityMeta {
  key: Severity;
  label: string;      // 배지 라벨
  ctaHeadline: string; // 상담 CTA 헤드라인
  ctaLede: string;     // 상담 CTA 보조 카피
}

export const SEVERITY_META: Record<Severity, SeverityMeta> = {
  low: {
    key: "low",
    label: "지금은 안정적이에요",
    ctaHeadline: "지금의 균형을\n더 단단하게 지키고 싶다면",
    ctaLede:
      "지금은 큰 신호가 보이지 않아요. 다만 마음도 미리 점검하면 더 가볍게 유지할 수 있어요. 가볍게 이야기 나눠보는 것만으로도 도움이 돼요.",
  },
  moderate: {
    key: "moderate",
    label: "주의가 필요해요",
    ctaHeadline: "혼자 끌어안고 있던 무게,\n이제 함께 내려놓아요",
    ctaLede:
      "초기에 점검할수록 회복은 빨라져요. 지금 보이는 신호가 더 굳어지기 전에, 전문 상담사와 함께 그 정체를 들여다보면 한결 가벼워질 수 있어요.",
  },
  high: {
    key: "high",
    label: "돌봄이 필요해요",
    ctaHeadline: "지금 마음이 보내는 신호가\n꽤 또렷해요",
    ctaLede:
      "혼자 버티기보다 함께 푸는 게 빠를 수 있는 상태예요. 전문 심리상담사와 1:1로, 지금 가장 무거운 마음부터 차근차근 풀어가요.",
  },
};

export function severityOf(primaryScore: number): Severity {
  if (primaryScore >= 10) return "high";
  if (primaryScore >= 7) return "moderate";
  return "low";
}

// ── 유형별 정적 리포트 ──

export interface TypeReport {
  summary: string; // 지금 어떤 상태인지 (비판단적)
  reframe: string; // 왜 그런지 + 어떻게 도움받을 수 있는지 (상담으로 가는 다리)
}

export const TYPE_REPORTS: Record<AxisKey, TypeReport> = {
  anxiety: {
    summary:
      "마음이 '다가올 위험'에 맞춰져 있어요. 아직 일어나지 않은 일까지 미리 걱정하느라 긴장의 끈을 쉽게 놓지 못하는 상태예요.",
    reframe:
      "불안은 본래 나를 지키려는 신호예요. 다만 그 경보가 너무 자주, 너무 크게 울리면 일상이 소진돼요. 무엇이 경보를 켜는지 함께 따라가면 그 강도를 충분히 줄일 수 있어요.",
  },
  depression: {
    summary:
      "기분과 에너지가 전반적으로 가라앉아 있어요. 예전엔 즐겁던 일도 시들하게 느껴지고, 하루를 버텨내는 것 자체가 무겁게 느껴질 수 있어요.",
    reframe:
      "가라앉음은 게으름이나 의지의 문제가 아니라, 마음이 보내는 분명한 신호예요. 혼자 끌어올리려 애쓰기보다 전문가와 함께 그 무게의 정체를 들여다보는 게 회복의 가장 빠른 길이에요.",
  },
  burnout: {
    summary:
      "오래 달려온 끝에 에너지가 바닥나 있어요. 쉬어도 회복되지 않고, 일과 사람에게 마음을 쏟기가 점점 어려워지는 상태예요.",
    reframe:
      "번아웃은 '약해서'가 아니라 '오래 잘 버텨왔기에' 찾아와요. 무엇이 나를 멈추지 못하게 했는지 풀어내야 진짜 회복이 시작돼요.",
  },
  stress: {
    summary:
      "감당할 수 있는 양보다 더 많은 것이 한꺼번에 몰려 있다고 느껴요. 늘 쫓기고 신경이 곤두서서 작은 일에도 예민해질 수 있어요.",
    reframe:
      "스트레스는 '내가 부족해서'가 아니라 '요구와 자원의 균형이 무너져서' 생겨요. 무엇을 덜어내고 어디서 통제감을 되찾을지 함께 정리하면 한결 가벼워져요.",
  },
  achievement: {
    summary:
      "내 가치를 '해낸 것'으로 증명하려는 마음이 강해요. 쉬면 불안하고 죄책감이 들어, 멈추지 못하고 계속 달리게 되는 상태예요.",
    reframe:
      "성취 자체는 좋은 동력이에요. 다만 그것이 '유일한' 자기 가치의 근거가 되면 쉼이 사라져요. 그 뿌리를 따라가면 성취하면서도 쉴 수 있는 균형을 찾을 수 있어요.",
  },
  selfEsteem: {
    summary:
      "나를 바라보는 시선이 꽤 엄격해요. 잘한 것보다 부족한 점이 먼저 보이고, 스스로를 다른 사람만큼 가치 있게 느끼기 어려운 상태예요.",
    reframe:
      "자기 비판은 종종 '더 나아지려는' 마음에서 출발하지만, 너무 가혹하면 오히려 나를 깎아내려요. 그 목소리가 언제 생겼는지 함께 따라가면 더 단단한 자기 시선을 만들 수 있어요.",
  },
  adhd: {
    summary:
      "집중을 한곳에 모으고 끝까지 유지하는 게 어렵게 느껴져요. 미루기·깜빡함·산만함이 반복되며 스스로를 자책하기 쉬운 상태예요.",
    reframe:
      "이건 '의지가 약해서'가 아니라 주의력이 작동하는 방식의 특성일 수 있어요. 정확한 평가와 나에게 맞는 전략을 찾으면 일상이 훨씬 수월해져요. (※ 본 결과는 진단이 아닌 자가 점검이에요.)",
  },
};

// ── 점수 계산 ──

export interface ScreenerResult {
  axisScores: Record<AxisKey, number>; // 영역별 0~12
  ranked: AxisKey[];                   // 점수 내림차순 (동점은 AXES.order)
  primary: AxisKey;                    // 주 유형 (최고점)
  secondary: AxisKey | null;          // 부 유형 (주 유형과 2점 이내 & 그 자체로 6점 이상일 때만)
  primaryScore: number;
  severity: Severity;
  needsSafetyNet: boolean;            // 안전 문항 ≥ 3 → 위기 자원 우선 안내
}

export function calculateScreener(
  answers: Record<string, number>
): ScreenerResult {
  const axisScores = {} as Record<AxisKey, number>;
  for (const a of AXES) axisScores[a.key] = 0;
  for (const q of SCREENER_QUESTIONS) {
    axisScores[q.axis] += answers[String(q.id)] || 0;
  }

  const orderOf = (k: AxisKey) =>
    AXES.find((a) => a.key === k)?.order ?? 99;

  const ranked = AXES.map((a) => a.key).sort(
    (x, y) => axisScores[y] - axisScores[x] || orderOf(x) - orderOf(y)
  );

  const primary = ranked[0];
  const primaryScore = axisScores[primary];
  const runnerUp = ranked[1];
  const secondary =
    primaryScore - axisScores[runnerUp] <= 2 && axisScores[runnerUp] >= 6
      ? runnerUp
      : null;

  const safetyQ = SCREENER_QUESTIONS.find((q) => q.flag === "safety");
  const needsSafetyNet =
    !!safetyQ && (answers[String(safetyQ.id)] || 0) >= 3;

  return {
    axisScores,
    ranked,
    primary,
    secondary,
    primaryScore,
    severity: severityOf(primaryScore),
    needsSafetyNet,
  };
}

// ── 헬퍼 ──

export function axisMeta(key: AxisKey): AxisMeta {
  return AXES.find((a) => a.key === key) ?? AXES[0];
}
