/**
 * Phase 2 심층 리포트 카드 10장 생성 프롬프트 (v3 — 10카드 구조)
 *
 * 각 카드 프롬프트: 2,000-2,500자 지시
 * - 구체적 장면 묘사 지시
 * - SCT 문장완성 응답 원문 포함 (카드별 맞춤)
 * - 이전 카드 반복 금지 목록 명시
 * - Phase 1 TCI 6축/카테고리/에니어그램 센터 활용
 */

import type { Phase2CardDataExtended } from '../types';
import { getWritingToneDirective } from '@/lib/writing-guide';

// Phase2CardDataExtended를 re-export (route.ts에서 사용)
export type { Phase2CardDataExtended as Phase2CardData };

// ── 헬퍼 함수 ──

function formatTCI(tci: Phase2CardDataExtended['phase1']['tci_scores']): string {
  return `자극추구(NS): ${tci.NS}, 위험회피(HA): ${tci.HA}, 연대감(RD): ${tci.RD}, 인내력(P): ${tci.P}, 자율성(SD): ${tci.SD}, 협동성(CO): ${tci.CO}, 자기초월(ST): ${tci.ST}`;
}

function formatDesires(desires: Phase2CardDataExtended['deepCrossValidation']['hiddenDesires']): string {
  return desires.map(d =>
    `• "${d.label}": ${d.description} [근거: ${d.source}]`
  ).join('\n');
}

function userName(data: Phase2CardDataExtended): string {
  return data.phase1.user_name || '당신';
}

/** SCT 응답을 안전하게 포맷 (없으면 "(응답 없음)") */
function sct(text?: string): string {
  return text && text.length > 1 ? `"${text}"` : '(응답 없음)';
}

/** CBT 분석 데이터를 안전하게 포맷 */
function formatCBT(data: Phase2CardDataExtended): string {
  const cbt = data.deepCrossValidation.cbtAnalysis;
  if (!cbt) return '(CBT 분석 데이터 없음)';

  const parts: string[] = [];
  parts.push(`[5-Part Model]`);
  parts.push(`• 상황: ${cbt.fivePartModel.situation}`);
  parts.push(`• 자동사고(Hot Thought): ${cbt.fivePartModel.automaticThought}`);
  parts.push(`• 감정: ${cbt.fivePartModel.emotion}`);
  parts.push(`• 신체반응: ${cbt.fivePartModel.physicalReaction}`);
  parts.push(`• 행동: ${cbt.fivePartModel.behavior}`);

  if (cbt.cognitiveDistortions.length > 0) {
    parts.push(`\n[인지 왜곡 패턴 — 일상 언어로 묘사할 것]`);
    for (const d of cbt.cognitiveDistortions) {
      parts.push(`• ${d.label}: ${d.relationshipImpact} [근거: ${d.evidence.slice(0, 50)}]`);
    }
  }

  parts.push(`\n[사고 체인 — 자동사고→중간신념→핵심신념]`);
  parts.push(cbt.thoughtChain);

  return parts.join('\n');
}

// ── 10장 카드 프롬프트 ──

export const PHASE2_CARD_PROMPTS = {
  /**
   * 카드 1: Phase1→Phase2 브릿지
   * 무료 리포트 → 심층 리포트로 자연스럽게 연결
   * SCT: q15 "진짜 원하는 관계" 원문 인용
   */
  card_01_bridge: (data: Phase2CardDataExtended): string => {
    const layers = data.deepCrossValidation.personalityLayers;
    const authScore = Math.round(data.deepCrossValidation.authenticityScore * 100);
    const dims = data.deepCrossValidation.dimensions;
    const bigGaps = dims.filter(d => Math.abs(d.diff) >= 20);

    return `[카드 1: Phase1→Phase2 브릿지]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
무료 리포트에서 "어떤 반응을 일으키는 사람인지" 알아봤다면, 이제 "왜 그런 사람이 되었는지" 찾아가는 심층 리포트의 시작. YouTube 구독 데이터가 보여주는 '무의식적 나'와 설문이 보여주는 '의식적 나'를 직접 비교해서, 읽는 사람이 "이거 어떻게 알았지?"라는 첫 소름을 느끼게 하는 것.

■ 제공 데이터

[겉모습 — YouTube 기반]
${layers.surface}

[의식적 자아 — 설문 기반]
${layers.conscious}

[무의식 — 불일치에서 도출]
${layers.unconscious}

[자기 일치도]
${authScore}% (100%에 가까울수록 겉과 속이 일치)

[주요 불일치 차원]
${bigGaps.length > 0
  ? bigGaps.map(d => `• ${d.dimension}: YouTube ${d.youtube_value} vs 설문 ${d.survey_value} → ${d.interpretation}`).join('\n')
  : '큰 불일치는 없음 — 자기 이해도가 높은 사람'}

[TCI 6축]
${formatTCI(data.phase1.tci_scores)}

[SCT — 핵심 욕구 (q15)]
"내가 진짜 원하는 관계는 한마디로..." → ${sct(data.survey.q15_core_desire)}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 도입: Phase 1에서 Phase 2로 넘어가는 자연스러운 다리.
   - "무료 리포트에서 어떤 반응을 일으키는 사람인지 알아봤어요. 이제 '왜' 그런 사람이 되었는지 찾아갑니다."
   - YouTube 구독 데이터가 보여주는 당신과, 설문에서 직접 답한 당신을 나란히 놓겠다는 안내

2) 본론: YouTube 기반 겉모습과 설문 기반 의식을 직접 대비하세요.
   - 일치하는 부분: "여기서는 당신이 자신을 정확히 알고 있어요"
   - 불일치하는 부분: "여기서 흥미로운 차이가 나타나요. 이건 약점이 아니라..."
   - 보편적 행동 패턴 + 인사이트로 대비를 묘사하세요 (구체적 장소/시간 특정 금지)

3) q15 핵심 욕구를 자연스럽게 녹이세요.
   - "당신이 원하는 관계의 본질"을 비교 결과와 연결

4) 클로저: 자기 일치도 ${authScore}%의 의미를 해석하세요.
   - 높으면: "자기 자신을 솔직하게 마주하고 있다는 증거"
   - 낮으면: "아직 탐색 중인 내면의 영역이 있다는 것 — 그리고 그것은 가능성"
   - "이제부터 그 '왜'를 함께 찾아갈게요"라는 다음 카드 예고

■ 이 카드에서 하지 말 것
- Phase 1 리포트의 내용을 그대로 반복하지 마세요
- "분석 결과"라는 표현 금지
- "두 개의 거울" 비유 사용 금지
- 다른 SCT 응답(q6-q14)은 이 카드에서 인용하지 마세요

■ 분량: 1,800~2,500자`;
  },

  /**
   * 카드 2: "당신이 삶에서 진짜 추구하는 것"
   * 삶의 가치 — hiddenDesires + TCI ST/SD + q14 이상적 하루 + q15 핵심 욕구
   */
  card_02_life_meaning: (data: Phase2CardDataExtended): string => {
    const desires = data.deepCrossValidation.hiddenDesires;
    const tci = data.phase1.tci_scores;

    return `[카드 2: "당신이 삶에서 진짜 추구하는 것"]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
이 사람이 삶에서 진짜 추구하는 가치를 보여주는 것. 숨겨진 욕구(hiddenDesires)와 TCI 자기초월(ST)/자율성(SD) 축을 결합해서, 이 사람이 무의식적으로 향하고 있는 방향을 드러내세요. q14 이상적인 하루와 q15 핵심 욕구를 소재로 활용하세요.

■ 제공 데이터

[추론된 숨겨진 욕구]
${formatDesires(desires)}

[TCI 핵심 — 삶의 가치 관련]
• 자기초월(ST): ${tci.ST} — ${tci.ST > 60 ? '삶의 의미와 영성에 대한 탐색이 강한 편' : '현실적이고 구체적인 가치를 추구하는 편'}
• 자율성(SD): ${tci.SD} — ${tci.SD > 60 ? '자기 주도적으로 삶을 설계하려는 경향' : '외부 기준이나 관계에 기반해 방향을 잡는 경향'}

[SCT — 이상적인 하루 (q14)]
"내가 꿈꾸는 파트너와의 가장 이상적인 하루는..." → ${sct(data.survey.q14_ideal_day)}

[SCT — 핵심 욕구 (q15)]
"내가 진짜 원하는 관계는 한마디로..." → ${sct(data.survey.q15_core_desire)}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 섹션 "당신의 삶을 움직이는 힘":
   - 숨겨진 욕구들을 종합해서, 이 사람의 삶을 관통하는 핵심 가치를 도출하세요
   - TCI ST/SD 점수와 연결하여, 이 가치가 어디서 오는지 설명
   - "당신이 무의식적으로 향하고 있는 방향"

2) 섹션 "이상적인 하루가 말해주는 것":
   - ★ q14 원문을 직접 인용하며 시작
   - "당신이 꿈꾸는 하루를 자세히 들여다보면..." → 이 하루가 반영하는 삶의 가치를 해석
   - 단순한 행동 묘사가 아니라, 그 하루가 의미하는 것

3) 섹션 "진짜 원하는 관계의 본질":
   - ★ q15 원문을 직접 인용
   - 이 한마디가 담고 있는 깊은 의미를 풀어주세요
   - 숨겨진 욕구와 q15가 가리키는 같은 방향

4) 섹션 "결혼에서 이 가치가 의미하는 것":
   - 앞에서 도출한 핵심 가치가 결혼/깊은 관계에서 어떤 모습으로 나타나는지
   - 이 가치를 공유하는 파트너와의 관계 vs 공유하지 못하는 파트너와의 관계
   - 행동 패턴 + 인사이트로 구체화

■ 이 카드에서 하지 말 것
- 카드 1의 브릿지/비교 프레이밍 반복 금지
- "자기 일치도" 수치 반복 금지
- 욕구를 판단하거나 고쳐야 할 것으로 프레이밍하지 마세요
- TCI 점수를 직접적으로 나열하지 마세요 (해석만)

■ 분량: 2,000~3,000자`;
  },

  /**
   * 카드 3: "의식이 모르는 욕구"
   * 숨겨진 욕구 + q11 편안함의 원천 + q14/q15
   */
  card_03_unconscious_desires: (data: Phase2CardDataExtended): string => {
    const desires = data.deepCrossValidation.hiddenDesires;

    return `[카드 3: "의식이 모르는 욕구"]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
데이터에서 추론한 숨겨진 욕구 + 사용자가 직접 쓴 SCT 응답을 연결해서, "내 글을 누군가 진짜로 읽었구나"라는 감동을 주는 것. q11(편안함의 원천)을 새롭게 활용하여 욕구의 뿌리를 탐색하세요.

■ 제공 데이터

[추론된 숨겨진 욕구]
${formatDesires(desires)}

[SCT — 편안함의 원천 (q11)]
"나를 가장 편하게 만들어주는 사람이나 상황은..." → ${sct(data.survey.q11_comfort_source)}

[SCT — 이상적인 하루 (q14)]
"내가 꿈꾸는 파트너와의 가장 이상적인 하루는..." → ${sct(data.survey.q14_ideal_day)}

[SCT — 핵심 욕구 (q15)]
"내가 진짜 원하는 관계는 한마디로..." → ${sct(data.survey.q15_core_desire)}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 섹션 "의식이 모르는 욕구":
   - q14나 q15의 **원문 한 줄을 직접 인용**하며 시작하세요.
   예시: "당신이 꿈꾸는 이상적인 하루를 묘사하며 쓴 ${sct(data.survey.q14_ideal_day?.slice(0, 30))}라는 문장을 읽었을 때..."
   → 상담사가 내담자의 일기를 읽어준 것 같은 느낌
   - 숨겨진 욕구 하나하나를 풀어가세요.
   - 각 욕구마다 보편적 행동 패턴 + "왜 이 욕구가 있는지" 인사이트를 붙이세요
     예: "'안전한 친밀감'이라는 욕구는... 옆에 누군가가 있다는 것만으로 안도하는 패턴이에요. 혼자서는 편해도, 혼자인 건 다른 문제니까요."
   - q14/q15에서 관련 키워드가 있으면 연결하세요

2) 섹션 "편안함의 원천":
   - ★ q11 원문을 직접 인용하며 시작
   - "당신이 가장 편안하다고 느끼는 순간 — ${sct(data.survey.q11_comfort_source)}"
   - 이 편안함이 숨겨진 욕구와 어떻게 연결되는지 해석
   - 편안함을 느끼는 조건이 관계에서 무엇을 의미하는지

3) 섹션 "불일치가 말해주는 것":
   - 의식적으로 원하는 것(q15)과 무의식적 욕구(hiddenDesires)의 차이점
   - 이 차이가 있다는 것은 나쁜 게 아니라, 아직 탐색 중인 영역이 있다는 의미

4) 섹션 "이 욕구를 인정하는 것":
   - 이 욕구들이 결혼과 연애에서 어떤 의미인지 연결
   - 욕구를 인정하는 것이 왜 중요한지
   - 파트너에게 이 욕구를 어떻게 표현할 수 있는지 (가상 대화 1개)
     예: "솔직히 말하면... '나는 혼자 있고 싶을 때도 있지만, 그래도 네가 가까이 있어 줬으면 좋겠어'라고요."

■ 이 카드에서 하지 말 것
- 카드 1의 비교 프레이밍 반복 금지
- "자기 일치도" 수치 반복 금지
- 카드 2에서 다룬 "삶의 가치" 프레이밍 반복 금지 (이 카드는 "욕구"에 집중)
- 욕구를 판단하거나 고쳐야 할 것으로 프레이밍하지 마세요

■ 분량: 2,000~3,000자`;
  },

  /**
   * 카드 4: "마음의 연쇄 반응"
   * 5-Part Model(도미노 비유) + 인지 왜곡 + 감정 청사진
   * SCT: q16 Hot Thought + q10 신체 반응 + q9 스트레스 반응
   */
  card_04_chain_reaction: (data: Phase2CardDataExtended): string => {
    const blueprint = data.deepCrossValidation.emotionalBlueprint;
    const tci = data.phase1.tci_scores;
    const q5 = data.survey.q5_emotional_expression ?? 5;
    const cbt = data.deepCrossValidation.cbtAnalysis;

    return `[카드 4: "마음의 연쇄 반응"]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
하나의 생각이 감정→신체→행동으로 이어지는 "도미노"를 보여주는 것. q16 Hot Thought를 첫 번째 도미노로 놓고, q10 신체 반응, q9 행동 반응까지 연쇄를 그려주세요. 인지 왜곡 패턴을 일상 언어로 자연스럽게 녹이세요.

■ 제공 데이터

${cbt ? formatCBT(data) : '(CBT 데이터 없음 — 기존 감정 청사진 기반으로 작성)'}

[감정 청사진]
• 스트레스 반응: ${blueprint.stressResponse}
• 회복 방식: ${blueprint.healingPattern}
• 갈등 스타일: ${blueprint.conflictStyle}
• 감정 표현도: ${blueprint.emotionalExpression}/100 (설문 q5에서 ${q5}/10으로 응답)

[★ SCT — 핵심 소재]
• q16 Hot Thought: "연인이 진지하게 이야기하자고 할 때 떠오른 생각" → ${sct(data.survey.q16_hot_scenario)}
• q10 신체 반응: "불안할 때 몸에서 느껴지는 변화" → ${sct(data.survey.q10_body_signal)}
• q9 스트레스 반응: "스트레스 받으면 가장 먼저..." → ${sct(data.survey.q9_stress_response)}

[TCI 핵심]
• 위험회피(HA): ${tci.HA} — ${tci.HA > 60 ? '불안 감수성이 높은 편' : '비교적 대담한 편'}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 도입: "도미노"에 비유하세요.
   - "마음속에도 도미노가 있어요. 하나의 생각이 쓰러지면, 감정이 따라 쓰러지고, 몸이 반응하고, 행동이 바뀌어요."
   - 보편적 행동 패턴으로 시작: "연인이 '우리 이야기 좀 하자'라고 했을 때..."

2) ★ q16 Hot Thought를 "첫 번째 도미노"로 인용하세요.
   - "그 순간 당신의 머릿속에 가장 먼저 떠오른 생각은 ${sct(data.survey.q16_hot_scenario)}였어요."
   - "이 생각이 첫 번째 도미노예요."

3) ★ q10 신체 반응을 "두 번째 도미노"로 인용하세요.
   - "그리고 당신의 몸은 이렇게 반응했어요: ${sct(data.survey.q10_body_signal)}"
   - "몸은 마음보다 솔직해요. 당신이 의식하기도 전에 이미 신호를 보내고 있었어요."

4) 인지 왜곡 패턴을 **일상 언어로** 묘사하세요 (전문 용어 직접 사용 금지).
${cbt && cbt.cognitiveDistortions.length > 0
  ? cbt.cognitiveDistortions.map(d => `   - "${d.evidence.slice(0, 40)}..." → ${d.relationshipImpact}`).join('\n')
  : '   - (특정 패턴이 명확하지 않다면, 일반적인 감정 연쇄를 묘사하세요)'}

5) 감정 표현도 ${blueprint.emotionalExpression}과 연결:
   - 이 연쇄 반응에서 감정을 얼마나 빠르게/느리게 알아차리는지

6) 가상 대화 예시 1개:
   - 이 도미노가 작동하는 구체적 관계 장면

7) 마무리: "도미노를 멈추는 방법은 첫 번째 도미노를 알아차리는 것"
   - 알아차림의 가치를 강조

■ 이 카드에서 하지 말 것
- "인지 왜곡", "자동적 사고", "5-Part Model" 등 전문 용어 사용 금지
- 카드 1-3의 비유/프레이밍 반복 금지
- 카드 3의 숨겨진 욕구 내용 반복 금지

■ 분량: 1,800~2,800자`;
  },

  /**
   * 카드 5: "보이지 않는 규칙"
   * 중간 신념(규칙/태도/가정) — q17 원문 인용 + 핵심 신념 연결
   */
  card_05_invisible_rules: (data: Phase2CardDataExtended): string => {
    const cbt = data.deepCrossValidation.cbtAnalysis;
    const q17 = data.survey.q17_relationship_rules;
    const q18 = data.survey.q18_core_belief_choice;

    // 중간 신념 데이터
    const rules = q17?.rules || '(미응답)';
    const posAssumption = q17?.positive_assumption || '(미응답)';
    const negAssumption = q17?.negative_assumption || '(미응답)';
    const beliefTheme = cbt?.intermediateBelief?.theme || '';
    const coreBelief = cbt?.coreBelief;

    return `[카드 5: "보이지 않는 규칙"]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
이 사람이 관계에서 무의식적으로 따르고 있는 "규칙"을 보여주는 것. q17에서 직접 쓴 3개 문장(규칙/긍정가정/부정가정)을 원문 인용하고, 이 규칙들이 관계에서 어떻게 작동하는지, 그리고 이 규칙들 아래에 깔린 더 깊은 마음(핵심 신념)을 연결하세요.

■ 제공 데이터

[★ q17 — 관계 규칙 원문 3개]
① 규칙: "연인이라면 당연히 ~해야 한다" → ${sct(rules)}
② 긍정 가정: "연인이 나를 진심으로 사랑한다면, ~할 것이다" → ${sct(posAssumption)}
③ 부정 가정: "내가 연인에게 약한 모습을 보이면, ~할 것이다" → ${sct(negAssumption)}

[관통 주제]
${beliefTheme || '(자동 분석 없음 — 3개 응답에서 직접 추론하세요)'}

[핵심 신념 (q18 선택)]
${coreBelief ? `"${coreBelief.selectedOption}" → ${coreBelief.label}` : q18 ? `선택: "${q18}"` : '(미선택)'}
${coreBelief && coreBelief.convergingEvidence.length > 0
  ? `수렴 증거:\n${coreBelief.convergingEvidence.map(e => `  • ${e}`).join('\n')}`
  : ''}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 도입: "보이지 않는 규칙"이라는 프레이밍.
   - "모든 사람에게는 관계에서 따르는 보이지 않는 규칙이 있어요. 누가 가르쳐준 것도 아닌데, 어느 순간부터 당연하게 여기는 것들."
   - 보편적 행동 패턴: "답장이 늦을 때 마음속에서 자동으로 작동하는 무언가"

2) ★ q17 규칙 원문 ① 인용 + 해석:
   - "${sct(rules)}" — 이 규칙을 원문 인용한 뒤,
   - "이 규칙이 충족되지 않을 때, 어떤 감정이 올라오나요?"
   - 실망, 분노, 슬픔 중 어떤 감정과 연결되는지 추론
   - 구체적 장면으로 이 규칙이 작동하는 상황 묘사

3) ★ q17 긍정 가정 ② 인용 + 해석:
   - "${sct(posAssumption)}" — 이 가정이 관계에서 어떻게 작동하는지
   - "사랑의 증거를 이렇게 확인하려는 마음"

4) ★ q17 부정 가정 ③ 인용 + 해석:
   - "${sct(negAssumption)}" — 약한 모습을 보여주는 것에 대한 두려움
   - 이 가정이 실제 관계에서 어떤 행동으로 나타나는지 구체적 장면
   - "이 두려움 때문에 당신은 아마..."

5) 핵심 신념과의 연결:
   - "이 규칙들 아래에 깔린 더 깊은 마음" → q18 선택을 자연스럽게 연결
   - 전문 용어 없이, "가장 깊은 곳에서는 이런 마음이 작동하고 있어요"
   - 핵심 신념을 "고쳐야 할 것"이 아니라 "알아차릴 수 있는 것"으로 프레이밍

6) 마무리: "규칙을 알아차리는 것만으로도 자유로워진다"
   - "규칙을 바꾸지 않아도 돼요. 규칙이 있다는 것을 알아차리는 것만으로도, 같은 상황에서 다르게 선택할 수 있는 여지가 생겨요."

■ 이 카드에서 하지 말 것
- "중간 신념", "핵심 신념", "하향 화살표" 등 전문 용어 사용 금지
- 카드 1-4의 비유(도미노, 브릿지) 반복 금지
- q17 응답을 판단하지 마세요 (모든 규칙에는 이유가 있다는 관점)

■ 분량: 1,800~2,800자`;
  },

  /**
   * 카드 6: "핵심 신념이 만드는 관계의 모양"
   * 반복되는 관계 패턴 + 핵심 신념이 관계에서 작동하는 방식
   * SCT: q6 갈등 패턴 + q7 거리 반응 + q8 반복 문제
   */
  card_06_relationship_impact: (data: Phase2CardDataExtended): string => {
    const tci = data.phase1.tci_scores;
    const dims = data.deepCrossValidation.dimensions;
    const eiDim = dims.find(d => d.dimension.includes('E/I'));
    const coDim = dims.find(d => d.dimension.includes('CO'));
    const sdDim = dims.find(d => d.dimension.includes('SD'));

    // 부착유형 추정 — q1(함께시간) + q2(불안) + HA 조합
    const q1 = data.survey.q1_together_time ?? 5;
    const q2 = data.survey.q2_anxiety_influence ?? 5;
    let attachmentHint = '';
    if (q1 >= 7 && q2 >= 6) attachmentHint = '불안형 부착 경향 (연결을 확인하고 싶은 마음)';
    else if (q1 <= 4 && tci.HA < 45) attachmentHint = '회피형 부착 경향 (독립성을 지키려는 보호 전략)';
    else if (q1 <= 4 && q2 >= 6) attachmentHint = '혼란형 부착 경향 (가까워지고 싶으면서 두려운 마음)';
    else attachmentHint = '안정형 부착 경향 (유연하게 조절할 수 있는 관계 능력)';

    // CBT 인지 왜곡의 관계 영향
    const cbt = data.deepCrossValidation.cbtAnalysis;
    const distortionImpacts = cbt && cbt.cognitiveDistortions.length > 0
      ? cbt.cognitiveDistortions.map(d => `• ${d.label}: ${d.relationshipImpact}`).join('\n')
      : '(특정 패턴 미발견)';

    // 핵심 신념 데이터
    const coreBelief = cbt?.coreBelief;
    const thoughtChain = cbt?.thoughtChain || '';

    return `[카드 6: "핵심 신념이 만드는 관계의 모양"]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
SCT 관계 패턴 응답(q6/q7/q8)을 핵심 소재로, 이 사람의 반복되는 관계 패턴과 부착 유형을 그려주는 것. 여기에 카드 5에서 발견한 핵심 신념이 관계에서 구체적으로 어떻게 작동하는지를 연결하세요.

■ 제공 데이터

[★ SCT — 관계 패턴 핵심 소재 3개]
• q6 "연인과 갈등이 생기면, 나는 보통..." → ${sct(data.survey.q6_conflict_pattern)}
• q7 "연인이 나에게서 멀어진다고 느낄 때, 나는..." → ${sct(data.survey.q7_partner_distance)}
• q8 "관계에서 반복되는 문제가 있다면, 그건..." → ${sct(data.survey.q8_recurring_issue)}

[스케일 데이터]
• 함께 보내는 시간 선호: ${q1}/10
• 불안의 영향: ${q2}/10

[부착 유형 추정]: ${attachmentHint}

[TCI 관계 축]
• 협동성(CO): ${tci.CO} — ${tci.CO > 60 ? '관계에서 조화를 중시' : '개인의 영역을 중시'}
• 자율성(SD): ${tci.SD} — ${tci.SD > 60 ? '관계에서도 주체적' : '상대에게 맞추려는 경향'}
• 연대감(RD): ${tci.RD} — ${tci.RD > 60 ? '친밀감에 대한 욕구가 큼' : '감정적 독립성이 강함'}

[인지 왜곡이 관계에 미치는 영향 — 일상 언어로 묘사]
${distortionImpacts}

[핵심 신념 — 관계 작동 방식]
${coreBelief
  ? `• 핵심 신념: "${coreBelief.selectedOption}" → ${coreBelief.label}
• 사고 체인: ${thoughtChain}
• 수렴 증거: ${coreBelief.convergingEvidence.length > 0 ? coreBelief.convergingEvidence.join(' / ') : '(수렴 증거 미발견)'}`
  : '(핵심 신념 미분석)'}

[교차검증 — 관계 관련]
${eiDim ? `• E/I: YouTube ${eiDim.youtube_value} vs 설문 ${eiDim.survey_value}` : ''}
${coDim ? `• CO: YouTube ${coDim.youtube_value} vs 설문 ${coDim.survey_value}` : ''}
${sdDim ? `• SD: YouTube ${sdDim.youtube_value} vs 설문 ${sdDim.survey_value}` : ''}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 도입: "관계 패턴"이라는 프레이밍.
   - 모든 사람에게는 반복되는 관계 패턴이 있어요
   - 그것은 실수가 아니라, 자기만의 패턴을 따라 움직이고 있는 거예요
   - 보편적 행동 패턴: "새로운 사람을 만났을 때 가장 먼저 확인하는 것", "관계에서 편안한 거리"

2) ★ SCT 원문을 반드시 활용하세요 — 이것이 이 카드의 핵심 소재입니다.
   - q6 응답을 갈등 대처 패턴의 근거로 직접 인용하세요
   - q7 응답을 부착 유형 해석의 단서로 사용하세요
   - q8 응답을 반복 패턴의 핵심 증거로 활용하세요
   - "당신이 직접 쓴 '${data.survey.q6_conflict_pattern?.slice(0, 20) || '...'}'라는 문장에서..."

3) 부착 유형을 자연스럽게 녹여 설명하세요 (용어 직접 사용은 피하고, 행동으로 묘사).
   - "${attachmentHint}"를 바탕으로
   - q6 + q7 + q8 응답이 만드는 패턴

4) ★ 핵심 신념이 관계에서 작동하는 방식 (NEW 섹션):
   - 카드 5에서 발견한 핵심 신념이 실제 관계에서 어떤 행동/패턴으로 나타나는지
   - 사고 체인을 관계 장면에 구체적으로 적용: "이런 상황이 오면 → 이런 생각이 자동으로 떠오르고 → 이런 행동을 하게 되는 패턴"
   - 전문 용어 없이, 일상적 장면으로 묘사

5) 관계에서 이 사람의 역할 (돌보는 쪽? 받는 쪽? 동등한 동반자?)
   - TCI CO/SD/RD 조합으로 추론
   - q8의 반복 문제와 연결

6) 가상 대화 예시:
   "연인이 '우리 좀 거리를 둘까?'라고 말했을 때, 당신의 첫 반응은..."

7) 패턴을 인식하는 것의 의미:
   - 반복은 나쁜 게 아니라, 아직 해결하지 못한 숙제가 있다는 신호
   - 알아차리는 것 자체가 변화의 시작

■ 이 카드에서 하지 말 것
- 카드 4의 "도미노" 비유를 그대로 반복하지 마세요 (연결만 가능)
- "부착 유형", "불안형", "회피형", "인지 왜곡" 등 심리학 용어 직접 사용 금지 (행동으로 묘사)
- 카드 3의 숨겨진 욕구 목록 반복 금지
- 카드 5의 규칙 내용을 그대로 반복하지 마세요 (핵심 신념의 관계 적용에만 집중)

■ 분량: 2,000~2,800자`;
  },

  /**
   * 카드 7: "가장 두려워하는 것"
   * q12 핵심 두려움 + coreBelief + thoughtChain + TCI 최하위 축
   */
  card_07_deepest_fear: (data: Phase2CardDataExtended): string => {
    const tci = data.phase1.tci_scores;
    const cbt = data.deepCrossValidation.cbtAnalysis;
    const coreBelief = cbt?.coreBelief;
    const thoughtChain = cbt?.thoughtChain || '';

    // TCI 최하위 축
    const tciEntries = Object.entries(tci) as [string, number][];
    const tciMin = tciEntries.sort(([, a], [, b]) => a - b)[0];
    const tciLabels: Record<string, string> = {
      NS: '자극추구 — 새로운 경험에 대한 개방성',
      HA: '위험회피 — 불확실성에 대한 내성',
      RD: '연대감 — 타인과의 감정적 연결',
      P: '인내력 — 장기적 노력의 지속',
      SD: '자율성 — 자기 주도적 판단과 행동',
      CO: '협동성 — 타인과의 조화와 배려',
      ST: '자기초월 — 삶의 의미와 영성',
    };

    return `[카드 7: "가장 두려워하는 것"]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
이 사람이 관계에서 가장 깊이 두려워하는 것을 직면시키되, 그 두려움이 어디서 왔는지(핵심 신념, 사고 체인)를 보여주고, 두려움이 관계에서 어떻게 작동하는지, 그리고 두려움 너머에 무엇이 있는지를 안내하는 것.

■ 제공 데이터

[★ SCT — 핵심 두려움 (q12)]
"결혼이나 깊은 관계를 생각할 때 가장 두려운 것은..." → ${sct(data.survey.q12_deepest_fear)}

[핵심 신념]
${coreBelief
  ? `• 선택: "${coreBelief.selectedOption}" → ${coreBelief.label}
• 수렴 증거: ${coreBelief.convergingEvidence.length > 0 ? coreBelief.convergingEvidence.join(' / ') : '(수렴 증거 미발견)'}`
  : '(핵심 신념 미분석)'}

[사고 체인 — 자동사고→중간신념→핵심신념]
${thoughtChain || '(체인 미생성)'}

[TCI 최하위 축]
${tciMin[0]}: ${tciMin[1]}점 — ${tciLabels[tciMin[0]] || tciMin[0]}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 섹션 "가장 두려운 것":
   - ★ q12 원문을 직접 인용하며 시작
   - "당신이 쓴 ${sct(data.survey.q12_deepest_fear?.slice(0, 30))}... 이 문장을 읽었을 때, 당신이 관계를 얼마나 진지하게 생각하는지 느껴졌어요."
   - 이 두려움이 구체적으로 어떤 상황에서 올라오는지 (보편적 행동 패턴으로)
   - 두려움 자체가 나쁜 게 아니라, 관계를 소중히 여기는 마음의 반증

2) 섹션 "두려움의 뿌리":
   - 핵심 신념과 사고 체인을 서사적으로 풀어주세요
   - 전문 용어 없이: "가장 깊은 곳에서는 이런 마음이 작동하고 있어요"
   - 사고 체인을 자연스러운 이야기로: "어떤 상황이 오면 → 이런 생각이 자동으로 떠오르고 → 이 생각 아래에는..."
   - TCI 최하위 축 ${tciMin[0]}(${tciMin[1]}점)과 연결: 이 축이 낮다는 것이 두려움과 어떻게 연결되는지

3) 섹션 "두려움이 관계에서 작동하는 방식":
   - 이 두려움 때문에 관계에서 나타나는 구체적 행동 패턴
   - "두려움이 당신을 보호하려고 만든 전략" — 회피, 과잉 확인, 선제 포기 등
   - 가상 대화 예시 1개: 두려움이 작동하는 관계 장면

4) 섹션 "두려움 너머":
   - 이 두려움을 없애는 것이 목표가 아니라, 두려움과 함께 걸어가는 것
   - "두려움을 느끼면서도 한 발 더 다가가는 것 — 그것이 용기예요"
   - 두려움이 가리키는 진짜 욕구 (두려움의 반대편에 있는 것)
   - 희망적이되 가벼운 위로가 아닌, 데이터에 근거한 통찰

■ 이 카드에서 하지 말 것
- 카드 1-6의 비유/키워드 반복 금지
- "핵심 신념", "자동적 사고", "인지 왜곡" 등 전문 용어 사용 금지
- "당신은 이미 충분히 잘하고 있어요" 같은 맥락 없는 위로 금지
- 두려움을 극복해야 할 "문제"로 프레이밍하지 마세요

■ 분량: 1,800~2,800자`;
  },

  /**
   * 카드 8: "누구와도 잘 살기 위해 넘어야 할 문턱"
   * 성장 방향 + 실천 행동 3가지 (관계/솔로/마음습관)
   * SCT: q13 바꾸고 싶은 것 + Enneagram 성장 방향
   */
  card_08_growth: (data: Phase2CardDataExtended): string => {
    const dims = data.deepCrossValidation.dimensions;
    const tci = data.phase1.tci_scores;

    // 가장 큰 불일치 차원
    const sortedByDiff = [...dims].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    const biggestGap = sortedByDiff[0];

    // TCI 최하위 축
    const tciEntries = Object.entries(tci) as [string, number][];
    const tciMin = tciEntries.sort(([, a], [, b]) => a - b)[0];
    const tciLabels: Record<string, string> = {
      NS: '자극추구 — 새로운 경험에 대한 개방성',
      HA: '위험회피 — 불확실성에 대한 내성',
      RD: '연대감 — 타인과의 감정적 연결',
      P: '인내력 — 장기적 노력의 지속',
      SD: '자율성 — 자기 주도적 판단과 행동',
      CO: '협동성 — 타인과의 조화와 배려',
      ST: '자기초월 — 삶의 의미와 영성',
    };

    // 에니어그램 성장 방향
    const growthDirections: Record<number, string> = {
      1: '불완전함을 수용하는 것이 진짜 완성이에요',
      2: '자기 자신에게 먼저 사랑을 주는 연습이 필요해요',
      3: '성과가 아닌 존재 자체로 가치 있다는 것을 아는 것',
      4: '특별하지 않아도 괜찮다는 편안함을 찾는 것',
      5: '머리에서 나와 몸과 마음으로 세상을 경험하는 것',
      6: '불안을 없애려 하지 말고, 불안과 함께 걸어가는 것',
      7: '머무르는 것, 깊어지는 것의 즐거움을 발견하는 것',
      8: '약한 모습을 보여주는 것이 진짜 강함이에요',
      9: '자기 목소리를 내는 것이 평화를 깨는 게 아니에요',
    };
    const growthDir = data.phase1.enneagram_type
      ? growthDirections[data.phase1.enneagram_type] || ''
      : '';

    // CBT 데이터
    const cbt = data.deepCrossValidation.cbtAnalysis;
    const q17 = data.survey.q17_relationship_rules;
    const q10 = data.survey.q10_body_signal;
    const q16 = data.survey.q16_hot_scenario;

    return `[카드 8: "누구와도 잘 살기 위해 넘어야 할 문턱"]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
앞선 카드들에서 발견한 인사이트를 종합하여, 이 사람이 성장하기 위해 넘어야 할 문턱을 보여주고, 구체적인 실천 행동 3가지(관계 속 실천, 혼자 할 수 있는 실천, 마음 습관 변화)를 제안하는 것. q13(바꾸고 싶은 것)과 에니어그램 성장 방향을 핵심 소재로 활용하세요.

■ 제공 데이터

[★ SCT — 바꾸고 싶은 것 (q13)]
"관계에서 내가 바꾸고 싶지만 잘 안 되는 것은..." → ${sct(data.survey.q13_want_to_change)}

[에니어그램 성장 방향]
${growthDir || '자기만의 리듬으로 성장하는 것'}

[가장 큰 불일치 차원]
${biggestGap.dimension}: YouTube ${biggestGap.youtube_value} vs 설문 ${biggestGap.survey_value} (차이: ${biggestGap.diff > 0 ? '+' : ''}${biggestGap.diff})
해석: ${biggestGap.interpretation}

[TCI 최하위 축]
${tciMin[0]}: ${tciMin[1]}점 — ${tciLabels[tciMin[0]] || tciMin[0]}

[Hot Thought (q16)]
${sct(q16)}

[신체 반응 (q10)]
${sct(q10)}

[관계 규칙 (q17)]
${q17 ? `① 규칙: ${sct(q17.rules)}` : '(미응답)'}

${cbt ? `[인지 왜곡 패턴]\n${cbt.cognitiveDistortions.map(d => `• ${d.label}`).join(', ') || '(없음)'}` : ''}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 섹션 "바꾸고 싶은 것":
   - ★ q13 원문을 직접 인용하며 시작
   - "당신이 바꾸고 싶다고 말한 ${sct(data.survey.q13_want_to_change?.slice(0, 30))}... 이것을 알고 있다는 것 자체가 이미 반은 넘은 거예요."
   - 에니어그램 성장 방향을 자연스럽게 녹이세요: "${growthDir}"
   - 가장 큰 불일치 차원 ${biggestGap.dimension}을 "아직 통합하지 못한 양면성"으로 해석
   - TCI 최하위 축 ${tciMin[0]}(${tciMin[1]}점)과 연결: 이 축이 낮다는 것 = 성장 가능성이 큰 영역

2) 섹션 "성장의 3가지 포인트":
   - 성장은 계단이 아니라 문턱이에요. 한 걸음만 넘으면 되는데, 그 한 걸음이 가장 어려운 거죠.
   - **구체적 실천 행동 3개** (오늘부터 할 수 있는 것):

   **포인트 1: 관계 속 실천** (relationship practice)
   - 이 사람의 관계 패턴(카드 6)에 맞춤화된 실천
   - 연인/파트너와 함께 할 수 있는 구체적 행동 1개
   - 관계 장면 예시 포함

   **포인트 2: 혼자 할 수 있는 실천** (solo practice)
   - ${q10 ? `"${q10}" — 이 신체 신호가 올 때` : '불안할 때'} 3초 멈추기 + 심호흡 등
   - 또는 마음 일기장 3줄: ① 마음이 흔들린 상황 ② 떠오른 생각 (예: ${q16 ? `"${q16.slice(0, 30)}..."처럼` : '"혹시 내 탓인가?"처럼'}) ③ 다른 가능성
   - 혼자서도 자기 이해를 깊게 할 수 있는 구체적 도구

   **포인트 3: 마음 습관 변화** (mind habit)
   - ${q17?.rules ? `"${q17.rules}" → 이 규칙을` : '"~해야 한다"는 규칙을'} 부드럽게 바꿔 말하는 연습
   - "~해야 한다" → "~하면 좋겠지만, 아니라고 해서 관계가 끝나는 건 아니야"
   - 이 사람의 데이터에 맞춤화된 대안적 사고 예시 1개

3) 섹션 "성장 후의 당신":
   - 이 3가지를 실천했을 때 달라지는 모습을 구체적으로 그려주세요
   - 관계에서의 변화 + 자기 자신과의 관계 변화
   - 희망적이되 가벼운 위로가 아닌, 데이터에 근거한 미래상

■ 전체 톤
- "이건 숙제가 아니에요. 해보고 싶을 때, 생각날 때만 하면 돼요."
- 모든 실천을 "자기 이해"와 "관계 개선"이라는 맥락에서 소개

■ 이 카드에서 하지 말 것
- 카드 1-7의 비유/내용 반복 금지
- "당신은 이미 충분히 잘하고 있어요" 같은 맥락 없는 위로 금지
- 에니어그램 번호 직접 언급 금지
- "인지행동치료", "CBT", "사고 기록지", "인지 왜곡", "핵심 신념" 등 전문 용어 사용 금지
- 치료나 상담을 대체한다는 인상 주지 마세요
- 너무 많은 도구를 나열하지 마세요 (딱 3개만)

■ 분량: 2,000~3,000자`;
  },

  /**
   * 카드 9: "당신에게 맞는 사람, 다시 한번"
   * Phase 1 매칭을 설문으로 교차검증한 심층판
   * SCT: q14 이상적인 하루 원문 인용
   */
  card_09_deep_match: (data: Phase2CardDataExtended): string => {
    const husband = data.husbandType;
    const matchScore = Math.round(data.phase1.match_score * 100);
    const desires = data.deepCrossValidation.hiddenDesires;
    const intimacyDesires = desires.filter(d =>
      d.label.includes('친밀') || d.label.includes('연결') || d.label.includes('안전') || d.label.includes('신뢰')
    );

    return `[카드 9: "당신에게 맞는 사람, 다시 한번"]

${getWritingToneDirective('balanced')}

■ 이 카드의 목적
Phase 1에서 매칭된 남편상을 설문 데이터(특히 q14 이상적인 하루)와 교차검증하여, "왜 이 타입이 진짜 맞는지" 또는 "설문을 반영하면 어떤 미세 조정이 필요한지"를 보여주는 것.

■ 제공 데이터

[Phase 1 매칭 결과]
• 타입: ${husband.name}
• 카테고리: ${husband.category}
• 설명: ${husband.description}
• 비유: ${husband.metaphor || '없음'}
• 매칭 점수: ${matchScore}%

[★ SCT — 이상적인 하루 (q14)]
"내가 꿈꾸는 파트너와의 가장 이상적인 하루는..." → ${sct(data.survey.q14_ideal_day)}

[숨겨진 욕구 중 친밀감 관련]
${intimacyDesires.length > 0
  ? intimacyDesires.map(d => `• ${d.label}: ${d.description}`).join('\n')
  : '• 명시적인 친밀감 욕구보다 다른 영역의 욕구가 더 두드러져요'}

■ 작성 지침

## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요. 요약은 "~하는 사람"이 아니라 비유/상징으로 쓰세요.
## ⚠️ 틀릴 수 있는 구체적 상황(시간대, 장소, 직업)을 특정하지 마세요. 보편적 행동 패턴 + 인사이트를 사용하세요.

1) 도입: Phase 1에서 데이터로 매칭한 결과와, 직접 쓴 이상적인 하루를 비교하는 것이 이 카드의 핵심.
   - "YouTube 데이터가 말하는 당신의 이상형은 '${husband.name}'이에요. 그런데 당신이 직접 꿈꾸는 하루는..."
   - q14 원문 인용

2) ★ q14 "이상적인 하루"를 매칭 타입과 대조하세요.
   - 이 타입의 파트너와 함께라면, q14에서 묘사한 하루가 어떻게 실현되는지
   - "당신이 꿈꾸는 '${data.survey.q14_ideal_day?.slice(0, 30) || '...'}'라는 하루... ${husband.name} 타입과 함께라면..."

3) 일치하는 부분:
   - q14에서 묘사한 하루 중 ${husband.name} 타입의 특성과 겹치는 부분
   - "데이터가 틀리지 않았어요. 당신의 무의식과 의식이 같은 곳을 가리키고 있어요."

4) 미묘하게 다른 부분:
   - q14에서 원하지만 매칭 타입에 없는 특성
   - 또는 매칭 타입의 특성 중 q14에서 언급하지 않은 것
   - "이 차이가 의미하는 건..."

5) 숨겨진 욕구와 연결:
   - 이 타입이 당신의 숨겨진 욕구를 어떻게 채워줄 수 있는지
   - 행동 패턴 + 인사이트: "이 사람이 옆에 있으면, ${desires[0]?.label || '당신의 욕구'}가 자연스럽게 채워지는 패턴이 생겨요..."

6) 가상 대화 예시:
   이 타입의 파트너와 나누는 일상적 대화 한 장면

■ 이 카드에서 하지 말 것
- Phase 1 카드 9(남편 타입 소개)를 그대로 반복하지 마세요
- "${husband.name}"의 장점만 나열하지 마세요. 교차검증의 관점으로 써야 해요
- 매칭 점수 ${matchScore}%를 과대 포장하지 마세요

■ 분량: 2,000~2,800자`;
  },

  /**
   * 카드 10: "당신에게 보내는 편지"
   * 편지 형식, 이 사람만을 위한 마무리
   * SCT: q12 핵심 두려움 + q15 핵심 욕구 + Hot Thought/핵심신념 자연스럽게 언급
   */
  card_10_letter: (data: Phase2CardDataExtended): string => {
    const name = userName(data);
    const layers = data.deepCrossValidation.personalityLayers;
    const desires = data.deepCrossValidation.hiddenDesires;
    const authScore = Math.round(data.deepCrossValidation.authenticityScore * 100);

    // 핵심 키워드 3개 추출
    const keywords: string[] = [];
    if (desires.length > 0) keywords.push(desires[0].label);
    if (desires.length > 1) keywords.push(desires[1].label);
    const dims = data.deepCrossValidation.dimensions;
    const bigGap = dims.reduce((max, d) => Math.abs(d.diff) > Math.abs(max.diff) ? d : max, dims[0]);
    if (bigGap) keywords.push(bigGap.dimension.split(' ')[0]);

    // CBT 키워드
    const cbt = data.deepCrossValidation.cbtAnalysis;
    const hotThought = data.survey.q16_hot_scenario;
    const coreBeliefLabel = cbt?.coreBelief?.label || '';

    return `[카드 10: "당신에게 보내는 편지"]

${getWritingToneDirective('literary')}

■ 이 카드의 목적
10장의 분석을 마무리하는 편지. 이 사람의 데이터에서만 나올 수 있는 구체적인 메시지로, "누군가 나를 이렇게까지 읽어준 적이 있었나"라는 감동을 남기는 것. Hot Thought와 핵심 신념을 자연스럽게 언급하세요.

■ 제공 데이터

[사용자 이름]: ${name}

[이 사람의 핵심 키워드 3개]
${keywords.join(', ')}

[3층 구조 요약]
• 겉: ${layers.surface.slice(0, 100)}
• 속: ${layers.conscious.slice(0, 100)}
• 깊은 곳: ${layers.unconscious.slice(0, 100)}

[자기 일치도]: ${authScore}%

[Hot Thought (q16)]
${sct(hotThought)}

[핵심 신념]
${coreBeliefLabel || '(미분석)'}

[★ SCT — 핵심 두려움 (q12)]
"결혼이나 깊은 관계를 생각할 때 가장 두려운 것은..." → ${sct(data.survey.q12_deepest_fear)}

[★ SCT — 핵심 욕구 (q15)]
"내가 진짜 원하는 관계는 한마디로..." → ${sct(data.survey.q15_core_desire)}

[숨겨진 욕구 중 가장 중요한 것]
${desires[0] ? `"${desires[0].label}": ${desires[0].description}` : '발견된 욕구를 종합적으로 다루세요'}

■ 작성 지침 — 편지 형식

1) "Dear ${name}," 또는 "${name}에게," 로 시작하세요.

2) 첫 문단: 이 사람의 데이터를 읽으면서 느낀 가장 인상적인 점 1가지.
   - "당신의 데이터를 처음부터 끝까지 읽으면서, 제가 계속 돌아오게 된 지점이 있어요."
   - 9장의 카드에서 말하지 못한 가장 핵심적인 한마디

3) 중간 문단: ★ q12의 핵심 두려움을 다뤄주세요.
   - ${sct(data.survey.q12_deepest_fear?.slice(0, 50))}를 직접 인용하고
   - "이 두려움은 당신이 관계를 가볍게 생각하지 않는다는 증거예요"
   - 이 두려움이 만들어내는 행동 패턴 + 왜 그런지 인사이트 (구체적 시간/장소 특정 금지)

4) ★ q15 핵심 욕구를 연결하세요.
   - "그리고 당신이 진짜 원하는 것은 ${sct(data.survey.q15_core_desire?.slice(0, 30))}... 이거잖아요."
   - 두려움과 욕구가 사실은 같은 뿌리에서 나왔다는 통찰

5) Hot Thought와 핵심 신념을 자연스럽게 언급하세요.
   - ${hotThought ? `"${hotThought.slice(0, 30)}" — 이 생각이 떠올랐던 순간` : '(응답 없음 시 생략)'}
   - ${coreBeliefLabel ? `가장 깊은 곳에 있던 "${coreBeliefLabel}"이라는 마음` : ''}
   - "하지만 이제 당신은 그 마음을 알아차렸어요"

6) 핵심 키워드 ${keywords.join(', ')}를 자연스럽게 엮어 주세요.
   - 이 키워드들이 하나의 이야기로 연결되는 순간

7) 마무리: 응원의 메시지.
   - "당신이 원하는 관계는 가능해요"
   - 하지만 빈 위로가 아니라, 이 사람의 데이터에서 근거를 찾아 써주세요
   - "자기 일치도 ${authScore}%라는 건, 당신이 이미 자신을 알아가는 여정 위에 있다는 뜻이에요"

8) 서명: "당신의 데이터를 읽은 사람으로부터"

■ 이 카드에서 하지 말 것
- 10장 카드의 내용을 요약 정리하지 마세요 (편지는 요약이 아님)
- "앞으로의 여정을 응원합니다" 같은 천편일률적 마무리 금지
- "Phase 1", "Phase 2", "교차검증" 같은 분석 용어 사용 금지
- 이 편지에서만큼은 볼드(**)를 최소화하세요. 편지의 톤을 유지하세요.

■ 분량: 1,800~2,500자`;
  },
};
