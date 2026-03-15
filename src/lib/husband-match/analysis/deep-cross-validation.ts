/**
 * Phase 2 심층 교차검증 모듈 (v2 — 하이브리드 15문항)
 *
 * 기존 7차원 → 8차원으로 확장:
 * E/I, J/P, T/F, NS(자극추구), HA(위험회피), RD(연대감), CO(협동성), SD(자율성)
 *
 * + 성격 3층 구조(surface / conscious / unconscious)
 * + SCT 문장완성 기반 숨겨진 욕구 추론 (강화)
 * + 감정 청사진 (SCT 원문 활용)
 */

import type {
  TCIScores,
  MBTIScores,
  ChannelCategories,
  EnneagramCenter,
  ReportCard,
  DeepCrossValidation,
  CrossValidationDimension,
  PersonalityLayer,
  HiddenDesire,
  EmotionalBlueprint,
  CBTAnalysis,
  FivePartModel,
  CognitiveDistortion,
  IntermediateBelief,
  CoreBeliefCategory,
} from '../types';

// ── 입력 타입 ──

interface Phase1Data {
  tci_scores: TCIScores;
  mbti_scores: MBTIScores;
  mbti_type: string | null;
  enneagram_type: number | null;
  enneagram_center: EnneagramCenter;
  channel_categories: ChannelCategories;
  matched_husband_type: string;
  match_score: number;
  cards: ReportCard[];
  user_name?: string;
}

/** 18문항 서베이 응답 (스케일 5 + SCT 10 + CBT 3) */
interface SurveyResponses {
  // 스케일 (q1-q5)
  q1_together_time?: number;        // 1-10
  q2_anxiety_influence?: number;    // 1-10
  q3_logic_vs_emotion?: number;     // 1-10
  q4_independence?: number;         // 1-10
  q5_emotional_expression?: number; // 1-10

  // SCT — 관계 패턴 (q6-q8)
  q6_conflict_pattern?: string;
  q7_partner_distance?: string;
  q8_recurring_issue?: string;

  // SCT — 감정 처리 (q9-q11)
  q9_stress_response?: string;
  q10_body_signal?: string;         // 신체 반응 (기존 q10_anxiety_coping에서 변경)
  q11_comfort_source?: string;

  // SCT — 성장/두려움 (q12-q13)
  q12_deepest_fear?: string;
  q13_want_to_change?: string;

  // SCT — 이상형/욕구 (q14-q15)
  q14_ideal_day?: string;
  q15_core_desire?: string;

  // CBT 강화 (q16-q18)
  q16_hot_scenario?: string;        // Hot Thought 시나리오 응답
  q17_relationship_rules?: {        // 중간 신념 (규칙/가정)
    rules: string;
    positive_assumption: string;
    negative_assumption: string;
  };
  q18_core_belief_choice?: string;  // 핵심 신념 선택지
}

/** 설문 응답을 0-100 수치로 변환한 결과 (8차원 교차검증용) */
interface SurveyNumerics {
  extroversion: number;        // q1 → E/I
  harmAvoidance: number;       // q2 → HA (직접 측정!)
  thinkingVsFeeling: number;   // q3 → T/F
  selfDirectedness: number;    // q4 → SD (직접 측정!)
  emotionalExpression: number; // q5 → 감정 표현도
  conflictDirect: number;      // q6 (SCT 키워드 분석)
  rewardDependence: number;    // q1 + q5 조합 → RD
}

// ── 메인 함수 ──

/**
 * Phase 1 데이터와 설문 응답을 결합하여 8차원 심층 교차검증 수행
 */
export function buildDeepCrossValidation(
  phase1: Phase1Data,
  surveyResponses: SurveyResponses
): DeepCrossValidation {
  const surveyNumerics = mapSurveyToNumeric(surveyResponses);
  const dimensions = crossValidateAllDimensions(phase1, surveyNumerics);
  const hiddenDesires = inferHiddenDesires(
    dimensions,
    surveyResponses,
    phase1.tci_scores
  );
  const personalityLayers = buildPersonalityLayers(phase1, surveyNumerics, dimensions);
  const emotionalBlueprint = buildEmotionalBlueprint(phase1, surveyNumerics, surveyResponses);
  const authenticityScore = calculateAuthenticityScore(dimensions, surveyResponses);

  // CBT 분석 (q16/q17/q18이 있을 때만)
  const hasCbtData = surveyResponses.q16_hot_scenario || surveyResponses.q17_relationship_rules || surveyResponses.q18_core_belief_choice;
  const cbtAnalysis = hasCbtData
    ? buildCBTAnalysis(surveyResponses, phase1.tci_scores)
    : undefined;

  return {
    dimensions,
    hiddenDesires,
    personalityLayers,
    emotionalBlueprint,
    authenticityScore,
    cbtAnalysis,
  };
}

// ── 설문 → 수치 변환 ──

function mapSurveyToNumeric(survey: SurveyResponses): SurveyNumerics {
  // q1 → 외향성 (함께 시간 많이 = 외향적)
  const q1 = typeof survey.q1_together_time === 'number' ? survey.q1_together_time : 5;
  const extroversion = Math.round(((q1 - 1) / 9) * 100);

  // q2 → 위험회피 (불안 영향 클수록 HA 높음) — HA 직접 측정!
  const q2 = typeof survey.q2_anxiety_influence === 'number' ? survey.q2_anxiety_influence : 5;
  const harmAvoidance = Math.round(((q2 - 1) / 9) * 100);

  // q3 → T/F (높을수록 Thinking)
  const q3 = typeof survey.q3_logic_vs_emotion === 'number' ? survey.q3_logic_vs_emotion : 5;
  const thinkingVsFeeling = Math.round(((q3 - 1) / 9) * 100);

  // q4 → 자율성 (독립 영역 중요할수록 SD 높음) — SD 직접 측정!
  const q4 = typeof survey.q4_independence === 'number' ? survey.q4_independence : 5;
  const selfDirectedness = Math.round(((q4 - 1) / 9) * 100);

  // q5 → 감정 표현도
  const q5 = typeof survey.q5_emotional_expression === 'number' ? survey.q5_emotional_expression : 5;
  const emotionalExpression = Math.round(((q5 - 1) / 9) * 100);

  // q6 (SCT) → 갈등 대처 직접성 (키워드 분석)
  const conflictDirect = extractConflictDirectness(survey.q6_conflict_pattern);

  // RD(연대감): q1(관계 밀착도) + q5(감정 표현) 조합
  const rewardDependence = Math.round(extroversion * 0.4 + emotionalExpression * 0.6);

  return {
    extroversion,
    harmAvoidance,
    thinkingVsFeeling,
    selfDirectedness,
    emotionalExpression,
    conflictDirect,
    rewardDependence,
  };
}

/** q6 SCT 응답에서 갈등 대처 직접성 추출 (높을수록 직접 대면) */
function extractConflictDirectness(text?: string): number {
  if (!text || text.length < 2) return 50;
  const t = text.toLowerCase();

  // 직면적 키워드
  const directKeywords = ['말한다', '말해', '이야기', '대화', '풀어', '표현', '솔직', '바로', '직접', '물어'];
  // 회피적 키워드
  const avoidKeywords = ['피한다', '피해', '혼자', '참는다', '참아', '삭이', '기다', '시간', '거리', '회피', '조용', '침묵'];

  let score = 50;
  for (const kw of directKeywords) {
    if (t.includes(kw)) score += 8;
  }
  for (const kw of avoidKeywords) {
    if (t.includes(kw)) score -= 8;
  }

  return Math.max(0, Math.min(100, score));
}

// ── 8차원 교차검증 ──

function crossValidateAllDimensions(
  phase1: Phase1Data,
  survey: SurveyNumerics
): CrossValidationDimension[] {
  const mbti = phase1.mbti_scores ?? { E: 50, I: 50, T: 50, F: 50, J: 50, P: 50 };
  const tci = phase1.tci_scores;
  const dimensions: CrossValidationDimension[] = [];

  // 1) E/I (외향성)
  const youtubeE = mbti.E ?? 50;
  const surveyE = survey.extroversion;
  const eDiff = youtubeE - surveyE;
  dimensions.push({
    dimension: 'E/I (외향성)',
    youtube_value: Math.round(youtubeE),
    survey_value: Math.round(surveyE),
    diff: Math.round(eDiff),
    interpretation: Math.abs(eDiff) < 15
      ? 'YouTube 시청 패턴과 설문 응답이 일치합니다. 자기 인식이 정확한 영역이에요.'
      : eDiff > 0
        ? '온라인에서는 활발하게 소통하는 콘텐츠를 즐기지만, 실제 관계에서는 조용한 시간을 선호하시네요. 안전한 거리에서 연결감을 느끼고 싶은 마음이 엿보입니다.'
        : '평소에는 조용하게 지내시지만, 마음속으로는 더 깊은 유대감을 갈망하고 계세요. 겉으로 드러나지 않는 따뜻함이 있어요.',
  });

  // 2) T/F (사고 vs 감정)
  const youtubeT = mbti.T ?? 50;
  const surveyT = survey.thinkingVsFeeling;
  const tfDiff = youtubeT - surveyT;
  dimensions.push({
    dimension: 'T/F (사고 vs 감정)',
    youtube_value: Math.round(youtubeT),
    survey_value: Math.round(surveyT),
    diff: Math.round(tfDiff),
    interpretation: Math.abs(tfDiff) < 15
      ? '판단 방식이 일관적이에요. 자신의 결정 패턴을 잘 이해하고 계세요.'
      : tfDiff > 0
        ? '분석적인 콘텐츠를 즐기시지만, 중요한 순간에는 마음이 이끄는 대로 결정하시네요. "이성적인 사람"이라는 이미지 뒤에 부드러운 직관이 숨어 있어요.'
        : '감성적인 콘텐츠에 끌리시지만, 현실에서는 꽤 논리적인 판단을 하시는 분이에요. 감정을 느끼되 결정은 머리로 — 이 균형이 당신의 강점이에요.',
  });

  // 3) NS (자극추구) — 카테고리 다양성 vs planningPreference 역산
  const catValues = Object.values(phase1.channel_categories).filter(v => v > 0);
  const youtubeNS = tci.NS;
  // 설문에서의 자극추구: 독립성 높고 + 감정표현 높으면 NS 높은 경향
  const surveyNS = Math.round(
    (survey.selfDirectedness * 0.4 + (survey.extroversion > 60 ? 70 : 40) * 0.3 + (100 - survey.harmAvoidance) * 0.3)
  );
  const nsDiff = youtubeNS - surveyNS;
  dimensions.push({
    dimension: 'NS (자극추구)',
    youtube_value: Math.round(youtubeNS),
    survey_value: Math.round(surveyNS),
    diff: Math.round(nsDiff),
    interpretation: Math.abs(nsDiff) < 15
      ? `${catValues.length}개 카테고리에 걸친 다양한 관심사가 설문의 개방적 성향과 잘 맞아요.`
      : nsDiff > 0
        ? '다양한 콘텐츠를 탐색하시지만, 실제 삶에서는 안정된 루틴을 선호하시네요. 호기심은 화면 속에서 충족하고, 현실은 편안함을 지키는 전략이에요.'
        : '콘텐츠 취향은 비교적 안정적이지만, 마음속에는 새로운 경험에 대한 갈망이 있어요. 아직 시도하지 못한 모험이 기다리고 있을지도 몰라요.',
  });

  // 4) HA (위험회피) — 직접 대조!
  const youtubeHA = tci.HA;
  const surveyHA = survey.harmAvoidance; // q2에서 직접 측정
  const haDiff = youtubeHA - surveyHA;
  dimensions.push({
    dimension: 'HA (위험회피)',
    youtube_value: Math.round(youtubeHA),
    survey_value: Math.round(surveyHA),
    diff: Math.round(haDiff),
    interpretation: Math.abs(haDiff) < 15
      ? '불확실한 상황에 대한 태도가 일관적이에요. 자기 보호 방식을 잘 알고 계세요.'
      : haDiff > 0
        ? '온라인에서는 조심스러운 콘텐츠를 선호하시지만, 갈등 상황에서는 의외로 용감하게 부딪히시네요. 중요한 관계에서는 두려움을 넘는 힘이 있어요.'
        : '다양한 콘텐츠를 편하게 즐기시지만, 실제 갈등 앞에서는 조심스러워지시네요. 상처받을까 봐 한 발짝 물러서는 습관이 있을 수 있어요.',
  });

  // 5) RD (연대감) — tci.RD vs q1+q5 조합
  const youtubeRD = tci.RD;
  const surveyRD = survey.rewardDependence;
  const rdDiff = youtubeRD - surveyRD;
  dimensions.push({
    dimension: 'RD (연대감)',
    youtube_value: Math.round(youtubeRD),
    survey_value: Math.round(surveyRD),
    diff: Math.round(rdDiff),
    interpretation: Math.abs(rdDiff) < 15
      ? '타인과의 연결에 대한 욕구가 온라인과 오프라인에서 일관적이에요.'
      : rdDiff > 0
        ? '온라인에서는 사람들과의 연결을 즐기시지만, 실제로는 감정 표현에 조심스러운 편이에요. 진짜 마음을 보여줘도 괜찮다는 경험이 필요한 시점이에요.'
        : '겉으로는 독립적으로 보이시지만, 마음 깊은 곳에서는 누군가에게 인정받고 사랑받고 싶은 욕구가 강해요. 그 마음을 숨기지 않아도 돼요.',
  });

  // 6) CO (협동성) — tci.CO vs q4(독립성 반비례)
  const youtubeCO = tci.CO;
  // 독립성이 높을수록 CO가 낮은 경향 (역산)
  const surveyCO = Math.round(100 - survey.selfDirectedness * 0.6 - (100 - survey.extroversion) * 0.2);
  const coDiff = youtubeCO - Math.max(0, surveyCO);
  dimensions.push({
    dimension: 'CO (협동성)',
    youtube_value: Math.round(youtubeCO),
    survey_value: Math.max(0, Math.round(surveyCO)),
    diff: Math.round(coDiff),
    interpretation: Math.abs(coDiff) < 15
      ? '타인과의 조화에 대한 가치가 일관적이에요.'
      : coDiff > 0
        ? '콘텐츠에서는 협력과 조화를 중시하지만, 결혼 생활에서는 개인의 영역을 더 중요하게 생각하시네요. 함께하되 나를 잃지 않겠다는 건강한 경계예요.'
        : '평소에는 독립적인 편이지만, 결혼이라는 관계에서는 깊은 소통과 조화를 원하시네요. 진짜 가까운 사람에게만 보여주는 협력적인 면이 있어요.',
  });

  // 7) J/P (계획성) — mbti.J vs HA+SD 조합
  const youtubeJ = mbti.J ?? 50;
  // HA 높고 SD 높으면 계획적(J) 경향
  const surveyJ = Math.round(survey.harmAvoidance * 0.4 + survey.selfDirectedness * 0.4 + (100 - survey.emotionalExpression) * 0.2);
  const jDiff = youtubeJ - surveyJ;
  dimensions.push({
    dimension: 'J/P (계획성)',
    youtube_value: Math.round(youtubeJ),
    survey_value: Math.round(surveyJ),
    diff: Math.round(jDiff),
    interpretation: Math.abs(jDiff) < 15
      ? '콘텐츠 취향과 실제 계획 스타일이 일관적이에요.'
      : jDiff > 0
        ? '정보를 체계적으로 탐색하시지만, 실제 삶에서는 유연하게 흘러가는 걸 더 편안해하시네요. 머리는 계획하지만 마음은 자유를 원해요.'
        : '콘텐츠는 가볍게 즐기시지만, 관계와 미래에 대해서는 확실한 방향을 원하시는 분이에요. 삶의 중요한 영역일수록 단단해지는 성격이에요.',
  });

  // 8) SD (자율성) — 신규! tci.SD vs q4 직접 대조
  const youtubeSD = tci.SD;
  const surveySD = survey.selfDirectedness;
  const sdDiff = youtubeSD - surveySD;
  dimensions.push({
    dimension: 'SD (자율성)',
    youtube_value: Math.round(youtubeSD),
    survey_value: Math.round(surveySD),
    diff: Math.round(sdDiff),
    interpretation: Math.abs(sdDiff) < 15
      ? '자기 주도적인 성향이 온라인과 오프라인에서 일관적이에요. 자신의 기준이 뚜렷한 사람이에요.'
      : sdDiff > 0
        ? '콘텐츠에서는 자기 주도적인 모습이 보이지만, 관계에서는 상대와 함께 결정하고 싶은 마음이 있어요. 혼자 잘하는 것과 함께 잘하는 것 사이에서 균형을 찾고 있어요.'
        : '평소에는 주변에 맞추는 편이지만, 관계에서만큼은 자기만의 영역을 지키고 싶어요. 나를 잃지 않으려는 건강한 본능이에요.',
  });

  return dimensions;
}

// ── 숨겨진 욕구 추론 (SCT 강화) ──

function inferHiddenDesires(
  dimensions: CrossValidationDimension[],
  survey: SurveyResponses,
  tciScores?: TCIScores
): HiddenDesire[] {
  const desires: HiddenDesire[] = [];
  const tci = tciScores ?? { NS: 50, HA: 50, RD: 50, P: 50, SD: 50, CO: 50, ST: 50 };

  // 차원별 불일치에서 욕구 도출
  const dimMap = new Map(dimensions.map(d => [d.dimension, d]));

  const ei = dimMap.get('E/I (외향성)');
  const tf = dimMap.get('T/F (사고 vs 감정)');
  const ha = dimMap.get('HA (위험회피)');
  const rd = dimMap.get('RD (연대감)');
  const co = dimMap.get('CO (협동성)');
  const ns = dimMap.get('NS (자극추구)');
  const jp = dimMap.get('J/P (계획성)');
  const sd = dimMap.get('SD (자율성)');

  // 규칙 1: 외향↓ + 연대감↑ = 안전한 공간에서의 친밀감
  if (ei && rd && ei.diff < -15 && rd.diff > 15) {
    desires.push({
      label: '안전한 친밀감',
      description: '혼자 있는 시간을 좋아하지만, 마음을 놓을 수 있는 단 한 사람과의 깊은 연결을 갈망해요.',
      source: 'E/I 내향적 + RD 높은 연대감',
    });
  }

  // 규칙 2: 외향↑ + 연대감↓ = 인정받고 싶은 마음
  if (ei && rd && ei.diff > 15 && rd.diff < -15) {
    desires.push({
      label: '인정에 대한 갈증',
      description: '활발하게 소통하지만 진짜 마음을 보여주기는 두려워요. 있는 그대로를 받아들여 줄 사람을 기다리고 있어요.',
      source: 'E/I 외향적 + RD 낮은 연대감',
    });
  }

  // 규칙 3: 사고↑(YouTube) + 감정↑(설문) = 감정 표현 욕구 억압
  if (tf && tf.diff > 15) {
    desires.push({
      label: '감정 해방',
      description: '논리적으로 생각하는 것에 익숙하지만, 가끔은 이유 없이 울거나 웃어도 괜찮다는 허락이 필요해요.',
      source: 'T/F 불일치 (이성적 외면 vs 감성적 내면)',
    });
  }

  // 규칙 4: 위험회피↑(YouTube) + 불안 낮음(설문) = 용기에 대한 갈망
  if (ha && ha.diff > 20) {
    desires.push({
      label: '두려움을 넘는 용기',
      description: '변화가 두렵지만 그래도 부딪혀야 한다는 것을 알아요. 함께 두려워해 줄 사람이 있다면 한 걸음 나갈 수 있어요.',
      source: 'HA 높은 위험회피(YouTube) + 낮은 불안 영향(설문)',
    });
  }

  // 규칙 5: 위험회피↓(YouTube) + 불안 높음(설문) = 안전 기지 욕구
  if (ha && ha.diff < -20) {
    desires.push({
      label: '안전 기지',
      description: '모험을 즐기는 것처럼 보이지만, 갈등 앞에서는 움츠러들어요. 돌아갈 수 있는 따뜻한 곳이 필요해요.',
      source: 'HA 낮은 위험회피(YouTube) + 높은 불안 영향(설문)',
    });
  }

  // 규칙 6: 협동성↓(YouTube) + 연대감↑(설문) = 진짜 소통 갈망
  if (co && co.diff < -20) {
    desires.push({
      label: '진짜 대화',
      description: '혼자서도 잘 지낼 수 있지만, 마음을 꺼내놓을 수 있는 깊은 대화가 그리워요.',
      source: 'CO 독립적(YouTube) + 소통 지향(설문)',
    });
  }

  // 규칙 7: 자극추구↑ + 계획성↑(설문) = 통제된 모험
  if (ns && jp && ns.diff > 15 && jp.survey_value > 65) {
    desires.push({
      label: '계획된 일탈',
      description: '새로운 경험을 원하지만 완전한 미지는 두려워요. 안전한 틀 안에서의 작은 모험이 행복을 가져다 줘요.',
      source: 'NS 높은 자극추구 + J 높은 계획성',
    });
  }

  // 규칙 8: TCI ST(자기초월) 높은데 외향 낮음 = 영적 연결 욕구
  if (tci.ST > 65 && ei && ei.survey_value < 40) {
    desires.push({
      label: '영혼의 동반자',
      description: '말하지 않아도 통하는 깊은 수준의 연결을 원해요. 겉으로 떠들기보다 조용히 마음이 닿는 관계를 꿈꿔요.',
      source: 'ST 높은 자기초월 + 내향적 성향',
    });
  }

  // 규칙 9 (신규): SD 불일치 — 자율성과 친밀감의 갈등
  if (sd && Math.abs(sd.diff) > 20) {
    if (sd.diff > 0) {
      desires.push({
        label: '의존해도 괜찮아',
        description: '독립적으로 살아왔지만, 가끔은 기대고 싶은 마음이 있어요. 약한 모습을 보여도 떠나지 않을 사람이 필요해요.',
        source: 'SD 높은 자율성(YouTube) + 관계 의존 욕구(설문)',
      });
    } else {
      desires.push({
        label: '나를 잃지 않는 사랑',
        description: '사랑하면서도 나를 지키고 싶어요. 둘이 되어도 하나가 되지 않는 관계가 이상이에요.',
        source: 'SD 낮은 자율성(YouTube) + 독립 욕구(설문)',
      });
    }
  }

  // ── SCT 텍스트 기반 욕구 추론 ──

  // q7 "연인이 멀어지면..." → 부착 불안 욕구
  if (survey.q7_partner_distance && survey.q7_partner_distance.length > 5) {
    const q7 = survey.q7_partner_distance.toLowerCase();
    if (q7.includes('불안') || q7.includes('무서') || q7.includes('걱정') || q7.includes('매달') || q7.includes('연락')) {
      desires.push({
        label: '떠나지 않을 거라는 확신',
        description: '가까운 사람이 멀어질까 봐 불안해하는 마음이 있어요. "나는 여기 있을게"라는 한마디가 가장 큰 위로예요.',
        source: 'q7 "연인이 멀어지면" SCT — 불안/매달림 키워드',
      });
    }
    if (q7.includes('놓아') || q7.includes('보내') || q7.includes('괜찮') || q7.includes('거리')) {
      desires.push({
        label: '건강한 거리두기',
        description: '사랑하지만 집착하지 않으려 해요. 서로의 공간을 존중하면서도 연결되어 있는 관계를 원해요.',
        source: 'q7 "연인이 멀어지면" SCT — 거리두기/수용 키워드',
      });
    }
  }

  // q9 "스트레스 받으면..." → 회복 욕구
  if (survey.q9_stress_response && survey.q9_stress_response.length > 5) {
    const q9 = survey.q9_stress_response.toLowerCase();
    if (q9.includes('혼자') || q9.includes('방') || q9.includes('잠') || q9.includes('쉬')) {
      if (!desires.find(d => d.label === '안전한 친밀감')) {
        desires.push({
          label: '나만의 충전 공간',
          description: '지칠 때 아무 말 없이 쉴 수 있는 공간이 필요해요. 그 공간을 이해해 주는 파트너가 최고의 파트너예요.',
          source: 'q9 "스트레스 반응" SCT — 혼자/쉼 키워드',
        });
      }
    }
    if (q9.includes('먹') || q9.includes('사') || q9.includes('쇼핑') || q9.includes('영상') || q9.includes('유튜브')) {
      desires.push({
        label: '즉각적 위안',
        description: '스트레스를 빠르게 해소하고 싶은 마음이 강해요. 함께 맛있는 것을 먹거나, 의미 없는 시간을 보내는 것도 충분한 회복이에요.',
        source: 'q9 "스트레스 반응" SCT — 소비/감각 키워드',
      });
    }
  }

  // q12 "가장 두려운 것..." → 핵심 두려움 기반 욕구
  if (survey.q12_deepest_fear && survey.q12_deepest_fear.length > 5) {
    const q12 = survey.q12_deepest_fear.toLowerCase();
    if (q12.includes('자유') || q12.includes('나 자신') || q12.includes('잃')) {
      if (!desires.find(d => d.label === '나를 잃지 않는 사랑')) {
        desires.push({
          label: '나를 잃지 않는 사랑',
          description: '사랑하면서도 나를 지키고 싶어요. 둘이 되어도 하나가 되지 않는 관계가 이상이에요.',
          source: 'q12 "핵심 두려움" SCT — 자유/자신을 잃을까',
        });
      }
    }
    if (q12.includes('경제') || q12.includes('돈') || q12.includes('현실')) {
      desires.push({
        label: '현실과 낭만의 균형',
        description: '사랑만으로는 부족하다는 것을 알지만, 그래도 사랑 없이는 살 수 없어요. 현실적이면서 로맨틱한 균형을 찾고 있어요.',
        source: 'q12 "핵심 두려움" SCT — 경제/현실',
      });
    }
    if (q12.includes('불안') || q12.includes('두려') || q12.includes('걱정') || q12.includes('무서')) {
      desires.push({
        label: '안심할 수 있는 내일',
        description: '미래에 대한 불안이 마음의 많은 부분을 차지하고 있어요. 함께라면 괜찮을 거라는 확신을 줄 수 있는 사람이 필요해요.',
        source: `q12 "핵심 두려움" SCT — 불안/두려움 + HA=${Math.round(tci.HA)}`,
      });
    }
    if (q12.includes('외로') || q12.includes('혼자') || q12.includes('버림')) {
      desires.push({
        label: '끝까지 함께하는 사람',
        description: '혼자 남겨질까 봐 두려운 마음이 있어요. "끝까지 함께할게"라는 약속이 가장 소중한 선물이에요.',
        source: 'q12 "핵심 두려움" SCT — 외로움/버림받을 두려움',
      });
    }
  }

  // q13 "바꾸고 싶은 것..." → 성장 욕구
  if (survey.q13_want_to_change && survey.q13_want_to_change.length > 5) {
    const q13 = survey.q13_want_to_change.toLowerCase();
    if (q13.includes('표현') || q13.includes('말하') || q13.includes('소통')) {
      desires.push({
        label: '솔직한 표현',
        description: '마음을 말로 표현하는 것이 어렵지만, 그래도 전하고 싶은 마음이 있어요. 서투른 표현도 알아봐 주는 사람이 필요해요.',
        source: 'q13 "바꾸고 싶은 것" SCT — 표현/소통 키워드',
      });
    }
    if (q13.includes('화') || q13.includes('분노') || q13.includes('참') || q13.includes('폭발')) {
      desires.push({
        label: '감정의 안전한 분출구',
        description: '참다가 폭발하는 패턴을 알고 있지만 쉽게 바뀌지 않아요. 작은 감정도 안전하게 꺼낼 수 있는 관계가 돼야 해요.',
        source: 'q13 "바꾸고 싶은 것" SCT — 분노/참기 키워드',
      });
    }
  }

  // q15 "진짜 원하는 관계..." → 핵심 욕구 직접 추출
  if (survey.q15_core_desire && survey.q15_core_desire.length > 3) {
    const q15 = survey.q15_core_desire.toLowerCase();
    if (q15.includes('편안') || q15.includes('안정') || q15.includes('든든')) {
      if (!desires.find(d => d.label.includes('안전') || d.label.includes('안정') || d.label.includes('신뢰'))) {
        desires.push({
          label: '흔들리지 않는 신뢰',
          description: '불안한 세상에서 한 사람만은 변하지 않기를 바라요. 믿을 수 있다는 확신이 사랑보다 먼저예요.',
          source: 'q15 "핵심 욕구" SCT — 편안함/안정 키워드',
        });
      }
    }
    if (q15.includes('성장') || q15.includes('발전') || q15.includes('함께')) {
      if (!desires.find(d => d.label.includes('성장'))) {
        desires.push({
          label: '함께하는 성장',
          description: '지금의 나보다 더 나은 내가 되고 싶고, 그 여정을 함께할 사람이 있다면 더 힘이 날 거예요.',
          source: 'q15 "핵심 욕구" SCT — 성장/함께 키워드',
        });
      }
    }
    if (q15.includes('통하') || q15.includes('이해') || q15.includes('교감')) {
      if (!desires.find(d => d.label.includes('대화') || d.label.includes('연결'))) {
        desires.push({
          label: '말 없이도 통하는 교감',
          description: '설명하지 않아도 알아봐 주는 사람. 그런 깊은 이해가 당신이 원하는 관계의 본질이에요.',
          source: 'q15 "핵심 욕구" SCT — 소통/이해 키워드',
        });
      }
    }
  }

  // q14 "이상적인 하루..." → 이상형 구체적 장면 기반 욕구
  if (survey.q14_ideal_day && survey.q14_ideal_day.length > 5) {
    const q14 = survey.q14_ideal_day.toLowerCase();
    if (q14.includes('웃') || q14.includes('유머') || q14.includes('재미') || q14.includes('장난')) {
      desires.push({
        label: '가벼운 행복',
        description: '일상의 작은 웃음이 큰 힘이 돼요. 무거운 대화만큼이나, 같이 웃을 수 있는 순간이 소중해요.',
        source: 'q14 "이상적인 하루" SCT — 웃음/유머 키워드',
      });
    }
    if (q14.includes('여행') || q14.includes('산책') || q14.includes('밖') || q14.includes('카페')) {
      if (!desires.find(d => d.label.includes('모험') || d.label.includes('일탈'))) {
        desires.push({
          label: '일상 속 작은 모험',
          description: '거창한 여행이 아니어도 괜찮아요. 함께 새로운 카페를 찾거나 산책하는 것만으로도 행복한 사람이에요.',
          source: 'q14 "이상적인 하루" SCT — 외출/여행 키워드',
        });
      }
    }
  }

  // ── q16 Hot Thought 기반 욕구 추론 ──
  if (survey.q16_hot_scenario && survey.q16_hot_scenario.length > 3) {
    const q16 = survey.q16_hot_scenario.toLowerCase();
    if (q16.includes('헤어') || q16.includes('끝') || q16.includes('떠나')) {
      if (!desires.find(d => d.label.includes('떠나지') || d.label.includes('함께'))) {
        desires.push({
          label: '관계의 지속에 대한 확신',
          description: '갈등 상황에서 가장 먼저 "이별"을 떠올리는 마음 뒤에는, 이 관계가 끊어지지 않을 거라는 확신을 간절히 원하는 욕구가 있어요.',
          source: 'q16 Hot Thought — 이별/끝 키워드',
        });
      }
    }
    if (q16.includes('잘못') || q16.includes('탓') || q16.includes('실수') || q16.includes('미안')) {
      desires.push({
        label: '조건 없는 수용',
        description: '무언가 잘못되면 자신의 탓이라고 느끼는 패턴이 있어요. 실수해도 괜찮다고 안아줄 수 있는 관계를 원해요.',
        source: 'q16 Hot Thought — 자기비난 키워드',
      });
    }
    if (q16.includes('비밀') || q16.includes('다른 사람') || q16.includes('바람')) {
      desires.push({
        label: '투명한 신뢰',
        description: '모호한 상황에서 불신이 먼저 떠오르는 마음은 그만큼 진실한 관계를 원한다는 뜻이에요.',
        source: 'q16 Hot Thought — 불신 키워드',
      });
    }
  }

  // ── q18 핵심 신념 선택 기반 욕구 추론 ──
  if (survey.q18_core_belief_choice) {
    const q18 = survey.q18_core_belief_choice;
    if (q18.includes('사랑받을 자격') && !desires.find(d => d.label.includes('자격') || d.label.includes('수용'))) {
      desires.push({
        label: '존재 자체로 충분하다는 확인',
        description: '조건 없이, 있는 그대로의 나를 사랑해 줄 수 있는 사람을 찾고 있어요.',
        source: 'q18 핵심 신념 — self_worth 선택',
      });
    }
    if (q18.includes('떠난다') && !desires.find(d => d.label.includes('떠나지') || d.label.includes('함께'))) {
      desires.push({
        label: '끝까지 곁에 있겠다는 약속',
        description: '사람들이 결국 떠날 거라는 믿음 뒤에, "이번에는 다르다"는 경험을 갈망하고 있어요.',
        source: 'q18 핵심 신념 — abandonment 선택',
      });
    }
    if (q18.includes('안전하지') && !desires.find(d => d.label.includes('안전') || d.label.includes('안심'))) {
      desires.push({
        label: '세상 속 안전한 울타리',
        description: '세상이 위험하다고 느끼는 마음은 그만큼 안전한 관계를 간절히 원한다는 뜻이에요.',
        source: 'q18 핵심 신념 — safety 선택',
      });
    }
    if (q18.includes('완벽하지 않으면') && !desires.find(d => d.label.includes('수용') || d.label.includes('조건'))) {
      desires.push({
        label: '불완전해도 사랑받는 경험',
        description: '완벽해야 사랑받을 수 있다는 믿음을 깨줄 수 있는, 실수해도 괜찮은 관계가 필요해요.',
        source: 'q18 핵심 신념 — conditional_worth 선택',
      });
    }
    if (q18.includes('혼자서는') && !desires.find(d => d.label.includes('의존') || d.label.includes('기대'))) {
      desires.push({
        label: '함께이면서 나다운 관계',
        description: '혼자서는 못 한다는 마음과 독립하고 싶은 마음이 공존해요. 기대도 하고, 나답기도 할 수 있는 관계를 원해요.',
        source: 'q18 핵심 신념 — helplessness 선택',
      });
    }
  }

  // 최소 3개 보장
  if (desires.length < 3) {
    if (!desires.find(d => d.label.includes('연결'))) {
      desires.push({
        label: '의미 있는 연결',
        description: '많은 사람과의 넓은 관계보다, 진짜 나를 이해해 주는 한두 명과의 깊은 관계가 더 중요해요.',
        source: '기본 욕구 패턴',
      });
    }
    if (desires.length < 3 && !desires.find(d => d.label.includes('성장'))) {
      desires.push({
        label: '함께하는 성장',
        description: '지금의 나보다 더 나은 내가 되고 싶고, 그 여정을 함께할 사람이 있다면 더 힘이 날 거예요.',
        source: '기본 욕구 패턴',
      });
    }
  }

  return desires;
}

// ── 성격 3층 구조 ──

function buildPersonalityLayers(
  phase1: Phase1Data,
  survey: SurveyNumerics,
  dimensions: CrossValidationDimension[]
): PersonalityLayer {
  const tci = phase1.tci_scores;
  const cats = phase1.channel_categories;

  // Surface: YouTube 기반 겉모습
  const topCategories = Object.entries(cats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([key]) => key);

  const surfaceTraits: string[] = [];
  if (tci.NS > 60) surfaceTraits.push('새로운 것에 호기심이 많고');
  if (tci.HA > 60) surfaceTraits.push('신중하고 조심스러운 편이며');
  if (tci.RD > 60) surfaceTraits.push('사람들과의 교류를 즐기고');
  if (tci.SD > 60) surfaceTraits.push('자기 주도적으로 살아가며');
  if (tci.CO > 60) surfaceTraits.push('주변과의 조화를 중시하고');
  if (tci.ST > 60) surfaceTraits.push('삶의 깊은 의미를 탐구하며');
  if (surfaceTraits.length === 0) surfaceTraits.push('균형 잡힌 성향을 보이며');

  const surface = `YouTube에서 드러나는 당신은 ${surfaceTraits.join(', ')} ${topCategories.length}개 이상의 관심 영역을 넘나드는 사람이에요.`;

  // Conscious: 설문 기반 의식적 욕구
  const consciousTraits: string[] = [];
  if (survey.extroversion > 60) consciousTraits.push('활발한 소통을 원하고');
  else if (survey.extroversion < 40) consciousTraits.push('조용한 관계를 선호하고');
  if (survey.thinkingVsFeeling > 60) consciousTraits.push('논리적으로 판단하며');
  else if (survey.thinkingVsFeeling < 40) consciousTraits.push('감정을 따라 결정하며');
  if (survey.selfDirectedness > 60) consciousTraits.push('관계에서도 나만의 영역을 중시하고');
  else if (survey.selfDirectedness < 40) consciousTraits.push('모든 것을 함께 나누고 싶어하며');
  if (survey.harmAvoidance > 60) consciousTraits.push('중요한 결정에서 신중한 편이에요');
  else if (survey.harmAvoidance < 40) consciousTraits.push('걱정보다 행동이 먼저인 편이에요');

  if (consciousTraits.length === 0) consciousTraits.push('균형 잡힌 관계관을 가지고 있어요');

  const conscious = `설문에서 드러나는 당신은 ${consciousTraits.join(', ')}.`;

  // Unconscious: 불일치에서 도출
  const bigDiscrepancies = dimensions.filter(d => Math.abs(d.diff) >= 20);
  let unconscious: string;
  if (bigDiscrepancies.length === 0) {
    unconscious = '겉과 속이 대체로 일치하는 편이에요. 자기 이해도가 높고, 있는 그대로의 자신에게 편안한 사람이에요.';
  } else {
    const discrepancyLabels = bigDiscrepancies.map(d => d.dimension.split(' ')[0]).join(', ');
    unconscious = `${discrepancyLabels} 영역에서 겉과 속의 차이가 발견돼요. 이 차이는 약점이 아니라, 아직 충분히 탐색하지 못한 내면의 가능성이에요. 자신도 몰랐던 욕구와 잠재력이 숨어 있는 곳이에요.`;
  }

  return { surface, conscious, unconscious };
}

// ── 감정 청사진 (SCT 원문 활용) ──

function buildEmotionalBlueprint(
  phase1: Phase1Data,
  survey: SurveyNumerics,
  responses: SurveyResponses
): EmotionalBlueprint {
  const tci = phase1.tci_scores;

  // 스트레스 반응 — q9 SCT 원문이 있으면 우선 사용
  let stressResponse: string;
  if (responses.q9_stress_response && responses.q9_stress_response.length > 5) {
    stressResponse = `본인이 말한 스트레스 반응: "${responses.q9_stress_response}" — `;
    if (tci.HA > 65) {
      stressResponse += '위험회피 성향이 높아서 스트레스 상황을 더 예민하게 느끼는 편이에요.';
    } else if (tci.NS > 65) {
      stressResponse += '새로운 자극으로 기분을 전환하려는 경향이 있어요.';
    } else {
      stressResponse += '나름의 방식으로 안정을 찾아가는 사람이에요.';
    }
  } else if (tci.HA > 65 && survey.conflictDirect < 40) {
    stressResponse = '마음을 닫고 혼자 삭이는 경향이 있어요. 안전하다고 느낄 때까지 벽을 세워요.';
  } else if (tci.HA > 65 && survey.conflictDirect >= 40) {
    stressResponse = '불안하지만 용기를 내서 말하는 편이에요. 다만 그 이후에 혼자 후회하거나 걱정이 많아질 수 있어요.';
  } else if (tci.NS > 65) {
    stressResponse = '새로운 자극으로 기분을 전환하려 해요. 여행, 쇼핑, 새로운 취미로 회피하기도 해요.';
  } else {
    stressResponse = '비교적 안정적으로 대처하지만, 내면의 감정을 충분히 표현하지 못할 수 있어요.';
  }

  // 회복 방식 — q11 SCT 원문이 있으면 우선 사용
  let healingPattern: string;
  if (responses.q11_comfort_source && responses.q11_comfort_source.length > 5) {
    healingPattern = `본인이 말한 위안의 원천: "${responses.q11_comfort_source}" — `;
    if (survey.extroversion > 60) {
      healingPattern += '가까운 사람과의 교류에서 에너지를 충전하는 편이에요.';
    } else {
      healingPattern += '자신만의 방식으로 회복하는 시간이 필요한 사람이에요.';
    }
  } else if (survey.extroversion > 60 && tci.RD > 60) {
    healingPattern = '가까운 사람과의 대화와 공감으로 회복해요. 함께 있는 것만으로 위안을 받아요.';
  } else if (survey.extroversion < 40) {
    healingPattern = '혼자만의 시간과 공간이 필요해요. 좋아하는 콘텐츠나 취미에 빠지면서 에너지를 충전해요.';
  } else {
    healingPattern = '상황에 따라 사람을 찾기도 하고, 혼자 시간을 보내기도 해요. 유연하게 회복하는 편이에요.';
  }

  // 갈등 스타일 — q6 SCT 원문 + q10 감정 대처 활용
  let conflictStyle: string;
  if (responses.q6_conflict_pattern && responses.q6_conflict_pattern.length > 5) {
    const q6 = responses.q6_conflict_pattern;
    const directness = survey.conflictDirect;
    if (directness >= 65) {
      conflictStyle = `직면형 — "${q6}" 문제가 생기면 바로 이야기하는 편이에요. 다만 상대가 준비되지 않았을 때 밀어붙이는 경향이 있을 수 있어요.`;
    } else if (directness >= 35) {
      conflictStyle = `숙고형 — "${q6}" 감정을 정리한 후 대화하는 편이에요. 상대에게는 회피로 느껴질 수 있으니, "지금은 시간이 필요해"라고 말해주면 좋아요.`;
    } else {
      conflictStyle = `회피형 — "${q6}" 시간이 해결해 주길 바라는 편이에요. 중요한 문제는 회피하면 오히려 커질 수 있으니, 작을 때 이야기하는 연습이 도움돼요.`;
    }
  } else {
    conflictStyle = '상황에 따라 다른 방식을 사용해요.';
  }

  return {
    stressResponse,
    healingPattern,
    emotionalExpression: survey.emotionalExpression,
    conflictStyle,
  };
}

// ── 자기일치도 계산 ──

function calculateAuthenticityScore(
  dimensions: CrossValidationDimension[],
  survey: SurveyResponses
): number {
  // 8차원 불일치의 평균으로 기본 점수 산출
  const avgAbsDiff = dimensions.reduce((sum, d) => sum + Math.abs(d.diff), 0) / dimensions.length;

  // 차이가 작을수록 높은 점수 (0~1)
  let score = Math.max(0, 1 - avgAbsDiff / 60);

  // SCT 응답의 풍부함은 자기 성찰력의 증거 → 보너스
  const sctFields = [
    survey.q6_conflict_pattern,
    survey.q7_partner_distance,
    survey.q8_recurring_issue,
    survey.q9_stress_response,
    survey.q10_body_signal,
    survey.q11_comfort_source,
    survey.q12_deepest_fear,
    survey.q13_want_to_change,
    survey.q14_ideal_day,
    survey.q15_core_desire,
    survey.q16_hot_scenario,
  ];

  let richAnswers = 0;
  let veryRichAnswers = 0;
  for (const text of sctFields) {
    if (text && text.length > 20) richAnswers++;
    if (text && text.length > 50) veryRichAnswers++;
  }

  // 풍부한 답변 비율에 따른 보너스 (최대 +0.1)
  score = Math.min(1, score + richAnswers * 0.01);
  score = Math.min(1, score + veryRichAnswers * 0.005);

  return Math.round(score * 100) / 100;
}

// ══════════════════════════════════════════
// CBT 분석 함수 (Mind Over Mood 2판 기반)
// ══════════════════════════════════════════

/**
 * CBT 분석 통합 함수 — 5개 하위 함수를 조합
 */
function buildCBTAnalysis(
  survey: SurveyResponses,
  tciScores: TCIScores
): CBTAnalysis {
  const fivePartModel = analyzeFivePartModel(survey, tciScores);
  const cognitiveDistortions = identifyCognitiveDistortions(survey);
  const intermediateBelief = analyzeIntermediateBelief(survey);
  const coreBelief = classifyCoreBeliefFromChoice(survey);
  const thoughtChain = buildThoughtChain(fivePartModel, cognitiveDistortions, intermediateBelief, coreBelief);

  return {
    fivePartModel,
    cognitiveDistortions,
    intermediateBelief,
    coreBelief,
    thoughtChain,
  };
}

/**
 * 1) 5-Part Model 조립
 * 상황(q16 시나리오) → 자동사고(q16 응답) → 감정(q5+q12) → 신체(q10) → 행동(q9+q6)
 */
function analyzeFivePartModel(
  survey: SurveyResponses,
  tciScores: TCIScores
): FivePartModel {
  // 상황: q16의 시나리오 고정
  const situation = '연인이 "우리 관계에 대해 진지하게 이야기하자"라고 말한 상황';

  // 자동사고: q16 Hot Thought
  const automaticThought = survey.q16_hot_scenario || '(응답 없음)';

  // 감정: q5(감정 표현도) + q12(두려움)에서 추론
  const q5 = typeof survey.q5_emotional_expression === 'number' ? survey.q5_emotional_expression : 5;
  const fearText = survey.q12_deepest_fear || '';
  let emotion: string;
  if (tciScores.HA > 65 || fearText.includes('불안') || fearText.includes('두려')) {
    emotion = '불안과 두려움이 주된 감정';
  } else if (q5 <= 3) {
    emotion = '감정을 억누르는 편이지만 내면에 긴장감이 있음';
  } else if (q5 >= 8) {
    emotion = '감정이 강하게 올라오며 즉각적으로 느낌';
  } else {
    emotion = '복합적인 감정 — 걱정과 기대가 섞임';
  }

  // 신체 반응: q10 (변경된 신체 반응 질문)
  const physicalReaction = survey.q10_body_signal || '(구체적 신체 반응 미응답)';

  // 행동: q9(스트레스 반응) + q6(갈등 패턴) 조합
  const parts: string[] = [];
  if (survey.q9_stress_response) parts.push(survey.q9_stress_response);
  if (survey.q6_conflict_pattern) parts.push(survey.q6_conflict_pattern);
  const behavior = parts.length > 0 ? parts.join(' / ') : '(행동 패턴 미응답)';

  return { situation, automaticThought, emotion, physicalReaction, behavior };
}

/**
 * 2) 인지 왜곡 식별
 * q16(Hot Thought), q8(반복 문제), q13(바꾸고 싶은 것)에서 키워드 기반 탐지
 */
function identifyCognitiveDistortions(survey: SurveyResponses): CognitiveDistortion[] {
  const distortions: CognitiveDistortion[] = [];

  const sources = [
    { text: survey.q16_hot_scenario, label: 'q16 Hot Thought' },
    { text: survey.q8_recurring_issue, label: 'q8 반복 문제' },
    { text: survey.q13_want_to_change, label: 'q13 바꾸고 싶은 것' },
  ];

  for (const { text, label } of sources) {
    if (!text || text.length < 3) continue;
    const t = text.toLowerCase();

    // 파국화: 최악의 시나리오로 점프
    if (t.includes('끝') || t.includes('최악') || t.includes('다 망') || t.includes('헤어') || t.includes('절대')) {
      distortions.push({
        type: 'catastrophizing',
        label: '파국화',
        evidence: text,
        relationshipImpact: '작은 갈등도 관계의 끝으로 연결지어 느끼는 경향이 있어요. 감정이 실제보다 더 크게 느껴질 수 있어요.',
      });
    }

    // 독심술: 상대 마음을 단정
    if (t.includes('분명') || t.includes('틀림없') || t.includes('아마') || t.includes('~겠지') || t.includes('싫어') || t.includes('지겨')) {
      distortions.push({
        type: 'mind_reading',
        label: '독심술',
        evidence: text,
        relationshipImpact: '상대의 마음을 확인하기 전에 단정짓는 경향이 있어요. 확인 대신 추측이 관계를 복잡하게 만들 수 있어요.',
      });
    }

    // 자기비난: 모든 것을 자기 탓으로
    if (t.includes('내 탓') || t.includes('잘못') || t.includes('부족') || t.includes('미안') || t.includes('못해')) {
      distortions.push({
        type: 'personalization',
        label: '개인화(자기비난)',
        evidence: text,
        relationshipImpact: '관계의 문제를 모두 자신의 탓으로 돌리는 경향이 있어요. 상대도 책임이 있을 수 있다는 점을 잊지 마세요.',
      });
    }

    // 감정적 추론: 느낌 = 사실
    if (t.includes('느낌') || t.includes('기분이') || t.includes('느껴') || t.includes('분위기')) {
      distortions.push({
        type: 'emotional_reasoning',
        label: '감정적 추론',
        evidence: text,
        relationshipImpact: '"그렇게 느껴지니까 사실이야"라고 생각하는 패턴이 있어요. 감정과 사실을 분리하는 연습이 도움돼요.',
      });
    }

    // 흑백논리: 전부 아니면 전무
    if (t.includes('항상') || t.includes('절대') || t.includes('전혀') || t.includes('맨날') || t.includes('한 번도')) {
      distortions.push({
        type: 'all_or_nothing',
        label: '흑백논리',
        evidence: text,
        relationshipImpact: '"항상 이래" "절대 안 변해" 같은 표현이 갈등을 키울 수 있어요. 회색 영역을 인정하면 관계가 유연해져요.',
      });
    }

    // 당위적 사고: ~해야 한다
    if (t.includes('해야') || t.includes('되어야') || t.includes('마땅') || t.includes('당연')) {
      distortions.push({
        type: 'should_statements',
        label: '당위적 사고',
        evidence: text,
        relationshipImpact: '"이래야 해"라는 규칙이 많을수록 실망도 커져요. 기대를 "바람"으로 바꾸면 마음이 편해져요.',
      });
    }
  }

  // 중복 type 제거 (같은 왜곡이 여러 소스에서 발견될 수 있음)
  const seen = new Set<string>();
  return distortions.filter(d => {
    if (seen.has(d.type)) return false;
    seen.add(d.type);
    return true;
  });
}

/**
 * 3) 중간 신념 분석
 * q17의 3개 하위 응답(규칙/긍정가정/부정가정)을 파싱하고 관통 주제 추론
 */
function analyzeIntermediateBelief(survey: SurveyResponses): IntermediateBelief {
  const q17 = survey.q17_relationship_rules;
  const rules = q17?.rules || '(미응답)';
  const positiveAssumption = q17?.positive_assumption || '(미응답)';
  const negativeAssumption = q17?.negative_assumption || '(미응답)';

  // 관통 주제 추론 — 3개 응답의 공통 키워드 분석
  const allText = `${rules} ${positiveAssumption} ${negativeAssumption}`.toLowerCase();

  let theme: string;
  if (allText.includes('존중') || allText.includes('배려') || allText.includes('이해')) {
    theme = '상호 존중과 이해를 관계의 기본 토대로 여기고 있어요';
  } else if (allText.includes('솔직') || allText.includes('말') || allText.includes('표현') || allText.includes('소통')) {
    theme = '솔직한 소통이 관계에서 가장 중요한 가치예요';
  } else if (allText.includes('함께') || allText.includes('곁') || allText.includes('같이')) {
    theme = '함께하는 시간과 동행이 사랑의 핵심이에요';
  } else if (allText.includes('약한') || allText.includes('힘들') || allText.includes('울') || allText.includes('의지')) {
    theme = '취약함을 보여도 안전한 관계를 깊이 원하고 있어요';
  } else if (allText.includes('믿') || allText.includes('신뢰') || allText.includes('변하지')) {
    theme = '변하지 않는 신뢰가 관계의 가장 중요한 기둥이에요';
  } else if (allText.includes('자유') || allText.includes('공간') || allText.includes('개인')) {
    theme = '사랑 안에서도 개인의 자유와 공간을 중시해요';
  } else {
    theme = '자신만의 관계 규칙이 아직 선명히 정리되지 않았을 수 있어요 — 탐색 중인 것도 의미 있어요';
  }

  return { rules, positiveAssumption, negativeAssumption, theme };
}

/**
 * 4) 핵심 신념 분류 (하향 화살표)
 * q18 선택지 → 카테고리 매핑 + q12/q15/q17에서 수렴 증거
 */
function classifyCoreBeliefFromChoice(survey: SurveyResponses): CoreBeliefCategory {
  const q18 = survey.q18_core_belief_choice || '';

  // 선택지 → 카테고리 매핑
  const optionMap: Record<string, { category: CoreBeliefCategory['category']; label: string }> = {
    '결국 나는 사랑받을 자격이 없는 사람이다': { category: 'self_worth', label: '자기가치 의심' },
    '사람들은 결국 나를 떠난다': { category: 'abandonment', label: '유기 불안' },
    '세상은 안전하지 않고, 언제든 상처받을 수 있다': { category: 'safety', label: '안전 욕구' },
    '내가 완벽하지 않으면 사랑받을 수 없다': { category: 'conditional_worth', label: '조건부 가치' },
    '나는 혼자서는 아무것도 할 수 없다': { category: 'helplessness', label: '무력감' },
    '위의 어느 것도 아닌, 다른 생각이 있다': { category: 'other', label: '기타' },
  };

  const match = optionMap[q18] || { category: 'other' as const, label: '기타' };

  // 수렴 증거 수집 — q12, q15, q17에서 핵심 신념 카테고리와 일치하는 내용 탐색
  const convergingEvidence: string[] = [];

  if (survey.q12_deepest_fear) {
    const q12 = survey.q12_deepest_fear.toLowerCase();
    if (match.category === 'abandonment' && (q12.includes('떠나') || q12.includes('외로') || q12.includes('혼자') || q12.includes('버림'))) {
      convergingEvidence.push(`q12 두려움: "${survey.q12_deepest_fear}"`);
    }
    if (match.category === 'self_worth' && (q12.includes('자격') || q12.includes('부족') || q12.includes('못해'))) {
      convergingEvidence.push(`q12 두려움: "${survey.q12_deepest_fear}"`);
    }
    if (match.category === 'safety' && (q12.includes('상처') || q12.includes('안전') || q12.includes('불안'))) {
      convergingEvidence.push(`q12 두려움: "${survey.q12_deepest_fear}"`);
    }
    if (match.category === 'conditional_worth' && (q12.includes('완벽') || q12.includes('부족') || q12.includes('충분'))) {
      convergingEvidence.push(`q12 두려움: "${survey.q12_deepest_fear}"`);
    }
    if (match.category === 'helplessness' && (q12.includes('혼자') || q12.includes('못') || q12.includes('무력'))) {
      convergingEvidence.push(`q12 두려움: "${survey.q12_deepest_fear}"`);
    }
  }

  if (survey.q15_core_desire) {
    convergingEvidence.push(`q15 핵심 욕구: "${survey.q15_core_desire}"`);
  }

  if (survey.q17_relationship_rules) {
    const q17text = `${survey.q17_relationship_rules.rules} ${survey.q17_relationship_rules.negative_assumption}`;
    if (q17text.length > 5) {
      convergingEvidence.push(`q17 관계 규칙/가정: "${survey.q17_relationship_rules.rules}"`);
    }
  }

  return {
    category: match.category,
    label: match.label,
    selectedOption: q18 || '(미선택)',
    convergingEvidence,
  };
}

/**
 * 5) 사고 체인 서사 생성
 * 자동사고 → 중간신념 → 핵심신념의 3단 연결을 자연어로 서술
 */
function buildThoughtChain(
  fivePartModel: FivePartModel,
  distortions: CognitiveDistortion[],
  intermediateBelief: IntermediateBelief,
  coreBelief: CoreBeliefCategory
): string {
  const thought = fivePartModel.automaticThought;
  const distortionLabels = distortions.slice(0, 2).map(d => d.label).join(', ');
  const rule = intermediateBelief.rules;
  const belief = coreBelief.label;

  let chain = `"${thought}"`;

  if (distortionLabels) {
    chain += ` — 이 생각에는 ${distortionLabels} 패턴이 담겨 있어요.`;
  } else {
    chain += ` — 이 생각은 그 순간 가장 강렬하게 떠오른 자동적 반응이에요.`;
  }

  if (rule !== '(미응답)') {
    chain += ` 그 아래에는 "${rule}"이라는 규칙이 작동하고 있고,`;
  }

  chain += ` 가장 깊은 곳에는 "${belief}"이라는 마음이 자리 잡고 있어요.`;
  chain += ` 이 연쇄를 알아차리는 것만으로도, 같은 상황에서 다르게 반응할 수 있는 여지가 생겨요.`;

  return chain;
}
