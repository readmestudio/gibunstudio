import type { ChannelCategories, TCIScores, EnneagramCenter, MBTIScores } from '../types';
import type { Phase1SurveyAnswer } from '../data/phase1-survey-questions';
import { PHASE1_SURVEY_QUESTIONS } from '../data/phase1-survey-questions';
import { calculateTCI } from './calculate-tci';
import { estimateEnneagram } from './estimate-enneagram';
import { estimateMBTI } from './estimate-mbti';
import { createVector } from './create-vector';
import { CategoryId } from '../data/categories';

// 문서 명세 기준 10대 카테고리
const CAT_KEYS: (keyof ChannelCategories)[] = [
  'musicMood', 'readingHumanities', 'sportsOutdoor', 'entertainmentVlog',
  'languageCulture', 'lifestyleSpace', 'careerBusiness', 'healingSpirituality',
  'fashionBeauty', 'financeInvest',
];

function emptyCategories(): ChannelCategories {
  return {
    musicMood: 0,
    readingHumanities: 0,
    sportsOutdoor: 0,
    entertainmentVlog: 0,
    languageCulture: 0,
    lifestyleSpace: 0,
    careerBusiness: 0,
    healingSpirituality: 0,
    fashionBeauty: 0,
    financeInvest: 0,
  };
}

function addWeights(cat: ChannelCategories, weights: Partial<ChannelCategories> | undefined, scale: number = 1) {
  if (!weights) return;
  for (const k of CAT_KEYS) {
    const v = weights[k];
    if (v != null) cat[k] += v * scale;
  }
}

// 기존 카테고리 → 새 카테고리 매핑
// 기존: music, reading, sports, cooking, travel, gaming, tech, art, education, entertainment
// 새로운: musicMood, readingHumanities, sportsOutdoor, entertainmentVlog, languageCulture, lifestyleSpace, careerBusiness, healingSpirituality, fashionBeauty, financeInvest
function mapOldToNewCategory(oldWeights: Record<string, number> | undefined): Partial<ChannelCategories> | undefined {
  if (!oldWeights) return undefined;
  const newWeights: Partial<ChannelCategories> = {};

  // music → musicMood
  if (oldWeights.music) newWeights.musicMood = oldWeights.music;
  // reading → readingHumanities
  if (oldWeights.reading) newWeights.readingHumanities = oldWeights.reading;
  // sports + travel → sportsOutdoor
  if (oldWeights.sports || oldWeights.travel) {
    newWeights.sportsOutdoor = (oldWeights.sports || 0) + (oldWeights.travel || 0);
  }
  // entertainment + gaming → entertainmentVlog
  if (oldWeights.entertainment || oldWeights.gaming) {
    newWeights.entertainmentVlog = (oldWeights.entertainment || 0) + (oldWeights.gaming || 0) * 0.5;
  }
  // tech → careerBusiness (IT/테크가 커리어창업에 포함)
  if (oldWeights.tech) newWeights.careerBusiness = oldWeights.tech;
  // art → healingSpirituality (예술/명상 관련)
  if (oldWeights.art) newWeights.healingSpirituality = oldWeights.art * 0.7;
  // education → readingHumanities + careerBusiness
  if (oldWeights.education) {
    newWeights.readingHumanities = (newWeights.readingHumanities || 0) + oldWeights.education * 0.5;
    newWeights.careerBusiness = (newWeights.careerBusiness || 0) + oldWeights.education * 0.5;
  }
  // cooking → lifestyleSpace
  if (oldWeights.cooking) newWeights.lifestyleSpace = oldWeights.cooking;

  return newWeights;
}

function getOptionWeights(questionId: keyof Phase1SurveyAnswer, optionId: string): Partial<ChannelCategories> | undefined {
  const q = PHASE1_SURVEY_QUESTIONS.find((x) => x.id === questionId);
  if (!q) return undefined;

  let oldWeights: Record<string, number> | undefined;

  if (q.options) {
    const opt = q.options.find((o) => o.id === optionId);
    oldWeights = opt?.categoryWeights as Record<string, number> | undefined;
  }
  if (q.single3Questions) {
    for (const sq of q.single3Questions) {
      const opt = sq.options.find((o) => o.id === optionId);
      if (opt) {
        oldWeights = opt.categoryWeights as Record<string, number> | undefined;
        break;
      }
    }
  }
  if (q.rank6Options) {
    const opt = q.rank6Options.find((o) => o.id === optionId);
    oldWeights = opt?.categoryWeights as Record<string, number> | undefined;
  }

  return mapOldToNewCategory(oldWeights);
}

// S1: 이미지 카드 9개 중 1·2·3위 (가중치 3, 2, 1)
function applyS1(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const rank = answers.S1;
  if (!rank || rank.length < 3) return;
  const scales = [3, 2, 1];
  rank.forEach((id, i) => addWeights(cat, getOptionWeights('S1', id), scales[i]));
}

// S2_channels: 자주 보는/구독 채널 이름 선택
function applyS2Channels(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S2_channels?.forEach((id) => addWeights(cat, getOptionWeights('S2_channels', id), 1));
}

// S2: 채널 목록 복수 선택
function applyS2(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S2?.forEach((id) => addWeights(cat, getOptionWeights('S2', id), 1));
}

// S3: 양자택일 4쌍 — 새 카테고리에 맞게 수정
function applyS3(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const pairs = answers.S3;
  if (!pairs || pairs.length !== 4) return;
  // [휴일 집/밖, 정보 글/영상, 결정 계획/즉흥, 스트레스 쉬기/활동]
  if (pairs[0] === 'A') {
    cat.readingHumanities += 15;
    cat.healingSpirituality += 10;
  } else {
    cat.sportsOutdoor += 25;
  }
  if (pairs[1] === 'A') {
    cat.readingHumanities += 20;
    cat.careerBusiness += 10;
  } else {
    cat.entertainmentVlog += 20;
  }
  if (pairs[2] === 'A') {
    cat.careerBusiness += 15;
    cat.financeInvest += 10;
  } else {
    cat.entertainmentVlog += 15;
  }
  if (pairs[3] === 'A') {
    cat.healingSpirituality += 15;
    cat.musicMood += 10;
  } else {
    cat.sportsOutdoor += 20;
  }
}

// S4: 무드보드 6개 중 2개
function applyS4(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S4?.forEach((id) => addWeights(cat, getOptionWeights('S4', id), 1));
}

// S5: 검색어 3개 → 키워드별 카테고리 매핑 (새 카테고리)
const S5_KEYWORD_MAP: Record<string, Partial<ChannelCategories>> = {
  '요리 레시피': { lifestyleSpace: 100 },
  '힐링 음악': { musicMood: 50, healingSpirituality: 50 },
  '재테크': { financeInvest: 80, careerBusiness: 20 },
  '게임 공략': { entertainmentVlog: 100 },
  '여행 vlog': { sportsOutdoor: 60, entertainmentVlog: 40 },
  '독서 정리': { readingHumanities: 100 },
  '운동 루틴': { sportsOutdoor: 100 },
  'IT 리뷰': { careerBusiness: 100 },
  '명상': { healingSpirituality: 100 },
  '예능 하이라이트': { entertainmentVlog: 100 },
};

function applyS5(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S5?.forEach((kw) => {
    const w = S5_KEYWORD_MAP[kw];
    if (w) addWeights(cat, w, 1);
  });
}

// S6: 슬라이더 3개 (0-100) → 집/밖, 글/영상, 계획/즉흥 (새 카테고리)
function applyS6(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const s = answers.S6;
  if (!s || s.length !== 3) return;
  const [homeOut, textVideo, planImpulse] = s;
  // homeOut: 낮으면 집(readingHumanities, healingSpirituality), 높으면 밖(sportsOutdoor)
  cat.readingHumanities += (100 - homeOut) * 0.15;
  cat.healingSpirituality += (100 - homeOut) * 0.1;
  cat.sportsOutdoor += homeOut * 0.2;
  // textVideo: 낮으면 글(readingHumanities), 높으면 영상(entertainmentVlog)
  cat.readingHumanities += (100 - textVideo) * 0.15;
  cat.careerBusiness += (100 - textVideo) * 0.1;
  cat.entertainmentVlog += textVideo * 0.2;
  // planImpulse: 낮으면 계획(careerBusiness, financeInvest), 높으면 즉흥(entertainmentVlog)
  cat.careerBusiness += (100 - planImpulse) * 0.1;
  cat.financeInvest += (100 - planImpulse) * 0.1;
  cat.entertainmentVlog += planImpulse * 0.15;
}

// S7: 단일 선택 3문항
function applyS7(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  answers.S7?.forEach((id) => addWeights(cat, getOptionWeights('S7', id), 1));
}

// S8: 상황 시나리오 3개 3지선다 — 새 카테고리
function applyS8(answers: Phase1SurveyAnswer, cat: ChannelCategories) {
  const sc = answers.S8;
  if (!sc || sc.length !== 3) return;
  // 시나리오1: 즉시 만남=entertainmentVlog/sportsOutdoor, 일정 확인=careerBusiness, 거절=readingHumanities/healingSpirituality
  if (sc[0] === 0) {
    cat.entertainmentVlog += 25;
    cat.sportsOutdoor += 15;
  } else if (sc[0] === 1) {
    cat.careerBusiness += 20;
    cat.financeInvest += 10;
  } else {
    cat.readingHumanities += 20;
    cat.healingSpirituality += 20;
  }
  // 시나리오2: 영상=entertainmentVlog, 글=readingHumanities, 체험=sportsOutdoor
  if (sc[1] === 0) cat.entertainmentVlog += 30;
  else if (sc[1] === 1) {
    cat.readingHumanities += 25;
    cat.careerBusiness += 10;
  } else {
    cat.sportsOutdoor += 35;
  }
  // 시나리오3: 운동/밖=sportsOutdoor, 영상/음악=entertainmentVlog/musicMood, 조용히=healingSpirituality/readingHumanities
  if (sc[2] === 0) {
    cat.sportsOutdoor += 35;
  } else if (sc[2] === 1) {
    cat.entertainmentVlog += 20;
    cat.musicMood += 20;
  } else {
    cat.healingSpirituality += 25;
    cat.readingHumanities += 15;
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
  applyS2Channels(answers, cat);
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
