/**
 * IFS(내면가족체계) 자료 — 사용자에게 노출되는 워크북에서는
 * 전문 용어(부분·관리자·소방관·추방자·참자아) 사용 금지.
 * 이 파일은 *내부 참조*용. 사용자 텍스트에는 자연어 변환을 적용한다.
 *
 * 출처: "IFS 집단 활동 자료 2026" — 활동지 2~7.
 */

/* ─────────────────── 부분 유형 ─────────────────── */

/**
 * IFS 모델의 5가지 부분 유형. role 분류는 사용자에게 직접 보이지 않고,
 * LLM이 사용자가 묘사한 부분을 어느 유형으로 추정할지에만 쓰인다.
 */
export type PartRole =
  | "manager" // 선제적 보호 — 통제·계획·"잘하려는" 마음 (사용자에겐 "안에서 통제·계획하는 마음")
  | "firefighter" // 반응적 보호 — 충동·중독·주의 분산 (사용자에겐 "고통이 올라오면 갑자기 뛰어드는 마음")
  | "exile" // 추방된 어린아이 — 슬픔·무가치·취약 (사용자에겐 "안에 숨어있는 어린 마음")
  | "self_critic" // 내면비판자 — "더 나아져야 한다"는 비난 (사용자에겐 "스스로를 다그치는 마음")
  | "unclear"; // 분류 어려움

export interface PartTypeReference {
  role: PartRole;
  /** 내부 라벨(영문/한국어). 사용자에게 표시할 때는 user_facing_label 사용. */
  internal_label: string;
  /** 사용자에게 보일 수 있는 자연어 명명. IFS 용어 금지. */
  user_facing_label: string;
  /** 이 유형의 특성 — LLM이 사용자 묘사와 매칭할 때 단서로. */
  signals: string[];
}

export const PART_TYPE_REFERENCE: PartTypeReference[] = [
  {
    role: "manager",
    internal_label: "관리자",
    user_facing_label: "안에서 통제·계획하는 마음",
    signals: [
      "잘하려고 한다",
      "계획·통제·점검",
      "실수하지 않으려 한다",
      "완벽주의",
      "더 노력해야 한다",
    ],
  },
  {
    role: "firefighter",
    internal_label: "소방관",
    user_facing_label: "고통이 올라오면 갑자기 뛰어드는 마음",
    signals: [
      "고통에서 벗어나려 한다",
      "중독적·충동적 행동 (과식·쇼핑·SNS·술·게임)",
      "주의를 분산시킨다",
      "감정 무감각화",
    ],
  },
  {
    role: "exile",
    internal_label: "추방자(유배자)",
    user_facing_label: "안에 숨어있는 어린 마음",
    signals: [
      "슬픔",
      "외로움",
      "상처",
      "취약함",
      "무기력",
      "무가치감",
      "과거 상처·수치 기억",
    ],
  },
  {
    role: "self_critic",
    internal_label: "내면비판자",
    user_facing_label: "스스로를 다그치는 마음",
    signals: [
      "스스로에게 만족 못 함",
      "더 나아져야 한다",
      "자기 비난·자책",
      "엄격한 평가",
    ],
  },
];

/* ─────────────────── 활동지 2: "부분들을 알아가기" ─────────────────── */

/**
 * IFS 활동지 2의 9개 질문을 사용자 자연어로 변환.
 * Step 3(PART 찾기)의 explore points로 사용.
 *
 * 진행 방식: 사용자가 한 사건을 떠올린 뒤 그 안에서 활성화된 마음들을
 * *하나씩* 만나본다. 한 부분당 아래 흐름을 따라가되, 답이 충실하면
 * 적응형으로 다음 부분으로 넘어간다.
 */
export interface PartDiscoveryStep {
  /** 안정적 slug. dialogue turn의 explore_point_id. */
  id: string;
  /**
   * 사용자에게 보이는 시작 질문 (IFS 용어 없음).
   * "{이름}" 토큰이 있으면 name_part 단계에서 답한 마음 이름으로 런타임 치환된다.
   */
  opening: string;
  /**
   * LLM이 다음 질문을 동적 생성할 때 참조하는 주제 가이드.
   * 생략하면 동적 생성 없이 정적 opening을 그대로 쓴다(스크립트형 질문용).
   */
  topic?: string;
  /** 답이 비어도 다음으로 넘어갈 수 있는 지점인지. */
  optional?: boolean;
  /** 허용 최대 후속질문 횟수. 미지정 시 기본(2), 0이면 후속 없이 바로 다음. */
  maxFollowups?: number;
}

/**
 * Step 3 explore points — 7개 흐름 (2026-06-06 심화 재설계).
 *
 * 한 마음에 *이름*을 붙이고, 그 이름으로 깊이 파고든다. #3 이름은 "{이름}",
 * #4 대사는 "{대사}" 토큰으로 이후 질문에 런타임 치환된다(WorkshopConversation의
 * substituteAnswerTokens). 토큰 의존 질문은 topic을 비워 정적 opening을 그대로
 * 사용해 문구·치환이 정확·일관되게 나오게 한다. 도입부(#1·#2)는 후속질문을 끄고
 * (maxFollowups:0), 핵심(#3~#7)은 각 1회까지 후속질문을 허용한다.
 *
 *   1. situation       — 한 사건 떠올리기 (동적)
 *   2. active_minds    — 그 안에서 활성화된 여러 마음 나열 (동적)
 *   3. name_part       — 한 마음에 머물러 *이름* 붙이기
 *   4. part_dialogue   — 그 마음의 *대사*(=자동사고) 그대로 적기
 *   5. real_want       — 그렇게 말하며 진짜 원했던 것
 *   6. origin          — 그 마음이 언제·왜 생겼는지 (계기)
 *   7. self_compassion — 소중한 사람이 그렇게 말한다면 해줄 말 (자기연민)
 */
export const PARTS_DISCOVERY_STEPS: PartDiscoveryStep[] = [
  {
    id: "situation",
    opening:
      "이 워크북은 일·성과·성취와 관련된 마음을 다뤄요. 직장·커리어·학업에서 최근 마음이 크게 흔들렸던 한 순간을 떠올려보세요. (예: 기대만큼 성과가 안 나왔을 때 · 평가나 마감 앞에서 · 비교되거나 인정받지 못했다고 느꼈을 때) 그때 어떤 상황이었나요?",
    topic:
      "직장·성과·커리어·학업 등 *성취 영역*에서 떠올린 구체적 한 사건. 시간·장소·계기를 자연스럽게. (관계·건강 등 성취와 무관한 사건은 지양)",
    // 도입부 — 후속질문 없이 한 번에 받고 다음으로.
    maxFollowups: 0,
  },
  {
    id: "active_minds",
    opening:
      "그 순간, 마음속에 어떤 감정이 가까웠나요? 떠오른 생각이 있었다면 그것도 좋아요. 한 가지가 아니어도 괜찮아요.",
    // topic 없음 — 정적. 쉬운 문구를 그대로 보여주기 위해 동적 생성 금지.
    // 도입부 — 후속질문 없이 한 번에 받고 다음으로.
    maxFollowups: 0,
  },
  {
    id: "name_part",
    opening:
      "그 감정·생각 중 가장 강하게 다가왔던 한 마음에 머물러볼게요. 그 마음에 이름을 붙인다면 뭐라고 부르고 싶나요? (예: '다그치는 나', '불안이', '완벽주의')",
    // topic 없음 — 정적. '이름 붙이기'가 흐트러지지 않도록 LLM 동적 생성 금지.
    maxFollowups: 1,
  },
  {
    id: "part_dialogue",
    opening:
      "'{이름}'(이)라는 이 마음은 그 순간 머릿속에서 뭐라고 말하고 있었나요? 들렸던 말을 대사처럼 그대로 적어보세요.",
    // topic 없음 — 정적. 자동사고를 원문 그대로 포착하는 핵심 질문.
    maxFollowups: 1,
  },
  {
    id: "real_want",
    opening:
      "사실 '{이름}'(이)가 '{대사}'라고 말하면서, 진짜로 원했던 건 무엇이었을까요?",
    // topic 없음 — 정적. {이름}=#3, {대사}=#4 답으로 치환.
    maxFollowups: 1,
  },
  {
    id: "origin",
    opening:
      "'{이름}'(이)라는 이 마음은 언제부터, 왜 생겼을까요? 떠오르는 만큼이면 충분해요.",
    // topic 없음 — 정적.
    optional: true,
    maxFollowups: 1,
  },
  {
    id: "self_compassion",
    opening:
      "만약 가장 소중한 사람이 '{대사}'라고 말하고 있다면, 그 사람에게 어떤 말을 해주고 싶나요?",
    // topic 없음 — 정적. {대사}=#4 답으로 치환.
    optional: true,
    maxFollowups: 1,
  },
];

/* ─────────────────── 활동지 3·4: 보호자 알아가기 ─────────────────── */

/**
 * Step 6·7(관리자 발견 + 긍정 의도)·Step 8(역할 통찰)에서 쓸 질문 흐름.
 * 활동지 3(관리자)·4(소방관) 공통 구조 — 9개 질문.
 */
export interface ProtectorExploreStep {
  id: string;
  opening: string;
  topic: string;
  optional?: boolean;
}

export const PROTECTOR_EXPLORE_STEPS: ProtectorExploreStep[] = [
  {
    id: "when_active",
    opening:
      "그 마음은 보통 어떤 때 주로 나타나나요? 어떤 상황에서 깨어나는지 떠올려보세요.",
    topic: "이 보호하는 마음이 활성화되는 상황·트리거",
  },
  {
    id: "appearance",
    opening: "그 마음은 어떤 모습·목소리·느낌으로 다가오나요?",
    topic: "그 마음의 모습·목소리·신체감각",
    optional: true,
  },
  {
    id: "what_it_says",
    opening: "그 마음은 나에게 뭐라고 이야기하나요?",
    topic: "내면에서 하는 말 (반복되는 메시지)",
  },
  {
    id: "protects_from",
    opening:
      "그 마음은 나를 어떤 것으로부터 지키려고 애쓰고 있는 것 같나요? (가설로 떠올려봐도 좋아요)",
    topic: "그 마음이 보호하려는 대상 — 두려움·고통의 정체",
  },
  {
    id: "feared_if_not",
    opening:
      "그 마음이 이렇게 작동하지 않으면, 어떤 일이 일어날까 봐 두려워하는 것 같나요?",
    topic: "그 마음이 사라지면 일어날까 봐 두려운 것 (보호 의도 핵심)",
  },
  {
    id: "role_with_pain",
    opening:
      "고통스러운 감정이 올라올 때, 그 마음은 어떤 역할을 하고 있나요?",
    topic: "고통 처리에서 그 마음의 기능",
    optional: true,
  },
  {
    id: "positive_intent",
    opening:
      "그 마음이 결국 바라는 것 — 본래의 바람이 있다면 무엇일 것 같나요?",
    topic: "긍정적 의도·본래 바람 (Step 7 핵심)",
  },
  {
    id: "trouble_caused",
    opening:
      "그 마음이 작동하는 방식이 때로는 내 삶에서 어떤 어려움을 만들기도 하나요?",
    topic: "이 마음이 만들어내는 한계·부작용 (Step 8 한계 인식)",
    optional: true,
  },
];

/* ─────────────────── 활동지 7: 내면비판자 + 비판받은 내면아이 ─────────────────── */

export const SELF_CRITIC_EXPLORE_STEPS: ProtectorExploreStep[] = [
  {
    id: "critic_message",
    opening:
      "안에서 스스로 만족하지 못하고 더 나아져야 한다고 다그치는 마음이 있나요? 그 마음은 보통 뭐라고 이야기하나요?",
    topic: "내면비판자의 목소리·메시지",
  },
  {
    id: "critic_protects",
    opening: "그 다그치는 마음은 나를 어떤 것으로부터 지키려는 걸까요?",
    topic: "내면비판자의 보호 의도",
  },
  {
    id: "critic_feared",
    opening:
      "그 마음이 다그치지 않으면 무엇이 일어날까 봐 두려워하는 것 같나요?",
    topic: "내면비판자가 멈추면 두려운 것",
  },
];

/* ─────────────────── 워크북 안내문 (Step 9·10용) ─────────────────── */

/**
 * 마지막 단계에서 IFS 전문 용어 없이 워크북의 본질을 한 줄로 안내.
 * 사용자 명시 인용.
 */
export const WORKBOOK_FRAMING =
  "이 워크북은 마음 안의 다른 존재들을 알아보고, 그들의 관계를 조율하는 상담이었어요.";

/* ─────────────────── 용어 변환 사전 (LLM 시스템 프롬프트용) ─────────────────── */

/**
 * 모든 LLM 호출의 시스템 프롬프트에 첨부하는 절대 금지·치환 규칙.
 * 사용자에게 보이는 화면·텍스트에는 *왼쪽* 단어가 나타나면 안 된다.
 */
export const IFS_TERM_BAN_RULES = `## 용어 절대 규칙 (어기면 무효)
다음 IFS 전문 용어는 사용자에게 보이는 어떤 문장에도 등장하면 안 된다 (LLM 응답에서도 금지):
- **"부분"** → "마음" / "안에서 ___하는 마음" / "곳" / "자리"로 대체.
  * 신체 위치를 물을 때도 "몸의 부분" 금지. "몸 어디" / "몸의 어느 곳" / "어느 자리에서 느껴지나요" 사용.
- **"관리자"** → "안에서 통제·계획하는 마음"
- **"소방관"** → "고통이 올라오면 갑자기 뛰어드는 마음"
- **"보호자"** → "지키려는 마음"
- **"추방자" / "유배자"** → "안에 숨어있는 어린 마음"
- **"참자아" / "Self"** → "고요히 바라보는 자리" 또는 그냥 "나"
- **"짐 내려놓기"** → "이 마음이 짊어진 것을 풀어주기"
- **"양극화"** → "두 마음이 부딪치는 자리"
- 영문 약어 (IFS, Self, Manager, Exile, Firefighter 등)도 금지.

내담자는 IFS 모델을 모른다. 자연어로만. 한국어 단어 "부분"은 *어떤 맥락에서도* 등장하지 말 것.`;
