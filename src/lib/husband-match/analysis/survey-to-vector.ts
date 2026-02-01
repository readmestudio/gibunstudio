import type { ChannelCategories, TCIScores, EnneagramCenter, MBTIScores } from '../types';
import type { Phase1SurveyAnswer } from '../data/phase1-survey-questions';
import { PHASE1_SURVEY_QUESTIONS } from '../data/phase1-survey-questions';
import { calculateTCI } from './calculate-tci';
import { estimateEnneagram } from './estimate-enneagram';
import { estimateMBTI } from './estimate-mbti';
import { createVector } from './create-vector';

const CAT_KEYS: (keyof ChannelCategories)[] = [
  'music', 'reading', 'sports', 'cooking', 'travel', 'gaming', 'tech', 'art', 'education', 'entertainment',
];

function emptyCategories(): ChannelCategories {
  return {
    music: 0, reading: 0, sports: 0, cooking: 0, travel: 0,
    gaming: 0, tech: 0, art: 0, education: 0, entertainment: 0,
  };
}

function addWeights(cat: ChannelCategories, weights: Partial<ChannelCategories> | undefined, scale: number = 1) {
  if (!weights) return;
  for (const k of CAT_KEYS) {
    const v = weights[k];
    if (v != null) cat[k] += v * scale;
  }
}

function getOptionWeights(questionId: keyof Phase1SurveyAnswer, optionId: string): Partial<ChannelCategories> | undefined {
  const q = PHASE1_SURVEY_QUESTIONS.find((x) => x.id === questionId);
  if (!q) return undefined;
  if (q.options) {
    const opt = q.options.find((o) => o.id === optionId);
    return opt?.categoryWeights;
  }
  if (q.single3Questions) {
    for (const sq of q.single3Questions) {
      const opt = sq.options.find((o) => o.id === optionId);
      if (opt) return opt.categoryWeights;
    }
  }
  if (q.rank6Options) {
    const opt = q.rank6Options.find((o) => o.id === optionId);
    return opt?.categoryWeights;
  }
  return undefined;
}

// S1: 이미지 카드 9개 중 1·2·3위 (가중치 3, 2, 1)
function applyS1(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const rank = answers.S1;
  if (!rank || rank.length < 3) return;
  const scales = [3, 2, 1];
  rank.forEach((id, i) => addWeights(cat, getOptionWeights('S1', id), scales[i]));
}

// S2: 채널 목록 복수 선택
function applyS2(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S2?.forEach((id) => addWeights(cat, getOptionWeights('S2', id), 1));
}

// S3: 양자택일 4쌍 — A=글/계획/집/쉬기, B=영상/즉흥/밖/활동 → 카테고리 보정
function applyS3(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const pairs = answers.S3;
  if (!pairs || pairs.length !== 4) return;
  // [휴일 집/밖, 정보 글/영상, 결정 계획/즉흥, 스트레스 쉬기/활동]
  if (pairs[0] === 'A') {
    cat.reading += 15;
    cat.art += 10;
  } else {
    cat.travel += 15;
    cat.sports += 15;
  }
  if (pairs[1] === 'A') {
    cat.reading += 20;
    cat.education += 10;
  } else {
    cat.entertainment += 20;
  }
  if (pairs[2] === 'A') {
    cat.education += 15;
    cat.tech += 10;
  } else {
    cat.gaming += 15;
    cat.entertainment += 10;
  }
  if (pairs[3] === 'A') {
    cat.art += 15;
    cat.music += 10;
  } else {
    cat.sports += 20;
    cat.travel += 10;
  }
}

// S4: 무드보드 6개 중 2개
function applyS4(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S4?.forEach((id) => addWeights(cat, getOptionWeights('S4', id), 1));
}

// S5: 검색어 3개 → 키워드별 카테고리 매핑
const S5_KEYWORD_MAP: Record<string, Partial<ChannelCategories>> = {
  '요리 레시피': { cooking: 100 },
  '힐링 음악': { music: 50, art: 50 },
  '재테크': { tech: 50, education: 50 },
  '게임 공략': { gaming: 100 },
  '여행 vlog': { travel: 80, entertainment: 20 },
  '독서 정리': { reading: 100 },
  '운동 루틴': { sports: 100 },
  'IT 리뷰': { tech: 100 },
  '명상': { art: 100 },
  '예능 하이라이트': { entertainment: 100 },
};

function applyS5(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S5?.forEach((kw) => {
    const w = S5_KEYWORD_MAP[kw];
    if (w) addWeights(cat, w, 1);
  });
}

// S6: 슬라이더 3개 (0-100) → 집/밖, 글/영상, 계획/즉흥
function applyS6(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const s = answers.S6;
  if (!s || s.length !== 3) return;
  const [homeOut, textVideo, planImpulse] = s;
  // homeOut: 낮으면 집(reading, art), 높으면 밖(sports, travel)
  cat.reading += (100 - homeOut) * 0.15;
  cat.art += (100 - homeOut) * 0.1;
  cat.sports += homeOut * 0.15;
  cat.travel += homeOut * 0.1;
  // textVideo: 낮으면 글(reading, education), 높으면 영상(entertainment)
  cat.reading += (100 - textVideo) * 0.15;
  cat.education += (100 - textVideo) * 0.1;
  cat.entertainment += textVideo * 0.2;
  // planImpulse: 낮으면 계획(education, tech), 높으면 즉흥(gaming, entertainment)
  cat.education += (100 - planImpulse) * 0.1;
  cat.tech += (100 - planImpulse) * 0.1;
  cat.gaming += planImpulse * 0.1;
  cat.entertainment += planImpulse * 0.15;
}

// S7: 단일 선택 3문항
function applyS7(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S7?.forEach((id) => addWeights(cat, getOptionWeights('S7', id), 1));
}

// S8: 상황 시나리오 3개 3지선다 — 선택지별 카테고리
function applyS8(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const sc = answers.S8;
  if (!sc || sc.length !== 3) return;
  // 시나리오1: 즉시 만남=entertainment/sports, 일정 확인=education/tech, 거절=reading/art
  if (sc[0] === 0) {
    cat.entertainment += 25;
    cat.sports += 15;
  } else if (sc[0] === 1) {
    cat.education += 15;
    cat.tech += 15;
  } else {
    cat.reading += 20;
    cat.art += 20;
  }
  // 시나리오2: 영상=entertainment, 글=reading/education, 체험=travel/sports
  if (sc[1] === 0) cat.entertainment += 30;
  else if (sc[1] === 1) {
    cat.reading += 20;
    cat.education += 15;
  } else {
    cat.travel += 20;
    cat.sports += 20;
  }
  // 시나리오3: 운동/밖=sports/travel, 영상/음악=entertainment/music, 조용히=art/reading
  if (sc[2] === 0) {
    cat.sports += 25;
    cat.travel += 15;
  } else if (sc[2] === 1) {
    cat.entertainment += 20;
    cat.music += 20;
  } else {
    cat.art += 25;
    cat.reading += 15;
  }
}

// S9: 울컥 영상 2개
function applyS9(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S9?.forEach((id) => addWeights(cat, getOptionWeights('S9', id), 1));
}

// S10: 6개 항목 1·2·3위 (가중치 3, 2, 1)
function applyS10(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const r = answers.S10;
  if (!r) return;
  const scale = [3, 2, 1] as const;
  [r.first, r.second, r.third].forEach((id, i) =>
    addWeights(cat, getOptionWeights('S10', id), scale[i])
  );
}

// S11: 4개 중 1개
function applyS11(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  if (answers.S11) addWeights(cat, getOptionWeights('S11', answers.S11), 1);
}

// S12: 7개 중 2개
function applyS12(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S12?.forEach((id) => addWeights(cat, getOptionWeights('S12', id), 1));
}

export interface SurveyVectorResult {
  channel_categories: ChannelCategories;
  tci_scores: TCIScores;
  enneagram_center: EnneagramCenter;
  enneagram_type: number;
  mbti_scores: MBTIScores;
  mbti_type: string;
  user_vector: number[];
}

/**
 * 서베이 응답(S1~S12)으로 Phase 1과 동일한 형태의 채널 카테고리·TCI·에니어그램·MBTI·18차원 벡터 산출
 */
export function buildVectorFromSurvey(answers: Phase1SurveyAnswer): SurveyVectorResult {
  const cat = emptyCategories();

  applyS1(answers, cat);
  applyS2(answers, cat);
  applyS3(answers, cat);
  applyS4(answers, cat);
  applyS5(answers, cat);
  applyS6(answers, cat);
  applyS7(answers, cat);
  applyS8(answers, cat);
  applyS9(answers, cat);
  applyS10(answers, cat);
  applyS11(answers, cat);
  applyS12(answers, cat);

  // 정규화: 최소 합계 보장 후 기존 파이프라인 사용
  const total = Object.values(cat).reduce((s, v) => s + v, 0);
  if (total === 0) {
    CAT_KEYS.forEach((k) => (cat[k] = 10));
  }

  const tci_scores = calculateTCI(cat);
  const { center: enneagram_center, type: enneagram_type } = estimateEnneagram(tci_scores, cat);
  const { scores: mbti_scores, type: mbti_type } = estimateMBTI(tci_scores, cat);
  const user_vector = createVector(tci_scores, enneagram_center, cat);

  return {
    channel_categories: cat,
    tci_scores,
    enneagram_center,
    enneagram_type,
    mbti_scores,
    mbti_type,
    user_vector,
  };
}
