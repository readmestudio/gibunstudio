/**
 * Phase 2 심층 리포트 카드 8장 생성 프롬프트
 * Phase 1 데이터 + 서베이 응답을 결합한 교차검증 인사이트 포함
 */

export interface Phase2CardData {
  phase1_summary: {
    mbti_type: string | null;
    enneagram_type: number | null;
    matched_husband_name: string;
    match_score: number;
  };
  survey_responses: Record<string, unknown>;
  cross_validation: {
    discrepancies: Array<{
      dimension: string;
      youtube_value: number;
      survey_value: number;
      interpretation: string;
    }>;
    hidden_desires: string[];
    authenticity_score: number;
  };
  final_match?: {
    name: string;
    description: string;
    metaphor?: string;
  };
}

export const PHASE2_CARD_PROMPTS = {
  card_01_cross_validation: (data: Phase2CardData): string => {
    const d = data.cross_validation.discrepancies;
    const list = d.length
      ? d.map((x) => `- ${x.dimension}: YouTube ${x.youtube_value} vs 설문 ${x.survey_value} → ${x.interpretation}`).join('\n')
      : '뚜렷한 차이는 없습니다.';
    return `Phase 1(YouTube)과 Phase 2(설문) 교차검증 결과:
${list}

위 결과를 바탕으로 2~3문단으로 "YouTube에서 보인 당신"과 "설문에서 드러난 당신"을 비교하는 서론을 작성해주세요.
두 데이터가 만나 더 풍부한 그림이 된다는 점을 따뜻하게 전달해주세요.`;
  },

  card_02_hidden_desires: (data: Phase2CardData): string => {
    const desires = data.cross_validation.hidden_desires;
    const list = desires.length ? desires.map((d) => `- ${d}`).join('\n') : '분석 중 발견된 숨겨진 욕구가 없습니다.';
    return `교차검증에서 추론된 숨겨진 욕구:
${list}

2~3문단으로 이 욕구들이 관계와 결혼에서 어떤 의미를 가질 수 있는지, 어떻게 인정하고 소통하면 좋을지 공감적으로 설명해주세요.`;
  },

  card_03_real_vs_ideal: (data: Phase2CardData): string => {
    const d = data.cross_validation.discrepancies;
    const list = d.length
      ? d.map((x) => `${x.dimension}: YouTube ${x.youtube_value} vs 설문 ${x.survey_value} — ${x.interpretation}`).join('\n')
      : 'YouTube와 설문 응답이 대체로 일치합니다.';
    return `YouTube(실제 구독) vs 설문(자기 인식) 차이:
${list}

2~3문단으로 "진짜 나"와 "이상적인 나" 사이의 간격을 어떻게 이해하고, 관계에서 어떻게 건강하게 풀어갈 수 있는지 따뜻하게 조언해주세요.`;
  },

  card_04_deep_values: (data: Phase2CardData): string => {
    const survey = JSON.stringify(data.survey_responses, null, 2);
    return `Phase 2 설문 응답 (일부):
${survey.slice(0, 800)}...

이 응답과 Phase 1 분석을 종합해 2~3문단으로 당신의 심층 가치관을 설명해주세요.
결혼·연애에서 가장 중요한 가치 2~3가지를 구체적으로 짚고, 그 가치가 충족될 때의 관계를 따뜻하게 그려주세요.`;
  },

  card_05_patterns: (data: Phase2CardData): string => {
    const desires = data.cross_validation.hidden_desires;
    const auth = Math.round(data.cross_validation.authenticity_score * 100);
    return `숨겨진 욕구: ${desires.join(', ') || '분석됨'}
자기 일치도(authenticity_score): ${auth}%

YouTube와 설문 데이터를 바탕으로 2~3문단으로 당신의 관계 패턴(반복되는 선택, 갈등 스타일, 친밀감 추구 방식 등)을 설명해주세요.
패턴을 비난하지 않고, 이해와 성장의 관점으로 서술해주세요.`;
  },

  card_06_growth: (data: Phase2CardData): string => {
    const d = data.cross_validation.discrepancies;
    const summary = data.phase1_summary;
    return `Phase 1 요약: MBTI ${summary.mbti_type}, 애니어그램 ${summary.enneagram_type}번, 매칭 ${summary.matched_husband_name} (${Math.round(summary.match_score * 100)}%)
교차검증 차이: ${d.length}개 차원

위를 바탕으로 2~3문단으로 관계에서의 성장 포인트를 제안해주세요.
"이런 부분을 인정하고 소통하면 더 풍요로운 관계가 될 수 있어요"처럼 구체적이고 따뜻한 톤으로 작성해주세요.`;
  },

  card_07_final_match: (data: Phase2CardData): string => {
    const m = data.final_match ?? {
      name: data.phase1_summary.matched_husband_name,
      description: 'Phase 1과 설문을 종합한 최종 남편상입니다.',
      metaphor: '당신과 함께 성장할 파트너',
    };
    return `최종 남편상: ${m.name}
설명: ${m.description}
비유: ${m.metaphor ?? '해당 없음'}

Phase 1 + Phase 2 교차검증을 반영한 "최종 남편상"을 2~3문단으로 소개해주세요.
왜 이 유형이 지금의 당신과 잘 맞는지, 어떤 관계를 꿈꿀 수 있는지 희망적으로 마무리해주세요.`;
  },

  card_08_action_plan: (data: Phase2CardData): string => {
    return `Phase 1·Phase 2 분석이 모두 완료되었습니다.

2~3문단으로 "다음 단계 액션 플랜"을 작성해주세요.
- 자신의 패턴과 욕구를 어떻게 관계에 활용할지
- 만날 파트너를 고를 때 참고할 점 1~2가지
- 자기 돌봄과 성장을 위한 작은 실천 1가지

따뜻하고 구체적이며, 부담 없이 실천 가능한 톤으로 마무리해주세요.`;
  },
};
