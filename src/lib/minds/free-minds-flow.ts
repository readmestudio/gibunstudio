/**
 * 무료 "마음 확인"(/minds) 축약 대화 흐름.
 *
 * 유료 워크북 Step 3(7문항, 15~25분)을 무료 깔때기에 맞게 5문항(~7~10분)으로 축약하되,
 * `parts-map` 분석이 *납득되는 마음 리스트*를 뽑아낼 최소 재료는 반드시 확보하도록 설계.
 *
 * 마음 리스트 품질을 좌우하는 3가지 재료:
 *  1. 구체적 한 사건         → 모든 마음의 evidence_quote 근거가 됨
 *  2. 그 순간의 *여러* 감정/생각 → 마음이 2~3개로 갈라지는 핵심 엔진 (active_minds)
 *  3. 자동사고 원문 인용       → "내 답에서: …" 카드의 신뢰감
 *
 * 4번(counter_voice)은 방향이 반대인 두 번째 마음을 끌어내, 유료에서 공개할
 * "갈등 구도(conflicts)"의 재료까지 미리 확보한다 — 무료에선 캐릭터만, 관계는 유료.
 *
 * [범위 결정] 무료 /minds 는 유료 워크북과 *독립된 유입(lead)용* 콘텐츠다. 이 5문항
 * 대화로 워크북 Step 3·4 를 대체하지 않는다 — 5문항만으로는 핵심신념 발굴 등 후속
 * 단계의 재료가 부족하기 때문. 구매자는 워크북 Step 1 부터 끝까지 온전히 진행한다.
 * (무료 대화를 워크북으로 이관하는 연속성 스킵은 의도적으로 만들지 않는다.)
 *
 * IFS 용어 금지(IFS_TERM_BAN_RULES)는 *유료 워크북*의 분석 프롬프트에서만 강제된다.
 * 무료 /minds 는 드라마 배역명(리더/빌런/난봉꾼/관리자/추방자)을 그대로 노출한다.
 */

import type { StepKey } from "@/lib/self-workshop/conversation";

/** 무료 흐름의 transcript step_key. 유료 parts_discovery 와 구분해 추적/분석에 쓴다. */
export const FREE_MINDS_STEP_KEY: StepKey = "parts_discovery";

export interface FreeMindStep {
  /** 안정적 slug. ConversationTurn.explore_point_id 와 매핑. */
  id: string;
  /** 화면에 보이는 질문 문구. {대사} 토큰은 loudest_voice 답으로 런타임 치환. */
  opening: string;
  /** 질문 아래 보조 안내(placeholder/도움말). 없으면 생략. */
  hint?: string;
  /** 분석 프롬프트가 참조할 주제 가이드(내부용, 화면 비노출). */
  topic: string;
  /** 빈 답이어도 다음으로 넘어갈 수 있는지. */
  optional?: boolean;
  /** 이 답이 이 길이 미만이면 "너무 얕음" 힌트(클라이언트 진행 가드용). */
  minChars?: number;
}

/**
 * 5문항 축약 흐름.
 *
 *   1. situation      — 최근 감정이 크게 흔들린 한 사건 (근거 앵커)
 *   2. active_minds   — 그 순간 올라온 *여러* 감정·생각 (마음 분기 엔진)
 *   3. loudest_voice  — 가장 큰 목소리의 마음 + 그 대사(자동사고 원문)
 *   4. counter_voice  — 그 와중에 반대로 끌어당긴 다른 마음 (2번째 캐릭터·갈등 재료)
 *   5. other_minds    — 그 밖에 또 다른 목소리를 낸 마음 (캐릭터를 한 명 더 — 명단 완성)
 */
export const FREE_MINDS_STEPS: FreeMindStep[] = [
  {
    id: "situation",
    opening:
      "최근에 마음이 크게 불편했던 순간을 하나 떠올려보세요. 화가 났거나, 속상했거나, 괜히 마음이 무거웠던 순간이요. 그때 어떤 상황이었나요?",
    hint: "예: 누군가의 말에 욱했을 때 · 일이 뜻대로 안 풀렸을 때 · 혼자 있는데 갑자기 마음이 가라앉았을 때",
    topic:
      "일상에서 감정이 크게 흔들린 구체적 한 사건(관계·일·자기 자신 등 영역 제한 없음). 시간·장소·계기가 드러나게.",
    minChars: 10,
  },
  {
    id: "active_minds",
    opening:
      "그 순간, 마음속에서 어떤 감정과 생각들이 한꺼번에 올라왔나요? 하나가 아니어도 좋아요. 떠오른 대로 적어주세요.",
    hint: "서로 다른 마음이 동시에 있었다면 그게 더 좋아요. (예: 불안하면서도 오기가 났다 / 자책하면서도 억울했다)",
    topic:
      "한 사건 안에서 동시에 활성화된 여러 감정·생각. 마음이 2~3개로 갈라지는 핵심 재료 — 복수성을 최대한 끌어낸다.",
    minChars: 10,
  },
  {
    id: "loudest_voice",
    opening:
      "그중에서 가장 크게 들렸던 목소리에 머물러볼게요. 그 마음은 머릿속에서 뭐라고 말하고 있었나요? 들렸던 말을 대사처럼 그대로 적어보세요.",
    hint: "예: \"왜 나한테만 이래\" · \"내가 또 망쳤어\" · \"이러다 다 잃을 거야\"",
    topic:
      "가장 전면에 나선 마음의 자동사고 원문. evidence_quote·catchphrase 의 직접 근거.",
    minChars: 6,
  },
  {
    id: "counter_voice",
    opening:
      "'{대사}' — 이렇게 다그치는 목소리가 큰 와중에, 마음 한켠에서 다르게 속삭인 마음도 있었나요? (예: 그만 쉬고 싶다 · 도망치고 싶다 · 사실은 억울하다)",
    hint: "정반대로 끌어당긴 마음이 있었다면 적어주세요. 없었던 것 같으면 비워두고 넘어가도 괜찮아요.",
    topic:
      "방향이 반대인 두 번째 마음. 두 번째 캐릭터이자 유료에서 공개할 갈등 구도(conflicts)의 재료.",
    optional: true,
  },
  {
    id: "other_minds",
    opening:
      "여기까지 떠올린 마음들 말고도, 그 순간 마음 한켠에서 또 다른 목소리를 낸 마음이 있었나요? 작게 스쳐 지나간 마음이어도 좋아요.",
    hint: "예: '왜 나만 이래'라는 억울함 · '어차피 안 될 거야'라는 체념 · 아무렇지 않은 척하던 마음",
    topic:
      "앞에서 다루지 않은 추가적인 마음. 캐릭터 수를 늘려 마음 리스트(지도)를 더 또렷하고 풍부하게 만든다. 이 테스트의 목적은 '여러 마음의 캐릭터화'이므로, 마지막은 긍정 의도가 아니라 또 다른 마음을 한 명 더 발견하는 데 둔다.",
    optional: true,
  },
];

/** loudest_voice 답을 이후 질문의 {대사} 토큰에 치환하기 위한 매핑. */
export const FREE_MINDS_TOKENS: Record<string, string> = {
  "{대사}": "loudest_voice",
};

/** 분석(마음 리스트 생성)을 시작해도 좋은 최소 답변 수. 도입 2문항 + 핵심 1문항. */
export const FREE_MINDS_MIN_ANSWERS = 3;
