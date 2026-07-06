/**
 * 무료 "마음 확인"(/minds) 축약 진단 흐름.
 *
 * [개편 2026-07-06] 자유서술 5문항(타이핑 부담 → 대량 이탈)을
 *   · 앞부분 = 객관식(탭) 3문항 → 1~2분 만에 사건·감정·반응의 골격을 빠르게 세우고,
 *   · 뒷부분 = 문장 완성 검사 3문항 → 캐릭터 분석의 *정확도*를 끌어올리는 원문 인용을 확보
 * 하는 하이브리드로 재구성했다. 연락처 캡처는 무료 흐름에서 제거(결제 시 알림톡용으로만
 * 받는다) — "결과부터 보여주고 지갑은 나중에" 원칙.
 *
 * 캐릭터(마음 리스트) 품질을 좌우하는 재료:
 *  1. 구체적 사건 맥락      → situation(객관식) : 모든 마음의 배경
 *  2. 그 순간의 몸·감정 신호 → body_signal(다중선택) : 마음이 2~3개로 갈라지는 엔진
 *  3. 반사적 첫 반응        → first_reaction(객관식) : 가장 앞에 나선 마음(리더) 단서
 *  4. 자동사고 원문 인용     → loudest_voice(문장완성) : evidence_quote·catchphrase 직접 근거
 *  5. 반대/거드는 목소리     → counter_voice(문장완성) : 갈등 구도(conflicts) 재료
 *  6. 숨은 욕구             → hidden_need(문장완성) : exile(여린 속마음) → 정확도·깊이
 *
 * [id 안정성] situation·loudest_voice·counter_voice 는 분석 실패 시 폴백
 * (parts-map/route.ts · MindsFlow.tsx)이 id로 답을 골라 개인화한다. 문구·보기는
 * 바꿔도 이 id 들과 {대사} 토큰은 그대로 둔다.
 *
 * IFS 용어 금지(IFS_TERM_BAN_RULES)는 *유료 워크북* 분석 프롬프트에서만 강제된다.
 * 무료 /minds 는 드라마 배역명(리더/빌런/난봉꾼/관리자/추방자)을 그대로 노출한다.
 */

import type { StepKey } from "@/lib/self-workshop/conversation";

/** 무료 흐름의 transcript step_key. 유료 parts_discovery 와 구분해 추적/분석에 쓴다. */
export const FREE_MINDS_STEP_KEY: StepKey = "parts_discovery";

/** 문항 유형 — single: 택1, multi: 다중선택, sentence: 문장 완성(빈칸 채우기). */
export type MindStepType = "single" | "multi" | "sentence";

export interface MindOption {
  /** 분석/저장용 안정 값(영문 slug). */
  value: string;
  /** 화면에 보이는 보기 문구. 분석에는 이 label 이 답변 텍스트로 들어간다. */
  label: string;
}

export interface FreeMindStep {
  /** 안정적 slug. 분석/폴백이 id 로 답을 참조한다. */
  id: string;
  /** 문항 유형. */
  type: MindStepType;
  /** 화면 질문 문구. {대사} 토큰은 loudest_voice 답으로 런타임 치환. */
  opening: string;
  /** 질문 아래 보조 안내. 없으면 생략. */
  hint?: string;
  /** 분석 프롬프트가 참조할 주제 가이드(내부용, 화면 비노출). */
  topic: string;
  /** 빈 답이어도 다음으로 넘어갈 수 있는지(주로 뒤쪽 문장완성). */
  optional?: boolean;

  /* ── single / multi 전용 ── */
  /** 보기 목록. */
  options?: MindOption[];
  /** multi 에서 최대 선택 개수(없으면 제한 없음). */
  maxSelect?: number;

  /* ── sentence 전용 ── */
  /** 빈칸 앞에 붙는 유도 문구(문장 완성 느낌을 주는 리드). */
  stemLead?: string;
  /** 답을 큰따옴표로 감쌀지(대사 인용형 문항). */
  quoted?: boolean;
  /** 이 답이 이 길이 미만이면 "조금만 더" 힌트. */
  minChars?: number;
}

/**
 * 6문항 하이브리드 흐름 — 앞 3문항 객관식(탭) → 뒤 3문항 문장 완성.
 *
 *   1. situation      [single] 마음이 흔들린 사건의 영역 (회상 · 근거 앵커)
 *   2. body_signal    [multi]  그 순간의 몸·마음 신호 (마음이 갈라지는 엔진)
 *   3. first_reaction [single] 반사적 첫 반응 (가장 앞에 나선 마음 · 리더)
 *   4. loudest_voice  [sentence] 가장 큰 목소리의 대사 원문 (캐릭터 A · 인용)
 *   5. counter_voice  [sentence] 맞서거나 거든 또 다른 목소리 (캐릭터 B · 갈등)
 *   6. hidden_need    [sentence] 사실 진짜 바랐던 것 (여린 속마음 · exile)
 */
export const FREE_MINDS_STEPS: FreeMindStep[] = [
  {
    id: "situation",
    type: "single",
    opening: "요즘, 마음이 가장 크게 흔들렸던 순간은 어떤 때였나요?",
    hint: "가장 먼저 떠오르는 하나를 골라주세요.",
    topic:
      "감정이 크게 흔들린 사건의 영역(관계·일·자기 자신·미래 등). 모든 마음 해석의 배경 맥락으로 쓴다.",
    options: [
      { value: "rel_hurt", label: "가까운 사람의 말이나 행동에 상처받았을 때" },
      { value: "work_pressure", label: "일이나 해야 할 일이 뜻대로 안 풀렸을 때" },
      { value: "alone_down", label: "혼자 있는데 마음이 툭 가라앉았을 때" },
      { value: "conflict", label: "누군가와 부딪치고 갈등했을 때" },
      { value: "future_anx", label: "앞날이 막막하고 불안했을 때" },
      { value: "self_disappoint", label: "내 모습에 실망하고 자책했을 때" },
      { value: "other", label: "그 밖의 다른 순간" },
    ],
  },
  {
    id: "body_signal",
    type: "multi",
    opening: "그 순간, 몸과 마음에는 어떤 신호가 왔나요?",
    hint: "느꼈던 걸 모두 골라주세요. (여러 개 괜찮아요)",
    topic:
      "신체 감각·각성 신호(다중). 몸의 반응은 아직 말이 되지 못한 마음의 단서 — 서로 다른 마음이 갈라지는 재료로 쓴다.",
    maxSelect: 5,
    options: [
      { value: "chest_tight", label: "가슴이 답답하고 조여왔다" },
      { value: "trembling", label: "손발이 떨리거나 몸이 굳었다" },
      { value: "hot", label: "열이 오르고 얼굴이 화끈했다" },
      { value: "drained", label: "기운이 쭉 빠졌다" },
      { value: "blank", label: "머리가 하얘지고 멍했다" },
      { value: "tears", label: "눈물이 나거나 목이 메었다" },
      { value: "nausea", label: "속이 울렁이고 답답했다" },
      { value: "numb", label: "오히려 아무 느낌이 없었다" },
    ],
  },
  {
    id: "first_reaction",
    type: "single",
    opening: "그때, 나도 모르게 가장 먼저 한 행동은 무엇이었나요?",
    hint: "생각하기 전에 반사적으로 튀어나온 반응이요.",
    topic:
      "반사적 첫 반응. 즉각 튀어나온 행동이 가장 앞에 나선 마음(리더/보호자)의 가장 강한 단서.",
    options: [
      { value: "endure", label: "꾹 참고 아무렇지 않은 척했다" },
      { value: "burst", label: "감정을 그대로 드러내거나 터뜨렸다" },
      { value: "avoid", label: "그 자리를 피하고 혼자 있고 싶었다" },
      { value: "blame_self", label: "'내가 문제야'라며 나를 탓했다" },
      { value: "blame_other", label: "상대나 상황을 원망했다" },
      { value: "fix", label: "어떻게든 바로잡으려 애썼다" },
    ],
  },
  {
    id: "loudest_voice",
    type: "sentence",
    opening: "그 순간, 머릿속에서 가장 크게 들렸던 목소리를 그대로 옮겨볼게요.",
    stemLead: "그 마음은 나에게 이렇게 말하고 있었어요 —",
    quoted: true,
    hint: "예: 왜 나한테만 이래 · 내가 또 망쳤어 · 이러다 다 잃을 거야",
    topic:
      "가장 전면에 나선 마음의 자동사고 원문. evidence_quote·catchphrase 의 직접 근거이자 캐릭터 A를 또렷하게 만드는 핵심 인용.",
    minChars: 4,
  },
  {
    id: "counter_voice",
    type: "sentence",
    opening:
      "'{대사}' — 그런데 마음 한편에서, 이 목소리와 다르게 말하던 또 다른 목소리는 없었나요?",
    stemLead: "다른 한 마음은 이렇게 말했어요 —",
    quoted: true,
    hint: "맞서 달래던 목소리든, 거들며 부추기던 목소리든 좋아요. 없었던 것 같으면 건너뛰어도 괜찮아요.",
    topic:
      "가장 큰 목소리에 맞서거나 거든 또 다른 마음. 두 번째 캐릭터와 conflicts(대립) 재료를 확보한다.",
    optional: true,
  },
  {
    id: "hidden_need",
    type: "sentence",
    opening: "마지막으로. 그 순간, 사실 내가 진짜 바랐던 건 무엇이었을까요?",
    stemLead: "사실 내가 진짜 바랐던 건",
    hint: "예: 그냥 이해받고 싶었다 · 잠깐이라도 쉬고 싶었다 · 내가 틀리지 않았다는 말",
    topic:
      "겉 행동 아래의 진짜 욕구. 여리고 상처받기 쉬운 속마음(exile)을 끌어내 캐릭터 해석의 정확도와 깊이를 높인다.",
    optional: true,
  },
];

/** loudest_voice 답을 이후 질문의 {대사} 토큰에 치환하기 위한 매핑. */
export const FREE_MINDS_TOKENS: Record<string, string> = {
  "{대사}": "loudest_voice",
};

/** 분석(마음 리스트 생성)을 시작해도 좋은 최소 답변 수. 객관식 3 + 핵심 인용 1. */
export const FREE_MINDS_MIN_ANSWERS = 4;
