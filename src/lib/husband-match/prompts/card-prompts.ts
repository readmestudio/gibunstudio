/**
 * Phase 1 리포트 카드 9장 생성 프롬프트
 * 2026-02-06 개선: 카드 통합, 분량 증가, 근거 제시, 마케팅 카피
 */

import {
  TCIScores,
  EnneagramCenter,
  MBTIScores,
  ChannelCategories,
  HusbandType,
} from '../types';
import { CATEGORY_NAMES, CategoryId } from '../data/categories';

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
  userName?: string;
}

export const ENNEAGRAM_NAMES: Record<number, string> = {
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

// TCI 척도 한글명
export const TCI_NAMES: Record<keyof TCIScores, string> = {
  NS: '자극추구',
  HA: '위험회피',
  RD: '사회적민감성',
  P: '인내력',
  SD: '자율성',
  CO: '연대감',
  ST: '자기초월',
};

// TCI 척도별 특성 설명 (MBTI/에니어그램 번호 없이 특징만)
export const TCI_CHARACTERISTICS: Record<keyof TCIScores, { high: string; low: string }> = {
  NS: {
    high: '새로운 경험과 자극을 적극적으로 추구하며, 호기심이 많고 변화를 즐기는',
    low: '안정적이고 익숙한 것을 선호하며, 신중하고 깊이 있는 경험을 중시하는',
  },
  HA: {
    high: '신중하고 조심스러우며, 안전을 우선시하고 계획적으로 행동하는',
    low: '도전을 두려워하지 않고, 낙관적이며 위험을 감수할 줄 아는',
  },
  RD: {
    high: '타인의 감정에 민감하고, 따뜻한 관계를 중요시하며 공감 능력이 뛰어난',
    low: '독립적이고 자기 주관이 뚜렷하며, 타인의 시선에 덜 영향받는',
  },
  P: {
    high: '끈기 있고 목표를 향해 꾸준히 나아가며, 어려움에도 포기하지 않는',
    low: '유연하고 상황에 따라 방향을 바꿀 줄 알며, 다양한 시도를 즐기는',
  },
  SD: {
    high: '자기 주도적이고 독립적이며, 스스로 결정하고 책임지는 것을 중요시하는',
    low: '협력을 중시하고, 타인과 함께 결정을 내리는 것을 편안하게 여기는',
  },
  CO: {
    high: '타인과의 연결을 중요시하고, 공동체 의식이 강하며 배려심이 깊은',
    low: '개인의 영역을 중요시하고, 독립적인 시간과 공간을 필요로 하는',
  },
  ST: {
    high: '삶의 의미와 깊이를 추구하며, 영적이거나 철학적인 사고를 즐기는',
    low: '현실적이고 실용적이며, 구체적인 결과와 성취를 중요시하는',
  },
};

// 카테고리 분포를 정렬된 배열로 반환
export function getSortedCategories(categories: ChannelCategories): Array<{ id: CategoryId; name: string; count: number; percent: number }> {
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
  return (Object.entries(categories) as [CategoryId, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([id, count]) => ({
      id,
      name: CATEGORY_NAMES[id],
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

// TCI 상위 척도 반환
export function getTopTCIScores(tci: TCIScores, count: number = 3): Array<{ key: keyof TCIScores; name: string; score: number }> {
  return (Object.entries(tci) as [keyof TCIScores, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([key, score]) => ({
      key,
      name: TCI_NAMES[key],
      score,
    }));
}

// TCI 하위 척도 반환
export function getBottomTCIScores(tci: TCIScores, count: number = 2): Array<{ key: keyof TCIScores; name: string; score: number }> {
  return (Object.entries(tci) as [keyof TCIScores, number][])
    .sort(([, a], [, b]) => a - b)
    .slice(0, count)
    .map(([key, score]) => ({
      key,
      name: TCI_NAMES[key],
      score,
    }));
}

// TCI 특성 문장 생성 (점수 기반)
export function getTCICharacteristics(tci: TCIScores): string[] {
  const characteristics: string[] = [];
  const entries = Object.entries(tci) as [keyof TCIScores, number][];

  for (const [key, score] of entries) {
    if (score >= 65) {
      characteristics.push(TCI_CHARACTERISTICS[key].high);
    } else if (score <= 35) {
      characteristics.push(TCI_CHARACTERISTICS[key].low);
    }
  }

  return characteristics;
}

// 육각형 차트용 6축 데이터 생성
export function getHexagonChartData(tci: TCIScores, categories: ChannelCategories): {
  labels: string[];
  values: number[];
  descriptions: string[];
} {
  const sortedCats = getSortedCategories(categories);
  const topCat1 = sortedCats[0]?.percent || 0;
  const topCat2 = sortedCats[1]?.percent || 0;

  return {
    labels: ['감각적 민감성', '지적 호기심', '사회적 연결', '안정 추구', '자기 주도성', '내면 탐구'],
    values: [
      Math.round((tci.RD + (categories.musicMood || 0) / 10) / 2), // 감각적 민감성
      Math.round((tci.ST + (categories.readingHumanities || 0) / 10) / 2), // 지적 호기심
      Math.round((tci.CO + (categories.entertainmentVlog || 0) / 10) / 2), // 사회적 연결
      Math.round((tci.HA + (categories.lifestyleSpace || 0) / 10) / 2), // 안정 추구
      Math.round((tci.SD + (categories.careerBusiness || 0) / 10) / 2), // 자기 주도성
      Math.round((tci.ST + (categories.healingSpirituality || 0) / 10) / 2), // 내면 탐구
    ],
    descriptions: [
      '음악, 분위기, 미적 감각에 대한 민감도',
      '새로운 지식과 깊이 있는 콘텐츠에 대한 관심',
      '타인과의 연결과 소통에 대한 욕구',
      '안정적인 환경과 예측 가능한 삶에 대한 선호',
      '스스로 결정하고 이끌어가려는 성향',
      '삶의 의미와 내면 성찰에 대한 관심',
    ],
  };
}

// 문서 명세 기준 9장 카드 프롬프트
export const PHASE1_CARD_PROMPTS = {
  // 카드 1: 커버 (한 문장 요약)
  card_01_cover: (data: Phase1CardData): string => {
    const userName = data.userName || '당신';
    const sortedCategories = getSortedCategories(data.channel_categories);
    const topCategory = sortedCategories[0];
    const topTCI = getTopTCIScores(data.tci_scores, 2);
    const characteristics = getTCICharacteristics(data.tci_scores);

    return `사용자 분석 데이터:
- 이름: ${userName}
- 구독 채널 수: ${data.channelCount}개
- 상위 카테고리: ${sortedCategories.slice(0, 3).map(c => `${c.name}(${c.percent}%)`).join(', ')}
- 심리 특성 상위: ${topTCI.map(t => `${t.name}(${t.score}점)`).join(', ')}
- 주요 성향 특징: ${characteristics.slice(0, 2).join(', ')}

【커버 카드 작성 지침】
분량: 700자 이상 1,000자 미만

1. 대형 한 줄 카피 (마케팅 문구)
   - 사용자의 핵심 성향을 한 문장으로 표현
   - 예시: "감각을 통해 세상을 바라보는 자유로운 영혼"
   - 예시: "깊은 생각 속에서 답을 찾아가는 탐구자"

2. 환영 메시지 (3-4문장)
   - 따뜻하고 기대감을 주는 톤
   - 구독 데이터 분석의 의미 설명
   - 앞으로 펼쳐질 분석에 대한 기대감

3. 근거 요약 (2-3문장)
   - "${topCategory?.name}" 카테고리가 ${topCategory?.percent}%로 가장 높은 점
   - ${topTCI[0].name} 성향이 ${topTCI[0].score}점으로 두드러지는 점
   - 이것이 의미하는 바를 간단히 언급

반드시 700자 이상 작성하세요.`;
  },

  // 카드 2: 구독 데이터 개요 (마케팅 카피 + 육각형 차트)
  card_02_data_overview: (data: Phase1CardData): string => {
    const sortedCategories = getSortedCategories(data.channel_categories);
    const hexData = getHexagonChartData(data.tci_scores, data.channel_categories);
    const topTCI = getTopTCIScores(data.tci_scores, 3);
    const characteristics = getTCICharacteristics(data.tci_scores);

    return `사용자 구독 데이터:
- 총 채널 수: ${data.channelCount}개
- 사용 카테고리 수: ${sortedCategories.length}개
- 카테고리 분포:
${sortedCategories.map(c => `  · ${c.name}: ${c.count}개 (${c.percent}%)`).join('\n')}

육각형 차트 데이터 (0-100점):
${hexData.labels.map((label, i) => `  · ${label}: ${hexData.values[i]}점 - ${hexData.descriptions[i]}`).join('\n')}

심리 특성 분석:
- 상위 TCI: ${topTCI.map(t => `${t.name}(${t.score}점)`).join(', ')}
- 성향 키워드: ${characteristics.slice(0, 3).join(' / ')}

【구독 데이터 개요 카드 작성 지침】
분량: 700자 이상 1,000자 미만

⚠️ 중요: 카드 제목을 "구독 데이터 개요"로 쓰지 마세요!
대신 마케팅 카피라이팅 형태의 제목을 사용하세요.
예시: "감각을 통해 세상을 바라보는 자유로운 영혼"
예시: "다양한 관심사 속에서 자신만의 세계를 만드는 사람"

1. 마케팅 카피 제목 (필수)
   - 데이터가 보여주는 사용자의 핵심 특성을 한 문장으로

2. 데이터 요약 (3-4문장)
   - ${data.channelCount}개 채널에서 발견한 패턴
   - 상위 카테고리 ${sortedCategories[0]?.name}(${sortedCategories[0]?.percent}%)의 의미
   - 이 데이터가 말해주는 당신의 관심사

3. 육각형 밸런스 분석 (4-5문장) ← 차트와 함께 제공될 예정
   - 6가지 축 중 가장 높은 영역과 그 의미
   - 가장 낮은 영역과 그 의미
   - 전체적인 밸런스 해석
   - 이 밸런스가 나타내는 성격적 특징

4. 근거 제시 (3-4문장)
   - "왜 이렇게 해석하는지" 구체적 데이터 기반 설명
   - 카테고리 비율과 심리 특성의 연관성
   - ${sortedCategories[0]?.name} ${sortedCategories[0]?.percent}% → ${topTCI[0].name} ${topTCI[0].score}점의 연결고리

반드시 700자 이상 작성하세요.`;
  },

  // 카드 3: 당신은 ___ 타입 (통합 카드 - 카드3+4+5+6 합침)
  card_03_type_summary: (data: Phase1CardData): string => {
    const sortedCategories = getSortedCategories(data.channel_categories);
    const topTCI = getTopTCIScores(data.tci_scores, 3);
    const bottomTCI = getBottomTCIScores(data.tci_scores, 2);
    const characteristics = getTCICharacteristics(data.tci_scores);
    const t = data.tci_scores;

    // MBTI 특성 (번호 없이 특징만)
    const mbtiTraits: string[] = [];
    if (data.mbti_scores.E > data.mbti_scores.I) {
      mbtiTraits.push('사람들과의 교류에서 에너지를 얻는');
    } else {
      mbtiTraits.push('혼자만의 시간에서 에너지를 충전하는');
    }
    if (data.mbti_scores.S > data.mbti_scores.N) {
      mbtiTraits.push('현실적이고 구체적인 것을 선호하는');
    } else {
      mbtiTraits.push('가능성과 아이디어를 탐구하는 것을 좋아하는');
    }
    if (data.mbti_scores.T > data.mbti_scores.F) {
      mbtiTraits.push('논리적이고 객관적인 판단을 중시하는');
    } else {
      mbtiTraits.push('사람과 가치를 중심으로 결정하는');
    }
    if (data.mbti_scores.J > data.mbti_scores.P) {
      mbtiTraits.push('계획적이고 체계적인 것을 선호하는');
    } else {
      mbtiTraits.push('유연하고 즉흥적인 것을 즐기는');
    }

    // 애니어그램 특성 (번호 없이 특징만)
    const enneagramTraits: Record<number, string> = {
      1: '완벽을 추구하고 원칙을 중요시하는 성향',
      2: '타인을 돕고 관계를 중요시하는 따뜻한 성향',
      3: '성취와 인정을 추구하며 목표 지향적인 성향',
      4: '자신만의 독특함과 깊은 감정을 중요시하는 성향',
      5: '지식과 이해를 추구하며 독립적인 성향',
      6: '안전과 신뢰를 중요시하며 충성스러운 성향',
      7: '즐거움과 다양한 경험을 추구하는 활발한 성향',
      8: '힘과 통제를 중요시하며 도전적인 성향',
      9: '평화와 조화를 추구하며 수용적인 성향',
    };
    const enneaTrait = enneagramTraits[data.enneagram_type ?? 9];

    return `【분석 데이터 종합】

카테고리 분포:
${sortedCategories.map(c => `- ${c.name}: ${c.count}개 (${c.percent}%)`).join('\n')}

심리 특성 점수 (TCI 7차원, 0-100점):
- 자극추구(NS): ${t.NS}점 ${t.NS >= 65 ? '(높음)' : t.NS <= 35 ? '(낮음)' : '(보통)'}
- 위험회피(HA): ${t.HA}점 ${t.HA >= 65 ? '(높음)' : t.HA <= 35 ? '(낮음)' : '(보통)'}
- 사회적민감성(RD): ${t.RD}점 ${t.RD >= 65 ? '(높음)' : t.RD <= 35 ? '(낮음)' : '(보통)'}
- 인내력(P): ${t.P}점 ${t.P >= 65 ? '(높음)' : t.P <= 35 ? '(낮음)' : '(보통)'}
- 자율성(SD): ${t.SD}점 ${t.SD >= 65 ? '(높음)' : t.SD <= 35 ? '(낮음)' : '(보통)'}
- 연대감(CO): ${t.CO}점 ${t.CO >= 65 ? '(높음)' : t.CO <= 35 ? '(낮음)' : '(보통)'}
- 자기초월(ST): ${t.ST}점 ${t.ST >= 65 ? '(높음)' : t.ST <= 35 ? '(낮음)' : '(보통)'}

상위 특성: ${topTCI.map(t => `${t.name}(${t.score}점)`).join(', ')}
하위 특성: ${bottomTCI.map(t => `${t.name}(${t.score}점)`).join(', ')}

성향 특징 (심리검사 명칭 없이):
- ${mbtiTraits.join('\n- ')}
- ${enneaTrait}

도출된 특성 키워드: ${characteristics.join(' / ')}

【당신은 ___ 타입 카드 작성 지침】
분량: 1,500자 (다른 카드보다 긴 분량)

⚠️ 중요: MBTI 4글자(예: ESFP), 애니어그램 번호(예: 9번), TCI 척도명(예: 자극추구)을 직접 명시하지 마세요!
대신 그들의 특징만 서술하세요. 실제 검사 결과가 아니기 때문에 신뢰도 문제가 있습니다.

1. 유형명 제목 (2-4단어)
   - 예: "감성적 탐구자", "자유로운 연결자", "조용한 성장가"
   - 사용자의 핵심 특성을 함축하는 이름

2. 핵심 키워드 3개
   - 해시태그 형식: #내면탐색 #깊은대화 #성장지향

3. 구독 패턴에서 발견한 특징 (400자)
   - 상위 카테고리 ${sortedCategories[0]?.name}(${sortedCategories[0]?.percent}%)가 말해주는 것
   - ${sortedCategories[1]?.name}(${sortedCategories[1]?.percent}%)와의 조합이 보여주는 것
   - 이 패턴이 왜 당신의 성격을 나타내는지 근거 설명

4. 심리 특성 해석 (400자) ← MBTI/애니어그램 명칭 없이!
   - "${mbtiTraits[0]}" 특성에 대한 설명
   - "${mbtiTraits[1]}" 특성에 대한 설명
   - "${enneaTrait}"에 대한 설명
   - 이 특성들이 구독 데이터와 어떻게 연결되는지

5. 종합 해석 (400자)
   - 위 특성들이 조합되어 나타나는 당신만의 독특한 모습
   - 강점과 매력 포인트
   - 다른 사람들이 당신을 어떻게 느끼는지

6. 근거 제시 (300자)
   - "왜 이 유형으로 진단했는지" 구체적 설명
   - ${sortedCategories[0]?.name} ${sortedCategories[0]?.percent}% → 이 특성
   - ${topTCI[0].name} ${topTCI[0].score}점 → 이 특성
   - 데이터와 해석의 연결고리를 명확히

반드시 1,500자 이상 작성하세요.`;
  },

  // 카드 4: 당신의 감성 (기존 카드 7)
  card_04_emotion: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    const sortedCategories = getSortedCategories(data.channel_categories);
    const musicPercent = sortedCategories.find(c => c.id === 'musicMood')?.percent || 0;
    const healingPercent = sortedCategories.find(c => c.id === 'healingSpirituality')?.percent || 0;

    return `감성 관련 데이터:
- 자기초월(ST): ${t.ST}점 ${t.ST >= 65 ? '(높음)' : t.ST <= 35 ? '(낮음)' : '(보통)'}
- 사회적민감성(RD): ${t.RD}점 ${t.RD >= 65 ? '(높음)' : t.RD <= 35 ? '(낮음)' : '(보통)'}
- 위험회피(HA): ${t.HA}점 ${t.HA >= 65 ? '(높음)' : t.HA <= 35 ? '(낮음)' : '(보통)'}
- 연대감(CO): ${t.CO}점 ${t.CO >= 65 ? '(높음)' : t.CO <= 35 ? '(낮음)' : '(보통)'}
- 음악/분위기 카테고리: ${musicPercent}%
- 힐링/영성 카테고리: ${healingPercent}%

【당신의 감성 카드 작성 지침】
분량: 700자 이상 1,000자 미만

1. 감성 유형 정의 (한 문장)
   - 예: "플레이리스트로 하루를 설계하는 사람"
   - 예: "조용한 공간에서 마음을 정리하는 사람"

2. 감정 처리 방식 (4-5문장)
   - 힘들 때 어떻게 감정을 처리하는지 추론
   - ${t.HA >= 50 ? '신중하고 조심스럽게 감정을 다루는' : '감정에 솔직하고 표현적인'} 특성
   - ${t.RD >= 50 ? '타인과 감정을 나누며 해소하는' : '혼자만의 시간으로 정리하는'} 방식
   - 구체적인 상황 예시 포함

3. 힐링 패턴 체크리스트 (5개 항목)
   - ✓ 형식으로 당신만의 힐링 방법 제시
   - 구독 데이터 기반으로 추론

4. 긍정적 리프레이밍 (3-4문장)
   - "이건 약점이 아니에요"라는 메시지
   - 이 감성이 가진 강점과 매력

5. 근거 제시 (2-3문장)
   - 음악/분위기 ${musicPercent}%, 힐링/영성 ${healingPercent}%가 말해주는 것
   - 자기초월 ${t.ST}점, 사회적민감성 ${t.RD}점의 의미

반드시 700자 이상 작성하세요.`;
  },

  // 카드 5: 추구하는 미래 (기존 카드 8)
  card_05_future: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    const sortedCategories = getSortedCategories(data.channel_categories);
    const careerPercent = sortedCategories.find(c => c.id === 'careerBusiness')?.percent || 0;
    const lifestylePercent = sortedCategories.find(c => c.id === 'lifestyleSpace')?.percent || 0;
    const financePercent = sortedCategories.find(c => c.id === 'financeInvest')?.percent || 0;

    return `미래 지향 데이터:
- 자율성(SD): ${t.SD}점 ${t.SD >= 65 ? '(높음)' : t.SD <= 35 ? '(낮음)' : '(보통)'}
- 자기초월(ST): ${t.ST}점 ${t.ST >= 65 ? '(높음)' : t.ST <= 35 ? '(낮음)' : '(보통)'}
- 인내력(P): ${t.P}점 ${t.P >= 65 ? '(높음)' : t.P <= 35 ? '(낮음)' : '(보통)'}
- 커리어/창업 카테고리: ${careerPercent}%
- 라이프스타일/공간 카테고리: ${lifestylePercent}%
- 경제/재테크 카테고리: ${financePercent}%

【추구하는 미래 카드 작성 지침】
분량: 700자 이상 1,000자 미만

1. 미래상 비유 제목 (한 문장)
   - 예: "서재와 와인이 있는 저녁"
   - 예: "자유롭게 일하며 세계를 여행하는 삶"

2. 3축 분석 (각 2문장)
   - 라이프스타일: ${lifestylePercent}% 기반 해석
   - 커리어: ${careerPercent}% 기반 해석
   - 관계: 연대감(CO) ${t.CO}점 기반 해석

3. 미래의 어느 저녁 장면 (5-6문장)
   - 구체적인 시각적 묘사
   - 공간, 분위기, 함께하는 사람
   - 당신이 느끼는 감정

4. 심리 특성이 말해주는 욕구 (3-4문장)
   - 자율성 ${t.SD}점이 의미하는 것
   - 자기초월 ${t.ST}점이 의미하는 것
   - 인내력 ${t.P}점이 의미하는 것

5. 근거 제시 (2-3문장)
   - 커리어/창업 ${careerPercent}%, 라이프스타일 ${lifestylePercent}%의 연결
   - 이 데이터가 왜 이런 미래상을 나타내는지

반드시 700자 이상 작성하세요.`;
  },

  // 카드 6: 견디기 힘든 상대방의 단점 (기존 카드 9)
  card_06_weakness: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    const topTCI = getTopTCIScores(data.tci_scores, 2);
    const bottomTCI = getBottomTCIScores(data.tci_scores, 2);

    return `성향 데이터:
- 자기초월(ST): ${t.ST}점
- 연대감(CO): ${t.CO}점
- 사회적민감성(RD): ${t.RD}점
- 자율성(SD): ${t.SD}점
- 위험회피(HA): ${t.HA}점
- 상위 특성: ${topTCI.map(t => `${t.name}(${t.score}점)`).join(', ')}
- 하위 특성: ${bottomTCI.map(t => `${t.name}(${t.score}점)`).join(', ')}

【견디기 힘든 상대방의 모습 카드 작성 지침】
분량: 700자 이상 1,000자 미만

⚠️ MBTI/애니어그램 명칭을 직접 언급하지 마세요!

1. 힘든 특성 정의 (한 문장)
   - 당신이 가장 힘들어하는 상대방의 한 가지 특성

2. 왜 힘든지 설명 (4-5문장)
   - ${topTCI[0].name}이 높은 당신이기 때문에...
   - ${bottomTCI[0].name}이 낮은 당신에게는...
   - 심리 특성 기반으로 왜 이것이 힘든지 설명

3. 구체적 상황 예시 테이블 (3개)
   | 힘든 상황 | 당신의 내면 |
   - 실제 겪을 수 있는 구체적 상황

4. 긍정적 리프레이밍 (3-4문장)
   - "이건 약점이 아니에요"
   - 이 민감함이 가진 강점
   - 다르게 바라보는 시각

5. 근거 제시 (2-3문장)
   - ${topTCI[0].name} ${topTCI[0].score}점, ${topTCI[1].name} ${topTCI[1].score}점 기반
   - 왜 이 특성이 이런 민감함을 만드는지

반드시 700자 이상 작성하세요.`;
  },

  // 카드 7: 당신의 왕자님은 (기존 카드 10)
  card_07_prince: (data: Phase1CardData): string => {
    const h = data.matched_husband;
    const metaphor = data.metaphor ?? (h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i) ?? h.description;
    const topTCI = getTopTCIScores(data.tci_scores, 2);

    return `매칭 결과:
- 남편상: ${h.name} (${h.category} - ${h.subcategory})
- 비유: ${metaphor}
- 매칭 점수: ${Math.round(data.match_score * 100)}%
- 당신의 상위 특성: ${topTCI.map(t => `${t.name}(${t.score}점)`).join(', ')}

【당신의 왕자님 카드 작성 지침】
분량: 700자 이상 1,000자 미만

1. 대형 비유 문구 제목
   - 예: "오래된 서재에서 건넨 첫 문장"
   - 예: "모험을 함께 떠날 든든한 파트너"

2. 유형 정의 (2문장)
   - ${h.category} - ${h.subcategory} 유형
   - 이 유형의 핵심 매력 한 줄

3. 처음 만났을 때 (4-5문장)
   - 첫 만남의 장면 묘사
   - 어떤 점에서 끌리게 될지
   - 대화가 어떻게 흘러갈지

4. 왜 이 유형인지 (4-5문장)
   - ${topTCI[0].name} ${topTCI[0].score}점인 당신에게 이 유형이 맞는 이유
   - 상호 보완되는 지점
   - 함께할 때 시너지

5. 근거 제시 (2-3문장)
   - 매칭 점수 ${Math.round(data.match_score * 100)}%의 의미
   - 어떤 데이터가 이 매칭을 이끌었는지

반드시 700자 이상 작성하세요.`;
  },

  // 카드 8: 왕자님 상세 프로필 (기존 카드 11)
  card_08_prince_detail: (data: Phase1CardData): string => {
    const h = data.matched_husband;
    const metaphor = data.metaphor ?? (h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i) ?? h.description;

    return `매칭된 남편상 상세:
- 이름: ${h.name}
- 카테고리: ${h.category}
- 서브카테고리: ${h.subcategory}
- 변형: ${h.variant === 'extrovert' ? '외향형' : '내향형'}
- 설명: ${h.description}
- 비유: ${metaphor}

【왕자님 상세 프로필 카드 작성 지침】
분량: 700자 이상 1,000자 미만

1. 기본 정보
   - 유형명과 간단한 정의

2. "이런 분이에요" (5-6문장)
   - 성격과 특성 묘사
   - 일상에서의 모습
   - 관계에서의 모습

3. "함께하면 이런 모습이에요" (3개 장면)
   【장면 1】 주말 오후...
   【장면 2】 힘든 날...
   【장면 3】 특별한 날...
   - 각 장면 2-3문장으로 구체적 묘사

4. "알아두세요" (3-4문장)
   - 이 유형과 잘 지내기 위한 팁
   - 주의해야 할 점
   - 오해하기 쉬운 부분

반드시 700자 이상 작성하세요.`;
  },

  // 카드 9: 결제 유도 (기존 카드 12)
  card_09_cta: (data: Phase1CardData): string => {
    return `Phase 1 분석이 완료되었습니다.

【결제 유도 카드 작성 지침】
분량: 500자 이상 700자 미만

1. 마무리 메시지 (2-3문장)
   - "여기까지가 무료 분석이에요"
   - 지금까지의 분석 요약

2. Phase 2 미리보기 (블러 처리 형태로 4개)
   - ✦ 애인이 생각하는 당신
     → "조용한 바다 같은 사람 — 깊이를..." [블러]
   - ✦ 당신이 결혼을 확신하게 되는 순간
     → "당신에게 결혼의 확신은..." [블러]
   - ✦ 연애에서 결혼으로 못 가는 진짜 이유
     → "반복되는 패턴이..." [블러]
   - ✦ 만약 이혼한다면, 그 이유는...
     → "위험 요인 분석 결과..." [블러]

3. Phase 2 진행 방식 (3문장)
   - 9개의 심층 질문
   - YouTube 데이터와 교차 검증
   - 8장의 심층 리포트 카드

4. CTA
   - "심층 분석 시작하기 — ₩4,900"

5. 면책 조항 (2문장)
   - 심리학적 연구 기반이지만 실제 검사를 대체하지 않음
   - 재미와 자기 이해를 위한 콘텐츠

반드시 500자 이상 작성하세요.`;
  },
};
