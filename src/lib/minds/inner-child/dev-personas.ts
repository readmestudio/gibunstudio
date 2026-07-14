/**
 * [개발 검수용 픽스처] 16유형별 가짜 SCT 응답.
 *
 * ⚠️ 실서비스 코드가 아니다. `/dev/inner-child-preview` 와 `/api/dev/inner-child-portrait`
 * (둘 다 dev 전용)만 쓴다. 실사용자의 SCT 는 InnerChildTest 가 받아온다.
 *
 * 왜 필요한가: 예전엔 프리뷰가 **가짜 SCT 하나를 16유형 전부에 공유**했다. portrait 은 SCT 를
 * 주재료로 쓰므로, 유형 드롭다운을 아무리 돌려도 같은 사람 얘기("혼자 중요한 결정을 내려야
 * 하는 순간…")가 나왔다 — 정작 이 화면의 목적인 유형별 카피 검수가 불가능했다.
 * 유형마다 그 유형인 사람이 실제로 쓸 법한 답을 넣어, 프리뷰가 진짜 결과에 가깝게 한다.
 *
 * 슬롯 의미(questions.ts SCT_ITEMS 참조):
 *   childhood_self(어릴 적 나) · family_rule(집에서의 규칙) ·
 *   regression_trigger(어린아이가 되는 순간) · escape_behavior(도망치는 방식) ·
 *   inner_voice(내 안의 목소리)
 */

export type DevSct = {
  childhood_self: string;
  family_rule: string;
  regression_trigger: string;
  escape_behavior: string;
  inner_voice: string;
};

export const DEV_PERSONAS: Record<string, DevSct> = {
  abandonment: {
    childhood_self: "눈치를 많이 보던",
    family_rule: "싸우면 아무도 먼저 말을 안 걸었어",
    regression_trigger: "연인이 답장을 몇 시간 안 할 때",
    escape_behavior: "먼저 연락을 끊어버림",
    inner_voice: "어차피 또 떠날 거잖아",
  },
  unrelenting_standards: {
    childhood_self: "칭찬받아야 안심하던",
    family_rule: "잘하는 건 당연하고, 못하면 지적받아",
    regression_trigger: "내가 만든 결과물에 피드백을 받을 때",
    escape_behavior: "될 때까지 밤새 고침",
    inner_voice: "이 정도로는 어림도 없어",
  },
  self_sacrifice: {
    childhood_self: "집안 분위기부터 살피던",
    family_rule: "내 힘든 건 나중에, 가족이 먼저야",
    regression_trigger: "누가 나한테 부탁을 해올 때",
    escape_behavior: "더 바쁘게 일함",
    inner_voice: "네가 안 하면 누가 해",
  },
  mistrust_abuse: {
    childhood_self: "믿었다가 크게 데었던",
    family_rule: "속마음은 함부로 꺼내면 안 돼",
    regression_trigger: "누가 갑자기 잘해줄 때",
    escape_behavior: "관계를 조용히 정리해버림",
    inner_voice: "저 사람 속셈이 뭘까",
  },
  emotional_deprivation: {
    childhood_self: "품에 안겨본 기억이 흐릿한",
    family_rule: "감정 얘기는 하는 게 아니야",
    regression_trigger: "다들 즐거운데 나만 겉도는 것 같을 때",
    escape_behavior: "밤에 폭식함",
    inner_voice: "말 안 해도 좀 알아주면 안 되나",
  },
  defectiveness_shame: {
    childhood_self: "늘 어딘가 모자란 것 같던",
    family_rule: "남 보기 부끄럽지 않게 해야 해",
    regression_trigger: "내 진짜 모습이 드러날 것 같을 때",
    escape_behavior: "약속을 취소하고 숨어버림",
    inner_voice: "알고 나면 실망할걸",
  },
  social_isolation: {
    childhood_self: "어디서든 겉돌던",
    family_rule: "우리 집은 원래 남들이랑 좀 달라",
    regression_trigger: "다들 친해 보이는 자리에 껴야 할 때",
    escape_behavior: "혼자 있는 곳으로 빠져나옴",
    inner_voice: "여긴 내 자리가 아니야",
  },
  dependence_incompetence: {
    childhood_self: "혼자 하면 늘 혼나던",
    family_rule: "네가 뭘 안다고, 시키는 대로 해",
    regression_trigger: "혼자 중요한 결정을 내려야 할 때",
    escape_behavior: "누군가에게 계속 물어봄",
    inner_voice: "나 혼자서는 못 해",
  },
  vulnerability_harm: {
    childhood_self: "늘 조마조마하던",
    family_rule: "무슨 일이 생길지 모르니 항상 조심해",
    regression_trigger: "예정에 없던 전화가 올 때",
    escape_behavior: "최악의 경우를 계속 검색함",
    inner_voice: "분명 뭔가 잘못될 거야",
  },
  enmeshment: {
    childhood_self: "엄마 기분이 곧 내 기분이던",
    family_rule: "우리는 하나야, 따로는 없어",
    regression_trigger: "가족과 다른 선택을 해야 할 때",
    escape_behavior: "그냥 하자는 대로 따라감",
    inner_voice: "내가 뭘 원하는지 나도 모르겠어",
  },
  failure: {
    childhood_self: "형제와 늘 비교당하던",
    family_rule: "될 놈은 떡잎부터 다르대",
    regression_trigger: "새로운 걸 시작해야 할 때",
    escape_behavior: "마감 직전까지 미룸",
    inner_voice: "해봤자 또 안 될 거야",
  },
  entitlement: {
    childhood_self: "관심의 중심에 있어야 했던",
    family_rule: "특별해야 사랑받아",
    regression_trigger: "나를 그냥 여럿 중 하나로 대할 때",
    escape_behavior: "더 크게 티내고 판을 흔듦",
    inner_voice: "내가 이런 취급 받을 사람이 아닌데",
  },
  subjugation: {
    childhood_self: "싫다는 말을 못 하던",
    family_rule: "말대꾸하면 큰일 나",
    regression_trigger: "상대가 언성을 높일 때",
    escape_behavior: "일단 알겠다고 하고 삼킴",
    inner_voice: "그냥 내가 참으면 조용해져",
  },
  approval_seeking: {
    childhood_self: "잘해야 예뻐해주던",
    family_rule: "남들 앞에서는 잘 보여야 해",
    regression_trigger: "내 얘기에 아무 반응이 없을 때",
    escape_behavior: "반응을 계속 새로고침함",
    inner_voice: "이 정도면 괜찮게 보였나",
  },
  negativity_pessimism: {
    childhood_self: "좋은 일에도 먼저 걱정하던",
    family_rule: "방심하면 큰코다쳐",
    regression_trigger: "일이 너무 잘 풀릴 때",
    escape_behavior: "일어날 일을 끝없이 시뮬레이션함",
    inner_voice: "이러다 무슨 일 나지",
  },
  emotional_inhibition: {
    childhood_self: "혼자서도 괜찮은 척하던",
    family_rule: "힘든 걸 티내지 않아야",
    regression_trigger: "감정을 꺼내 보여야 할 때",
    escape_behavior: "잠으로 도망침",
    inner_voice: "티내면 안 돼, 혼자 삼켜",
  },
};

/** 유형별 페르소나. 미등록 유형이면 얼어붙은 아이 것을 쓴다. */
export function devPersona(schemaId: string): DevSct {
  return DEV_PERSONAS[schemaId] ?? DEV_PERSONAS.emotional_inhibition;
}
