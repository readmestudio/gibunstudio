/**
 * Phase 2 콘텐츠 품질 테스트 스크립트
 *
 * 실행: npx tsx scripts/test-phase2.ts
 *
 * 1. Supabase에서 가장 최근 Phase 1 결과를 가져옴
 * 2. phase2-survey-input.md의 서베이 응답 사용
 * 3. 교차검증 + 10장 카드 생성 (실제 LLM 호출)
 * 4. 결과를 phase2-test-output.md로 저장
 */

import { config } from 'dotenv';
import { resolve as pathResolve } from 'path';
config({ path: pathResolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';
import { buildDeepCrossValidation } from '../src/lib/husband-match/analysis/deep-cross-validation';
import {
  PHASE2_CARD_PROMPTS,
  type Phase2CardData,
} from '../src/lib/husband-match/prompts/phase2-prompts';
import { PHASE2_SYSTEM_PROMPT } from '../src/lib/husband-match/prompts/phase2-system-prompt';
import { chatCompletion, safeJsonParse } from '../src/lib/gemini-client';
import { getAllHusbandTypes } from '../src/lib/husband-match/data/husband-types';
import type { ReportCard } from '../src/lib/husband-match/types';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

// ── 설정 ──

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const LLM_OPTIONS = {
  model: 'gpt-4o-mini' as const,
  temperature: 0.75,
  max_tokens: 16384,
};

// ── 서베이 답변 (phase2-survey-input.md에서 가져옴) ──

const SURVEY_RESPONSES = {
  q1_together_time: 6,
  q2_anxiety_influence: 5,
  q3_logic_vs_emotion: 7,
  q4_independence: 7,
  q5_emotional_expression: 8,
  q6_conflict_pattern:
    '일단 감정을 가라앉히고 나서, 조심스럽게 대화를 시도해요. 바로 말하면 감정적으로 될까 봐 좀 시간을 두는 편이에요.',
  q7_partner_distance:
    '불안해지면서 자꾸 연락을 확인하게 돼요. 괜찮은 척하지만 속으로는 뭘 잘못했나 계속 생각해요.',
  q8_recurring_issue:
    '내 기대를 직접 말하지 않고 상대가 알아주길 바라는 것. 결국 서운함이 쌓이다가 한꺼번에 터져요.',
  q9_stress_response:
    '혼자 방에 들어가서 유튜브를 켜요. 아무 생각 없이 영상을 보면서 머리를 비우려고 해요.',
  q10_body_signal:
    '가슴이 답답해지고 손이 차가워져요. 심장이 빨리 뛰면서 머리가 멍해지는 느낌이에요.',
  q11_comfort_source:
    '아무 말 없이 옆에 있어 주는 친구. 뭔가를 해결해주려 하지 않고, 그냥 같이 있어주는 것만으로 위로가 돼요.',
  q12_deepest_fear:
    '나 자신을 잃어버릴까 봐. 상대에게 맞추다 보면 내가 원래 원하던 것, 좋아하던 것을 잊어버릴까 봐 두려워요.',
  q13_want_to_change:
    '화가 나도 참다가 나중에 폭발하는 것. 작을 때 말하면 될 걸 참았다가 크게 터지면 상대도 나도 다 힘들어져요.',
  q14_ideal_day:
    '아침에 같이 산책하고, 각자 일하다가, 저녁에 요리하며 수다 떠는 하루. 특별하지 않아도, 같이 있는 것 자체가 편안한 그런 하루.',
  q15_core_desire:
    '말하지 않아도 통하는 편안함. 서로의 침묵도 어색하지 않은 그런 관계.',
  q16_hot_scenario:
    '"혹시 헤어지자는 건 아니겠지?" 가슴이 철렁하면서 내가 뭘 잘못했나 빠르게 되짚어봐요.',
  q17_relationship_rules: {
    rules: '서로의 하루를 공유해야 한다',
    positive_assumption: '내 이야기를 끝까지 들어줄 것이다',
    negative_assumption: '실망하거나 부담스러워할 것이다',
  },
  q18_core_belief_choice: '내가 완벽하지 않으면 사랑받을 수 없다',
};

// ── 카드 메타 ──

const PHASE2_CARD_KEYS: (keyof typeof PHASE2_CARD_PROMPTS)[] = [
  'card_01_bridge',
  'card_02_life_meaning',
  'card_03_unconscious_desires',
  'card_04_chain_reaction',
  'card_05_invisible_rules',
  'card_06_relationship_impact',
  'card_07_deepest_fear',
  'card_08_growth',
  'card_09_deep_match',
  'card_10_letter',
];

const PHASE2_CARD_META: Record<
  number,
  { title: string; subtitle?: string; card_type: ReportCard['card_type'] }
> = {
  1: { title: '두 개의 거울', subtitle: '교차 검증', card_type: 'personality' },
  2: { title: '삶의 의미', subtitle: '인생 가치관', card_type: 'values' },
  3: { title: '무의식의 욕구', subtitle: '숨겨진 욕구', card_type: 'values' },
  4: { title: '마음의 연쇄 반응', subtitle: '감정 도미노', card_type: 'personality' },
  5: { title: '보이지 않는 규칙', subtitle: '관계 규칙', card_type: 'values' },
  6: { title: '관계의 파장', subtitle: '관계 영향', card_type: 'values' },
  7: { title: '가장 깊은 두려움', subtitle: '핵심 두려움', card_type: 'personality' },
  8: { title: '성장의 문턱', subtitle: '성장 포인트', card_type: 'result' },
  9: { title: '당신에게 맞는 사람, 다시 한번', subtitle: '심층 매칭', card_type: 'matching' },
  10: { title: '당신에게 보내는 편지', subtitle: '마무리 편지', card_type: 'result' },
};

// ── 유틸리티 ──

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) console.log(`  ✓ ${label} 재시도 ${attempt}회 만에 성공`);
      return result;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        console.warn(`  ⚠ ${label} 실패 (시도 ${attempt + 1}/${maxRetries + 1}): ${lastError.message}`);
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastError ?? new Error(`${label} 최종 실패`);
}

async function generateCardContent(
  cardKey: keyof typeof PHASE2_CARD_PROMPTS,
  data: Phase2CardData
): Promise<string> {
  const prompt = PHASE2_CARD_PROMPTS[cardKey](data);
  const wrappedPrompt = `${prompt}\n\n위 지침에 따라 카드 본문을 작성하세요. JSON 형식으로 응답하세요: {"content": "카드 본문 전체 텍스트"}`;

  const response = await chatCompletion(
    [
      { role: 'system', content: PHASE2_SYSTEM_PROMPT },
      { role: 'user', content: wrappedPrompt },
    ],
    {
      ...LLM_OPTIONS,
      response_format: { type: 'json_object' as const },
    }
  );

  const raw = response ?? '';
  try {
    const parsed = safeJsonParse<{ content?: string }>(raw);
    if (parsed.content) return parsed.content.trim().slice(0, 5000);
  } catch {
    // fallback
  }
  return raw.trim().slice(0, 5000);
}

// ── 메인 ──

async function main() {
  console.log('═══════════════════════════════════════');
  console.log(' Phase 2 콘텐츠 품질 테스트');
  console.log('═══════════════════════════════════════\n');

  // 1. Supabase에서 Phase 1 데이터 가져오기
  console.log('1) Supabase에서 Phase 1 결과 조회 중...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: phase1List, error: phase1Error } = await supabase
    .from('phase1_results')
    .select(
      'id, tci_scores, channel_categories, enneagram_center, enneagram_type, mbti_scores, mbti_type, user_vector, matched_husband_type, match_score, cards, user_name'
    )
    .order('created_at', { ascending: false })
    .limit(1);

  if (phase1Error || !phase1List || phase1List.length === 0) {
    console.error('Phase 1 데이터 로드 실패:', phase1Error?.message ?? '결과 없음');
    process.exit(1);
  }
  const phase1 = phase1List[0];

  console.log(`   → Phase 1 ID: ${phase1.id}`);
  console.log(`   → 사용자: ${phase1.user_name || '(이름 없음)'}`);
  console.log(`   → 매칭 타입: ${phase1.matched_husband_type}`);
  console.log(`   → TCI: NS=${phase1.tci_scores.NS} HA=${phase1.tci_scores.HA} RD=${phase1.tci_scores.RD} P=${phase1.tci_scores.P} SD=${phase1.tci_scores.SD} CO=${phase1.tci_scores.CO} ST=${phase1.tci_scores.ST}`);
  console.log(`   → MBTI: ${phase1.mbti_type}`);

  // 2. 남편 타입 상세 정보
  console.log('\n2) 남편 타입 상세 정보 조회...');
  const allHusbandTypes = getAllHusbandTypes();
  const husbandType = allHusbandTypes.find((t) => t.id === phase1.matched_husband_type);
  const husbandTypeData = husbandType
    ? {
        id: husbandType.id,
        name: husbandType.name,
        category: husbandType.category,
        subcategory: husbandType.subcategory,
        description: husbandType.description,
        metaphor:
          husbandType.variant === 'extrovert' ? husbandType.metaphor_e : husbandType.metaphor_i,
      }
    : {
        id: phase1.matched_husband_type,
        name: phase1.matched_husband_type,
        category: '',
        subcategory: '',
        description: 'Phase 1에서 매칭된 파트너 유형입니다.',
        metaphor: undefined,
      };
  console.log(`   → ${husbandTypeData.name} (${husbandTypeData.category})`);

  // 3. 교차검증 실행
  console.log('\n3) 8차원 심층 교차검증 실행...');
  const deepCrossValidation = buildDeepCrossValidation(
    {
      tci_scores: phase1.tci_scores,
      mbti_scores: phase1.mbti_scores,
      mbti_type: phase1.mbti_type,
      enneagram_type: phase1.enneagram_type,
      enneagram_center: phase1.enneagram_center,
      channel_categories: phase1.channel_categories,
      matched_husband_type: phase1.matched_husband_type,
      match_score: phase1.match_score,
      cards: phase1.cards,
      user_name: phase1.user_name,
    },
    SURVEY_RESPONSES
  );

  console.log(`   → 자기일치도: ${Math.round(deepCrossValidation.authenticityScore * 100)}%`);
  console.log(`   → 숨겨진 욕구: ${deepCrossValidation.hiddenDesires.length}개`);
  console.log(
    `   → 주요 불일치: ${deepCrossValidation.dimensions.filter((d) => Math.abs(d.diff) >= 20).length}개 차원`
  );

  // 4. Phase2CardData 조립
  const phase2CardData: Phase2CardData = {
    phase1: {
      tci_scores: phase1.tci_scores,
      channel_categories: phase1.channel_categories,
      enneagram_center: phase1.enneagram_center,
      enneagram_type: phase1.enneagram_type,
      mbti_scores: phase1.mbti_scores,
      mbti_type: phase1.mbti_type,
      matched_husband_type: phase1.matched_husband_type,
      match_score: phase1.match_score,
      cards: phase1.cards,
      user_name: phase1.user_name,
    },
    survey: SURVEY_RESPONSES,
    deepCrossValidation,
    husbandType: husbandTypeData,
  };

  // 5. 10장 카드 생성 (3배치 병렬)
  console.log('\n4) 10장 카드 생성 시작 (3배치 병렬, LLM 호출)...');
  const startTime = Date.now();
  const contentMap = new Map<number, string>();

  const batchA = async () => {
    console.log('   배치 A: 카드 1-3 (도입부)');
    const [c1, c2, c3] = await Promise.all([
      withRetry(() => generateCardContent('card_01_bridge', phase2CardData), '카드 1'),
      withRetry(() => generateCardContent('card_02_life_meaning', phase2CardData), '카드 2'),
      withRetry(() => generateCardContent('card_03_unconscious_desires', phase2CardData), '카드 3'),
    ]);
    contentMap.set(1, c1);
    contentMap.set(2, c2);
    contentMap.set(3, c3);
    console.log('   ✓ 배치 A 완료');
  };

  const batchB = async () => {
    console.log('   배치 B: 카드 4-6 (분석)');
    const [c4, c5, c6] = await Promise.all([
      withRetry(() => generateCardContent('card_04_chain_reaction', phase2CardData), '카드 4'),
      withRetry(() => generateCardContent('card_05_invisible_rules', phase2CardData), '카드 5'),
      withRetry(() => generateCardContent('card_06_relationship_impact', phase2CardData), '카드 6'),
    ]);
    contentMap.set(4, c4);
    contentMap.set(5, c5);
    contentMap.set(6, c6);
    console.log('   ✓ 배치 B 완료');
  };

  const batchC = async () => {
    console.log('   배치 C: 카드 7-10 (마무리)');
    const [c7, c8, c9, c10] = await Promise.all([
      withRetry(() => generateCardContent('card_07_deepest_fear', phase2CardData), '카드 7'),
      withRetry(() => generateCardContent('card_08_growth', phase2CardData), '카드 8'),
      withRetry(() => generateCardContent('card_09_deep_match', phase2CardData), '카드 9'),
      withRetry(() => generateCardContent('card_10_letter', phase2CardData), '카드 10'),
    ]);
    contentMap.set(7, c7);
    contentMap.set(8, c8);
    contentMap.set(9, c9);
    contentMap.set(10, c10);
    console.log('   ✓ 배치 C 완료');
  };

  await Promise.all([batchA(), batchB(), batchC()]);
  const elapsed = Date.now() - startTime;
  console.log(`\n   전체 소요 시간: ${Math.round(elapsed / 1000)}초`);

  // 6. 결과 파일 생성
  console.log('\n5) 결과 파일 생성 중...');

  const outputLines: string[] = [];
  outputLines.push('# Phase 2 심층 분석 테스트 결과\n');
  outputLines.push(`> 생성 시각: ${new Date().toLocaleString('ko-KR')}`);
  outputLines.push(`> Phase 1 ID: ${phase1.id}`);
  outputLines.push(`> 사용자: ${phase1.user_name || '(이름 없음)'}`);
  outputLines.push(`> 소요 시간: ${Math.round(elapsed / 1000)}초\n`);

  // 입력 데이터 요약
  outputLines.push('---\n');
  outputLines.push('## 입력 데이터 요약\n');
  outputLines.push('### Phase 1 데이터\n');
  outputLines.push(`- **MBTI**: ${phase1.mbti_type}`);
  outputLines.push(`- **에니어그램**: ${phase1.enneagram_type ?? '추정 불가'}`);
  outputLines.push(
    `- **TCI 6축**: NS=${phase1.tci_scores.NS}, HA=${phase1.tci_scores.HA}, RD=${phase1.tci_scores.RD}, P=${phase1.tci_scores.P}, SD=${phase1.tci_scores.SD}, CO=${phase1.tci_scores.CO}, ST=${phase1.tci_scores.ST}`
  );
  outputLines.push(`- **매칭 타입**: ${husbandTypeData.name}`);
  outputLines.push(`- **매칭 점수**: ${Math.round(phase1.match_score * 100)}%\n`);

  outputLines.push('### 서베이 응답 (18문항)\n');
  outputLines.push(`| 문항 | 응답 |`);
  outputLines.push(`|------|------|`);
  outputLines.push(`| q1 함께 시간 | ${SURVEY_RESPONSES.q1_together_time}/10 |`);
  outputLines.push(`| q2 불안 영향 | ${SURVEY_RESPONSES.q2_anxiety_influence}/10 |`);
  outputLines.push(`| q3 논리/감정 | ${SURVEY_RESPONSES.q3_logic_vs_emotion}/10 |`);
  outputLines.push(`| q4 독립성 | ${SURVEY_RESPONSES.q4_independence}/10 |`);
  outputLines.push(`| q5 감정표현 | ${SURVEY_RESPONSES.q5_emotional_expression}/10 |`);
  outputLines.push(`| q6 갈등패턴 | ${SURVEY_RESPONSES.q6_conflict_pattern.slice(0, 40)}... |`);
  outputLines.push(`| q7 거리반응 | ${SURVEY_RESPONSES.q7_partner_distance.slice(0, 40)}... |`);
  outputLines.push(`| q8 반복문제 | ${SURVEY_RESPONSES.q8_recurring_issue.slice(0, 40)}... |`);
  outputLines.push(`| q9 스트레스 | ${SURVEY_RESPONSES.q9_stress_response.slice(0, 40)}... |`);
  outputLines.push(`| q10 몸 신호 | ${SURVEY_RESPONSES.q10_body_signal.slice(0, 40)}... |`);
  outputLines.push(`| q11 위안 | ${SURVEY_RESPONSES.q11_comfort_source.slice(0, 40)}... |`);
  outputLines.push(`| q12 두려움 | ${SURVEY_RESPONSES.q12_deepest_fear.slice(0, 40)}... |`);
  outputLines.push(`| q13 변화 | ${SURVEY_RESPONSES.q13_want_to_change.slice(0, 40)}... |`);
  outputLines.push(`| q14 이상하루 | ${SURVEY_RESPONSES.q14_ideal_day.slice(0, 40)}... |`);
  outputLines.push(`| q15 핵심욕구 | ${SURVEY_RESPONSES.q15_core_desire.slice(0, 40)}... |`);
  outputLines.push(`| q16 핫시나리오 | ${SURVEY_RESPONSES.q16_hot_scenario.slice(0, 40)}... |`);
  outputLines.push(`| q17 관계규칙 | ${SURVEY_RESPONSES.q17_relationship_rules.rules.slice(0, 40)}... |`);
  outputLines.push(`| q18 핵심신념 | ${SURVEY_RESPONSES.q18_core_belief_choice.slice(0, 40)}... |`);

  // 교차검증 결과
  outputLines.push('\n---\n');
  outputLines.push('## 교차검증 결과\n');
  outputLines.push(`**자기일치도**: ${Math.round(deepCrossValidation.authenticityScore * 100)}%\n`);

  outputLines.push('### 8차원 교차검증\n');
  outputLines.push('| 차원 | YouTube | 설문 | 차이 | 해석 |');
  outputLines.push('|------|---------|------|------|------|');
  for (const dim of deepCrossValidation.dimensions) {
    outputLines.push(
      `| ${dim.dimension} | ${dim.youtube_value} | ${dim.survey_value} | ${dim.diff > 0 ? '+' : ''}${dim.diff} | ${dim.interpretation.slice(0, 60)}... |`
    );
  }

  outputLines.push('\n### 숨겨진 욕구\n');
  for (const desire of deepCrossValidation.hiddenDesires) {
    outputLines.push(`**${desire.label}**`);
    outputLines.push(`${desire.description}`);
    outputLines.push(`> 근거: ${desire.source}\n`);
  }

  outputLines.push('### 성격 3층 구조\n');
  outputLines.push(`**겉모습 (YouTube 기반)**`);
  outputLines.push(`${deepCrossValidation.personalityLayers.surface}\n`);
  outputLines.push(`**의식적 자아 (설문 기반)**`);
  outputLines.push(`${deepCrossValidation.personalityLayers.conscious}\n`);
  outputLines.push(`**무의식 (불일치에서 도출)**`);
  outputLines.push(`${deepCrossValidation.personalityLayers.unconscious}\n`);

  outputLines.push('### 감정 청사진\n');
  outputLines.push(`- **스트레스 반응**: ${deepCrossValidation.emotionalBlueprint.stressResponse}`);
  outputLines.push(`- **회복 방식**: ${deepCrossValidation.emotionalBlueprint.healingPattern}`);
  outputLines.push(`- **감정 표현도**: ${deepCrossValidation.emotionalBlueprint.emotionalExpression}/100`);
  outputLines.push(`- **갈등 스타일**: ${deepCrossValidation.emotionalBlueprint.conflictStyle}`);

  // 카드 10장
  outputLines.push('\n---\n');
  outputLines.push('## Phase 2 카드 10장\n');

  for (let i = 1; i <= 10; i++) {
    const meta = PHASE2_CARD_META[i];
    const content = contentMap.get(i) ?? '(생성 실패)';
    outputLines.push(`### 카드 ${i}: ${meta.title}`);
    outputLines.push(`*${meta.subtitle}*\n`);
    outputLines.push(content);
    outputLines.push('\n---\n');
  }

  const outputPath = resolve(process.cwd(), 'phase2-test-output.md');
  writeFileSync(outputPath, outputLines.join('\n'), 'utf-8');
  console.log(`\n✓ 결과 저장 완료: ${outputPath}`);
  console.log('═══════════════════════════════════════\n');
}

main().catch((err) => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
