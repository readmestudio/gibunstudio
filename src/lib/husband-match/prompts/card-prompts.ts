/**
 * Phase 1 리포트 카드 10장 생성 프롬프트
 * 각 카드별로 분석 데이터를 받아 OpenAI에 보낼 프롬프트 문자열을 반환합니다.
 */

import {
  TCIScores,
  EnneagramCenter,
  MBTIScores,
  ChannelCategories,
  HusbandType,
} from '../types';

export interface Phase1CardData {
  channelCount: number;
  channel_categories: ChannelCategories;
  tci_scores: TCIScores;
  enneagram_center: EnneagramCenter;
  enneagram_type: number | null;
  mbti_scores: MBTIScores;
  mbti_type: string | null;
  matched_husband: HusbandType;
  match_score: number;
  metaphor?: string;
}

const ENNEAGRAM_NAMES: Record<number, string> = {
  1: '완벽주의자',
  2: '조력자',
  3: '성취자',
  4: '개인주의자',
  5: '탐구자',
  6: '충성주의자',
  7: '열정가',
  8: '도전자',
  9: '조정자',
};

function formatCategories(categories: ChannelCategories): string {
  const entries = Object.entries(categories)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}: ${v}개`)
    .join(', ');
  return entries || '없음';
}

export const PHASE1_CARD_PROMPTS = {
  card_01_intro: (data: Phase1CardData): string => {
    return `YouTube 구독 채널 ${data.channelCount}개를 분석했습니다. 

이 데이터를 바탕으로 10장의 카드로 당신의 성격, 가치관, 관계 스타일, 그리고 당신과 잘 맞는 남편상을 소개합니다.

2~3문단의 환영 메시지를 작성해주세요. 따뜻하고 기대감을 주는 톤으로, "당신의 YouTube가 당신을 말해줍니다" 같은 메시지를 담아주세요.`;
  },

  card_02_personality: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    return `TCI(기질·성격검사) 7차원 점수:
- 새로움 추구(NS): ${t.NS}
- 위험 회피(HA): ${t.HA}
- 보상 의존(RD): ${t.RD}
- 인내력(P): ${t.P}
- 자율성(SD): ${t.SD}
- 협력성(CO): ${t.CO}
- 자기초월(ST): ${t.ST}

위 점수를 바탕으로 2~3문단으로 당신의 성격 프로필을 설명해주세요. 
높은 차원과 낮은 차원의 조합이 어떤 성격 특성을 만드는지, 일상과 관계에서 어떻게 드러날 수 있는지 따뜻하고 공감적으로 서술해주세요.`;
  },

  card_03_enneagram: (data: Phase1CardData): string => {
    const type = data.enneagram_type ?? 9;
    const name = ENNEAGRAM_NAMES[type];
    const c = data.enneagram_center;
    return `애니어그램 추정 결과:
- 유형: ${type}번 (${name})
- 3대 중심 점수: Head ${c.head}, Heart ${c.heart}, Body ${c.body}

${name} 유형의 특성을 바탕으로 2~3문단으로 당신의 내면 동기, 관계에서의 패턴, 강점을 설명해주세요.
결혼이나 연애 관점에서 어떤 파트너와 잘 맞을 수 있는지도 포함해주세요. 따뜻하고 격려하는 톤을 유지해주세요.`;
  },

  card_04_mbti: (data: Phase1CardData): string => {
    const type = data.mbti_type ?? 'INFP';
    const s = data.mbti_scores;
    return `MBTI 추정 결과: ${type}
4축 점수: E/I ${s.E}/${s.I}, S/N ${s.S}/${s.N}, T/F ${s.T}/${s.F}, J/P ${s.J}/${s.P}

${type} 유형의 특성을 반영해 2~3문단으로 당신의 사고방식, 의사결정 스타일, 관계에서의 소통 방식을 설명해주세요.
연애·결혼에서 어떤 점이 강점이 될 수 있는지, 어떤 파트너와 조화로울 수 있는지 공감적으로 서술해주세요.`;
  },

  card_05_content: (data: Phase1CardData): string => {
    const cat = formatCategories(data.channel_categories);
    return `YouTube 구독 채널 카테고리 분포: ${cat}

이 콘텐츠 취향이 당신의 관심사, 가치관, 스트레스 해소 방식과 어떻게 연결되는지 2~3문단으로 설명해주세요.
"당신이 즐겨 보는 콘텐츠는 ~한 당신을 보여줍니다"처럼 따뜻하고 통찰 있는 톤으로 작성해주세요.`;
  },

  card_06_values: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    const type = data.mbti_type ?? 'INFP';
    return `TCI 협력성(CO)=${t.CO}, 자기초월(ST)=${t.ST}, 인내력(P)=${t.P}, MBTI=${type} 등이 반영된 가치관을 추론해주세요.

2~3문단으로 당신이 삶과 관계에서 중요하게 여길 만한 가치(예: 성장, 안정, 자유, 소통, 신뢰 등)를 설명해주세요.
결혼이나 연애에서 어떤 가치가 맞을 때 행복할 수 있는지 공감적으로 서술해주세요.`;
  },

  card_07_relationship: (data: Phase1CardData): string => {
    const type = data.mbti_type ?? 'INFP';
    const ennea = data.enneagram_type ?? 9;
    return `MBTI ${type}, 애니어그램 ${ennea}번, TCI 점수들이 관계 스타일에 미치는 영향을 종합해주세요.

2~3문단으로 당신의 연애·관계 스타일(애정 표현 방식, 갈등 대처, 친밀함 선호도 등)을 설명해주세요.
어떤 파트너와 함께할 때 서로 편하고 성장할 수 있을지 따뜻하게 제안해주세요.`;
  },

  card_08_match_result: (data: Phase1CardData): string => {
    const h = data.matched_husband;
    const scorePercent = Math.round(data.match_score * 100);
    const metaphor = data.metaphor ?? (h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i) ?? h.description;
    return `매칭된 남편상: ${h.name} (${h.category} - ${h.subcategory})
매칭 점수: ${scorePercent}%
비유: ${metaphor}

설명: ${h.description}

위 결과를 바탕으로 2~3문단으로 "당신과 잘 맞는 남편상"을 소개해주세요.
왜 이 유형이 당신과 조화로울 수 있는지, 어떤 관계가 펼쳐질 수 있는지 따뜻하고 희망적으로 서술해주세요.`;
  },

  card_09_metaphor: (data: Phase1CardData): string => {
    const h = data.matched_husband;
    const metaphor = data.metaphor ?? (h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i) ?? h.description;
    return `매칭된 남편상: ${h.name}
비유: ${metaphor}

이 비유를 확장해 2~3문단으로 인사이트를 작성해주세요.
"당신과 파트너가 함께할 때 ~한 그림이 연상됩니다"처럼 관계의 이미지를 그려주고, 따뜻하고 영감을 주는 톤으로 마무리해주세요.`;
  },

  card_10_cta: (data: Phase1CardData): string => {
    return `Phase 1 분석이 완료되었습니다. 사용자에게 Phase 2(9문항 서베이 + 심층 분석)를 안내하는 카드를 작성해주세요.

2~3문단으로:
1) 지금까지의 분석이 YouTube 기반이라는 점을 짧게 언급하고,
2) 설문에 답하면 YouTube 데이터와 교차검증하여 더 깊은 인사이트를 얻을 수 있다고 안내하며,
3) Phase 2 참여를 부드럽게 권유해주세요. 따뜻하고 선택을 존중하는 톤으로 작성해주세요.`;
  },
};
