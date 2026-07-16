/**
 * 내면 아이 찾기 — 문항 은행 (HANDOFF-v2 2장 전문).
 *
 * 출제 순서: 스크리닝(전원 8) → 공통(전원 1) → 드릴다운(상위 2영역만 5~9) → 지킴이 3 → SCT 5.
 * 6점 척도, "요즘의 나" 기준. 파트 내 랜덤 배치는 렌더 단계에서 처리한다.
 *
 * schema_id/area/conditional 은 채점(scoring.ts)·유형카드 주입에 쓰는 내부 식별자.
 * 소비자에게는 아이 이름(child_name)과 문항 텍스트만 노출한다.
 */

import type { AreaId, GuardianType, SlotType } from "./types";

/** 6점 척도 — 양끝 라벨만 노출(중앙 없음). */
export const SCALE_MIN = 1;
export const SCALE_MAX = 6;
export const SCALE_LABELS = {
  min: "전혀 나와 다르다",
  max: "완전히 나다",
} as const;

export const TIME_FRAME_NOTICE = "요즘의 나를 기준으로 답해주세요.";

/** 대표 후보 진입 컷 — 특권의식(C1)은 이 점수 이상일 때만 대표 아이 후보 풀에 들어간다. */
export const ENTITLEMENT_CANDIDATE_THRESHOLD = 5;

/** 응답자당 출제할 상위 영역 수(드릴다운 대상). */
export const TOP_AREAS_COUNT = 2;

/** 동점 시 영역 우선순위(높을수록 우선). HANDOFF 3장 Step1 동점 처리. */
export const AREA_PRIORITY: AreaId[] = [
  "disconnection",
  "impaired_autonomy",
  "other_directedness",
  "overvigilance",
];

// ───────────────────────── Part 1. 스크리닝 8문항(전원) ─────────────────────────

export interface ScreeningItem {
  id: string;
  area: AreaId;
  slot: SlotType;
  text: string;
}

export const SCREENING_ITEMS: ScreeningItem[] = [
  { id: "S1", area: "disconnection", slot: "affect", text: "사람들 속에 있어도 문득 혼자라는 느낌이 든다." },
  { id: "S2", area: "disconnection", slot: "behavior", text: "관계가 깊어질수록 편해지기보다 조심스러워진다." },
  { id: "S3", area: "impaired_autonomy", slot: "affect", text: "혼자 결정해야 하는 순간이 오면 막막함이 먼저 온다." },
  { id: "S4", area: "impaired_autonomy", slot: "behavior", text: "'감당 못 하면 어쩌지' 싶어 시작을 미루곤 한다." },
  { id: "S5", area: "other_directedness", slot: "affect", text: "내가 원하는 것보다 상대가 원하는 게 먼저 보인다." },
  { id: "S6", area: "other_directedness", slot: "behavior", text: "일단 맞춰주고, 나중에 혼자 속이 상하곤 한다." },
  { id: "S7", area: "overvigilance", slot: "affect", text: "잘 풀리고 있을 때도 마음 한쪽은 긴장하고 있다." },
  { id: "S8", area: "overvigilance", slot: "behavior", text: "쉬는 날에도 마음 편히 늘어지지 못한다." },
];

// ───────────────────────── Part 2. 공통 1문항(전원) ─────────────────────────

/** C1 특권의식 — 영역 스크리닝에서 제외, 공통 1문항으로만 측정. */
export const COMMON_ITEM = {
  id: "C1",
  schema_id: "entitlement",
  child_name: "왕관 쓴 아이",
  conditional: false,
  text: "여럿 중 하나로 취급받으면 마음이 상한다.",
} as const;

// ───────────────────────── Part 3. 드릴다운 풀 15문항 ─────────────────────────

export interface DrilldownItem {
  id: string;
  area: AreaId;
  schema_id: string;
  child_name: string;
  conditional: boolean; // 무조건적(false) vs 조건적(true)
  text: string;
}

export const DRILLDOWN_ITEMS: DrilldownItem[] = [
  // 영역 1. 단절·거절 (5) — 전부 무조건적
  { id: "D01", area: "disconnection", schema_id: "abandonment", child_name: "문 앞에서 기다리는 아이", conditional: false, text: "소중한 사람일수록 잃을까 봐, 자꾸 확인하고 싶어진다." },
  { id: "D02", area: "disconnection", schema_id: "mistrust_abuse", child_name: "등을 벽에 붙인 아이", conditional: false, text: "가까운 사람에게도 마음 한 겹은 남겨두는 편이다." },
  { id: "D03", area: "disconnection", schema_id: "emotional_deprivation", child_name: "허기진 아이", conditional: false, text: "말 안 해도 알아줬으면 싶고, 몰라주면 혼자 서운하다." },
  { id: "D04", area: "disconnection", schema_id: "defectiveness_shame", child_name: "숨어버린 아이", conditional: false, text: "'진짜 나를 알아도 좋아해줄까' 싶어 다 열지 못한다." },
  { id: "D05", area: "disconnection", schema_id: "social_isolation", child_name: "창밖의 아이", conditional: false, text: "함께 웃다가도 문득 나만 겉도는 기분이 든다." },

  // 영역 2. 손상된 자율성 (4) — 전부 무조건적
  { id: "D06", area: "impaired_autonomy", schema_id: "dependence_incompetence", child_name: "손을 놓지 못하는 아이", conditional: false, text: "결정한 뒤에도 누군가 '맞아'라고 해줘야 안심된다." },
  { id: "D07", area: "impaired_autonomy", schema_id: "vulnerability_harm", child_name: "떨고 있는 아이", conditional: false, text: "좋은 순간에도 잘못될까 봐 마음 한쪽이 긴장한다." },
  { id: "D08", area: "impaired_autonomy", schema_id: "enmeshment", child_name: "그림자 아이", conditional: false, text: "'내가 원하는 게 뭐지?' 물으면 답이 흐릿하다." },
  { id: "D09", area: "impaired_autonomy", schema_id: "failure", child_name: "주저앉은 아이", conditional: false, text: "실망하기 싫어서, 기대를 접고 시작을 미루곤 한다." },

  // 영역 4. 타인 중심성 (3) — 전부 조건적
  { id: "D10", area: "other_directedness", schema_id: "subjugation", child_name: "고개 숙인 아이", conditional: true, text: "분위기 상할까 봐 내 생각을 삼키고, 돌아서면 말이 남는다." },
  { id: "D11", area: "other_directedness", schema_id: "self_sacrifice", child_name: "너무 일찍 어른이 된 아이", conditional: true, text: "다들 챙기다 보면, '나는 누가 챙기지' 싶어 서럽다." },
  { id: "D12", area: "other_directedness", schema_id: "approval_seeking", child_name: "무대 위의 아이", conditional: true, text: "알아봐주면 힘이 나고, 반응이 없으면 흔들린다." },

  // 영역 5. 과잉경계·억제 (3) — 부정성/비관만 무조건적, 나머지 조건적
  { id: "D13", area: "overvigilance", schema_id: "negativity_pessimism", child_name: "걱정을 끌어안은 아이", conditional: false, text: "좋은 일이 생기면 나쁜 일부터 대비하게 된다." },
  { id: "D14", area: "overvigilance", schema_id: "emotional_inhibition", child_name: "얼어붙은 아이", conditional: true, text: "기쁨도 서운함도 일단 속으로 담아두는 편이다." },
  { id: "D15", area: "overvigilance", schema_id: "unrelenting_standards", child_name: "채찍 든 아이", conditional: true, text: "잘 해내고도 '다음엔 더 잘해야지'가 먼저 떠오른다." },
];

/** 영역 → 그 영역 드릴다운 문항. 상위 2영역만 출제하는 데 쓴다. */
export const DRILLDOWN_BY_AREA: Record<AreaId, DrilldownItem[]> = {
  disconnection: DRILLDOWN_ITEMS.filter((d) => d.area === "disconnection"),
  impaired_autonomy: DRILLDOWN_ITEMS.filter((d) => d.area === "impaired_autonomy"),
  other_directedness: DRILLDOWN_ITEMS.filter((d) => d.area === "other_directedness"),
  overvigilance: DRILLDOWN_ITEMS.filter((d) => d.area === "overvigilance"),
};

// ───────────────────────── Part 4. 지킴이 판별 3문항(3지선다) ─────────────────────────

export interface GuardianOption {
  text: string;
  value: GuardianType;
}
export interface GuardianItem {
  id: string;
  prompt: string;
  options: GuardianOption[]; // 렌더 시 순서 랜덤
}

export const GUARDIAN_ITEMS: GuardianItem[] = [
  {
    id: "G1",
    prompt: "가까운 사람이 나에게 실망한 것 같을 때, 나는…",
    options: [
      { value: "surrender", text: "어떻게든 더 맞추고 만회하려 애쓴다" },
      { value: "avoidance", text: "일단 그 생각을 밀어두고 다른 일에 몰두한다" },
      { value: "overcompensation", text: "'내가 뭘 잘못했는데?' 하고 마음속에서 따져본다" },
    ],
  },
  {
    id: "G2",
    prompt: "마음이 크게 힘들어진 날, 나는…",
    options: [
      { value: "surrender", text: "그 감정에 잠겨서 하루가 무겁게 흘러간다" },
      { value: "avoidance", text: "먹거나 보거나 사거나, 뭔가에 몰두하며 잊는다" },
      { value: "overcompensation", text: "'이럴 시간 없어' 하고 더 바쁘게 움직인다" },
    ],
  },
  {
    id: "G3",
    prompt: "중요한 일을 앞두고 있을 때, 나는…",
    options: [
      { value: "surrender", text: "'나는 원래 이런 건 잘 못해' 하는 목소리가 커진다" },
      { value: "avoidance", text: "자꾸 딴짓하게 되고 준비를 미루게 된다" },
      { value: "overcompensation", text: "밤을 새워서라도 완벽하게 준비해야 마음이 놓인다" },
    ],
  },
];

/** 지킴이 소비자 라벨. */
export const GUARDIAN_LABELS: Record<GuardianType, string> = {
  surrender: "따르는 지킴이",
  avoidance: "재우는 지킴이",
  overcompensation: "맞서는 지킴이",
};

/** 3개 전부 상이할 때 채택하는 문항(감정 장면). HANDOFF 3장 Step3. */
export const GUARDIAN_TIEBREAK_ITEM_ID = "G2";

// ───────────────────────── Part 5. SCT 문장완성 5문항(자유 입력) ─────────────────────────

export interface SctItem {
  id: string;
  slot: keyof import("./types").SctAnswers;
  text: string; // ______ 자리를 UI 에서 입력칸으로 렌더
}

export const SCT_GUIDE = "떠오르는 대로, 짧아도 괜찮아요.";
export const SCT_TRANSITION =
  "거의 다 왔어요. 이제 점수가 아니라 당신의 이야기를 들려주세요.";

export const SCT_ITEMS: SctItem[] = [
  { id: "SCT1", slot: "childhood_self", text: "어릴 적 나는 ______ 아이였다." },
  { id: "SCT2", slot: "inner_voice", text: '나를 다그치거나 말리는 내 안의 목소리는 "______"라고 말한다.' },
  { id: "SCT3", slot: "family_rule", text: "우리 집에서는 ______해야 했다." },
  { id: "SCT4", slot: "regression_trigger", text: "나는 ______할 때, 갑자기 어린아이가 된 것 같다." },
  { id: "SCT5", slot: "escape_behavior", text: "마음이 힘들 때 나는 ______로 도망친다." },
];

/**
 * 3부 마지막 — 고민 자유서술(텍스트 입력·**스킵 가능**). 채점·안전필터와 완전 무관.
 *
 * ⚠️ SCT(자·타해 안전필터의 유일 입력)와 달리 이 입력은 스킵을 유도해도 안전하다. 그래서
 *    청월당식 "쓰지 않아도 넘어갈 수 있어요" 안내를 SCT 가 아니라 **여기에** 둔다.
 *    (project_inner_child_sct_crisis_filter: SCT 는 감축·스킵유도 금지)
 *
 * 쓴 텍스트는 결과 페이지의 '고민 카드'에서 그대로 되돌려주고(개인화 증거), 유료 리포트
 * 프롬프트가 이를 반영한다. 무료는 되돌려주기까지 — LLM 불필요.
 */
export const CONCERN_PROMPT = "마지막으로, 요즘 가장 자주 마음에 걸리는 게 있다면?";
export const CONCERN_HINT = "쓰지 않고 넘어가도 괜찮아요";
export const CONCERN_PLACEHOLDER = "예: 이 관계를 계속해도 될지, 일이 자꾸 나를 갉아먹는 것 같아요…";

/** 시작 화면 + 리포트 하단 고정 면책 문구(HANDOFF 10-4). */
export const DISCLAIMER =
  "본 테스트는 자기이해를 돕는 콘텐츠이며 심리검사·진단 도구가 아닙니다.";

// ───────────────────────── UX: 챕터 · 인터스티셜 (개선 플랜 §2) ─────────────────────────

/** 3부 챕터 라벨. 진행바를 "몇 문항 남았나"가 아니라 챕터로 흡수한다. */
export const CHAPTER_LABELS: Record<1 | 2 | 3, string> = {
  1: "마음의 지형",
  2: "더 가까이",
  3: "당신의 이야기",
};

/**
 * 스크리닝→드릴다운 전환 인터스티셜(①)에서 쓰는 1위 영역 "신호 문구".
 * 소비자 노출 금지 이론 용어(영역명 원문) 대신 뭉툭한 감각어로. 결과 스포일러 아님(예고편).
 * 더 보수적으로 갈 땐 AREA_SIGNAL_NEUTRAL 로 교체(문구만 바꾸면 됨).
 */
export const AREA_SIGNAL: Record<AreaId, string> = {
  disconnection: "당신 안에는, 사람들과의 사이에 놓인 거리를 남들보다 조금 더 예민하게 느끼는 마음이 있는 것 같아요.",
  impaired_autonomy: "당신 안에는, 혼자 서야 하는 순간의 막막함을 크게 느끼는 마음이 있는 것 같아요.",
  other_directedness: "당신 안에는, 나보다 상대를 먼저 살피는 다정한 마음이 있는 것 같아요.",
  overvigilance: "당신 안에는, 좀처럼 긴장을 놓지 못하고 늘 살피는 마음이 있는 것 같아요.",
};

/** 무색(스포일러 제로) 대안. 파일럿에서 "김샜다" 반응이 우세하면 위 대신 이걸로. */
export const AREA_SIGNAL_NEUTRAL =
  "응답을 살펴보니, 마음이 한쪽으로 살며시 기울어 있었어요. 남은 질문은 그 방향으로 골라서 드릴게요.";

/** 인터스티셜 ① 공통 후행 문장 — 16유형 중 한 명을 만나러 간다는 따뜻한 전환. */
export const INTERSTITIAL_TO_DRILLDOWN =
  "이제 16가지 내면 아이 중, 지금 당신에게 가장 가까이 있는 한 명을 만나러 가볼게요. 조금만 더 다가가는, 당신의 응답이 고른 질문을 드릴게요.";

/** 인터스티셜 ② 드릴다운→지킴이. 포맷 전환(점수→장면)을 명시적으로 선언. */
export const INTERSTITIAL_TO_GUARDIAN =
  "아이의 신호는 충분히 모였어요. 이제 방향을 바꿔서 — 그 아이가 힘들 때, 당신이 스스로를 지켜온 방식을 볼게요. 이번엔 점수가 아니라 장면이에요.";

/** 드릴다운(2부) 슬라이더 양끝 라벨 — '가까이 들어간다' 프레임. */
export const DRILLDOWN_SCALE_LABELS = {
  min: "이 아이는 나와 멀다",
  max: "나에 가깝다",
} as const;

/** 지킴이(2부) 장면 카드 도입 문구. */
export const GUARDIAN_SCENE_INTRO = "이런 장면을 떠올려 보세요 —";
