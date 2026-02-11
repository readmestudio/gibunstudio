/**
 * Phase 1 리포트 카드 생성 유틸리티 및 타입 정의
 * 실제 카드 프롬프트는 run-from-channels.ts에서 11장 구조로 직접 생성
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
