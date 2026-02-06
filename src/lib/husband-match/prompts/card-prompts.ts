/**
 * Phase 1 리포트 카드 12장 생성 프롬프트
 * 문서 명세 기준: 카드 구조 및 문체 가이드
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

// 문서 명세 기준 12장 카드 프롬프트
export const PHASE1_CARD_PROMPTS = {
  // 카드 1: 커버 (한 문장 요약)
  card_01_cover: (data: Phase1CardData): string => {
    const userName = data.userName || '당신';
    const topCategory = getSortedCategories(data.channel_categories)[0];
    return `사용자 분석 데이터:
- 이름: ${userName}
- 구독 채널 수: ${data.channelCount}개
- 주요 카테고리: ${topCategory?.name || '다양함'}
- MBTI: ${data.mbti_type}
- 애니어그램: ${data.enneagram_type}번

커버 카드를 작성해주세요.
- 한 문장으로 사용자의 성격을 비유적으로 표현
- 예: "조용한 깊이 속에서 세상을 이해하는 사람"
- 따뜻하고 기대감을 주는 환영 메시지 2-3문장 추가`;
  },

  // 카드 2: 구독 데이터 개요
  card_02_data_overview: (data: Phase1CardData): string => {
    const sortedCategories = getSortedCategories(data.channel_categories);
    const categoryList = sortedCategories.slice(0, 5).map(c => `${c.name}: ${c.count}개 (${c.percent}%)`).join(', ');
    return `사용자 구독 데이터:
- 총 채널 수: ${data.channelCount}개
- 사용 카테고리 수: ${sortedCategories.length}개
- 카테고리 분포: ${categoryList}

구독 데이터 개요 카드를 작성해주세요.
- 통계 요약 (채널 수, 카테고리 수, 가장 많은 분야)
- 이 데이터가 의미하는 바를 따뜻하게 설명
- 특이한 패턴이 있다면 언급 (예: 특정 분야 집중도가 높음)`;
  },

  // 카드 3: 당신은 ___ 타입
  card_03_type_summary: (data: Phase1CardData): string => {
    const topTCI = getTopTCIScores(data.tci_scores);
    const enneaName = ENNEAGRAM_NAMES[data.enneagram_type ?? 9];
    return `분석 결과:
- MBTI: ${data.mbti_type}
- 애니어그램: ${data.enneagram_type}번 (${enneaName})
- TCI 상위: ${topTCI.map(t => `${t.name}(${t.score})`).join(', ')}

사용자의 "타입"을 정의하는 카드를 작성해주세요.
- 2-3단어의 타입명 (예: "감성적 탐구자", "조용한 실천가")
- 핵심 키워드 3개 (해시태그 형식)
- 이 타입의 특성을 비유와 함께 설명 (2-3문단)`;
  },

  // 카드 4: 구독 리스트 특징 & 패턴
  card_04_patterns: (data: Phase1CardData): string => {
    const sortedCategories = getSortedCategories(data.channel_categories);
    const patterns = sortedCategories.slice(0, 3).map(c => `${c.name}(${c.percent}%)`);
    return `카테고리 분포:
${sortedCategories.map(c => `- ${c.name}: ${c.count}개 (${c.percent}%)`).join('\n')}

구독 리스트에서 발견한 특별한 패턴을 작성해주세요.
- 2-3개의 패턴을 각각 제목과 함께 설명
- 예: "새벽형 사색가", "성장 중독자", "감성 큐레이터"
- 각 패턴이 성격과 어떻게 연결되는지 따뜻하게 서술`;
  },

  // 카드 5: 주 카테고리 분류 & 설명
  card_05_categories: (data: Phase1CardData): string => {
    const sortedCategories = getSortedCategories(data.channel_categories);
    const top3 = sortedCategories.slice(0, 3);
    return `카테고리 분포:
${sortedCategories.map(c => `- ${c.name}: ${c.count}개 (${c.percent}%)`).join('\n')}

주요 카테고리 분석 카드를 작성해주세요.
- 상위 3개 카테고리를 순위별로 설명
- 각 카테고리가 나타내는 "성향 시그널" 명시
- 카테고리 조합이 보여주는 독특한 특성 설명`;
  },

  // 카드 6: 종합 유형 카드 (MBTI, 애니어그램, TCI 명시)
  card_06_comprehensive: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    const enneaName = ENNEAGRAM_NAMES[data.enneagram_type ?? 9];
    const topTCI = getTopTCIScores(data.tci_scores, 2);
    return `종합 분석 결과:
- MBTI: ${data.mbti_type} (E/I: ${data.mbti_scores.E}/${data.mbti_scores.I}, S/N: ${data.mbti_scores.S}/${data.mbti_scores.N}, T/F: ${data.mbti_scores.T}/${data.mbti_scores.F}, J/P: ${data.mbti_scores.J}/${data.mbti_scores.P})
- 애니어그램: ${data.enneagram_type}번 (${enneaName})
- TCI 7차원: NS=${t.NS}, HA=${t.HA}, RD=${t.RD}, P=${t.P}, SD=${t.SD}, CO=${t.CO}, ST=${t.ST}

종합 유형 카드를 작성해주세요.
- MBTI, 애니어그램, TCI 상위 척도를 명시
- 한 문장 비유 (예: "고요한 불꽃처럼 내면에서 빛나는 사람")
- TCI 각 척도의 의미를 심리학적으로 해석 (2-3문단)
- ${data.mbti_type}와 ${data.enneagram_type}번의 조합이 가진 특성 설명`;
  },

  // 카드 7: 당신의 감성
  card_07_emotion: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    const sortedCategories = getSortedCategories(data.channel_categories);
    return `감성 관련 데이터:
- TCI 자기초월(ST): ${t.ST}
- TCI 사회적민감성(RD): ${t.RD}
- TCI 위험회피(HA): ${t.HA}
- 음악/분위기 비율: ${sortedCategories.find(c => c.id === 'musicMood')?.percent || 0}%
- 힐링/영성 비율: ${sortedCategories.find(c => c.id === 'healingSpirituality')?.percent || 0}%

당신의 감성 카드를 작성해주세요.
- 감성 유형 정의 (예: "플레이리스트로 하루를 설계하는 사람")
- 힘들 때 어떻게 감정을 처리하는지 추론
- 당신만의 힐링 패턴 체크리스트 형식으로 제시
- "이건 약점이 아니에요"라는 메시지 포함`;
  },

  // 카드 8: 추구하는 미래
  card_08_future: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    const sortedCategories = getSortedCategories(data.channel_categories);
    return `미래 지향 데이터:
- TCI 자율성(SD): ${t.SD}
- TCI 자기초월(ST): ${t.ST}
- TCI 인내력(P): ${t.P}
- 커리어/창업 비율: ${sortedCategories.find(c => c.id === 'careerBusiness')?.percent || 0}%
- 라이프스타일/공간 비율: ${sortedCategories.find(c => c.id === 'lifestyleSpace')?.percent || 0}%

당신이 꿈꾸는 미래 카드를 작성해주세요.
- 미래상 비유 (예: "서재와 와인이 있는 저녁")
- 라이프스타일/커리어/관계 3축 점수 제시
- 미래의 어느 저녁 장면을 구체적으로 묘사
- TCI 점수가 말해주는 욕구 해석`;
  },

  // 카드 9: 견디기 힘든 상대방의 단점
  card_09_weakness: (data: Phase1CardData): string => {
    const t = data.tci_scores;
    const enneaName = ENNEAGRAM_NAMES[data.enneagram_type ?? 9];
    return `성향 데이터:
- TCI 자기초월(ST): ${t.ST}
- TCI 연대감(CO): ${t.CO}
- TCI 사회적민감성(RD): ${t.RD}
- MBTI: ${data.mbti_type}
- 애니어그램: ${data.enneagram_type}번 (${enneaName})

당신이 견디기 힘든 상대방의 모습 카드를 작성해주세요.
- 가장 힘들어하는 상대방의 특성 1개를 정의
- 왜 그런지 TCI/MBTI 기반으로 설명
- "이건 약점이 아니에요"라는 긍정적 리프레이밍
- 구체적 상황 예시 테이블 (힘든 상황 | 당신의 내면)`;
  },

  // 카드 10: 당신의 왕자님은
  card_10_prince: (data: Phase1CardData): string => {
    const h = data.matched_husband;
    const metaphor = data.metaphor ?? (h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i) ?? h.description;
    return `매칭 결과:
- 남편상: ${h.name} (${h.category} - ${h.subcategory})
- 비유: ${metaphor}
- 매칭 점수: ${Math.round(data.match_score * 100)}%

당신의 왕자님 카드를 작성해주세요.
- 대형 비유 문구로 시작 (예: "오래된 서재에서 건넨 첫 문장")
- 유형 정의 (예: "감성형 - 문학적 영혼의 동반자")
- 처음 만났을 때 어떨지, 왜 이 유형인지 TCI 기반 설명`;
  },

  // 카드 11: 왕자님 상세 프로필
  card_11_prince_detail: (data: Phase1CardData): string => {
    const h = data.matched_husband;
    const metaphor = data.metaphor ?? (h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i) ?? h.description;
    return `매칭된 남편상 상세:
- 이름: ${h.name}
- 카테고리: ${h.category}
- 서브카테고리: ${h.subcategory}
- 변형: ${h.variant === 'extrovert' ? '외향형' : '내향형'}
- 설명: ${h.description}
- 비유: ${metaphor}

왕자님 상세 프로필 카드를 작성해주세요.
- 기본 정보 (유형, 호환 MBTI, 연결 애니어그램)
- "이런 분이에요" - 성격 묘사
- "함께하면 이런 모습이에요" - 3개의 구체적 장면
- "알아두세요" - 주의사항이나 조언`;
  },

  // 카드 12: 결제 유도
  card_12_cta: (data: Phase1CardData): string => {
    return `Phase 1 분석이 완료되었습니다.

결제 유도 카드를 작성해주세요.
- "여기까지가 무료 분석이에요" 메시지
- Phase 2에서 알 수 있는 것 4개 (블러 처리된 미리보기 형태)
  - 애인이 생각하는 당신
  - 당신이 결혼을 확신하게 되는 순간
  - 연애에서 결혼으로 못 가는 진짜 이유
  - 만약 이혼한다면, 그 이유는...
- Phase 2 진행 방식 설명 (9개 심층 질문, 교차 검증, 8장 리포트)
- CTA 버튼 문구: "심층 분석 시작하기 — ₩4,900"
- 면책 조항 포함`;
  },
};
