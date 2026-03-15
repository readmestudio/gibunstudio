/**
 * Phase 1 전용 테스트 스크립트
 *
 * 실행: npx tsx scripts/test-phase1-only.ts
 *
 * YouTube 구독 채널 37개 → Phase 1 파이프라인 → 9장 카드 → phase1-test-output.md 저장
 * 예상 소요: 1~2분 (LLM 5배치 병렬)
 */

import { resolve } from 'path';
import Module from 'module';

const origResolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (req: string, ...args: any[]) {
  if (req.startsWith('@/')) {
    req = resolve(process.cwd(), 'src', req.slice(2));
  }
  return origResolve.call(this, req, ...args);
};

import { config } from 'dotenv';
config({ path: resolve(process.cwd(), '.env.local') });

import { categorizeChannels } from '../src/lib/husband-match/analysis/categorize-channels';
import { calculateTCI } from '../src/lib/husband-match/analysis/calculate-tci';
import { estimateEnneagram } from '../src/lib/husband-match/analysis/estimate-enneagram';
import { estimateMBTI } from '../src/lib/husband-match/analysis/estimate-mbti';
import { createVector } from '../src/lib/husband-match/analysis/create-vector';
import { runYouTubeAnalysis } from '../src/lib/husband-match/analysis/youtube-analysis';
import { runPhase1FromPrecomputed } from '../src/app/api/analyze/phase1/run-from-channels';
import { getAllHusbandTypes } from '../src/lib/husband-match/data/husband-types';
import { checkStyleViolations } from '../src/lib/writing-guide';
import type { ChannelData, ReportCard } from '../src/lib/husband-match/types';
import { writeFileSync } from 'fs';

// ── 채널 데이터 37개 (실제 사용자 스크린샷 기반) ──

const CHANNELS: ChannelData[] = [
  { channel_id: 'ch01', channel_title: 'KIYU_TV', channel_description: '라이프스타일, 일상 브이로그' },
  { channel_id: 'ch02', channel_title: '윤쥬르 YOONJOUR 장윤주', channel_description: '패션, 뷰티, 라이프스타일' },
  { channel_id: 'ch03', channel_title: '너진뚝 NJT BOOK', channel_description: '독서 리뷰, 책 추천, 인문학' },
  { channel_id: 'ch04', channel_title: '윤그린', channel_description: '일상 브이로그, 라이프스타일' },
  { channel_id: 'ch05', channel_title: '단커피', channel_description: '커피, 카페 투어, 라이프스타일' },
  { channel_id: 'ch06', channel_title: '부산영어방송 BeFM', channel_description: '영어 학습, 라디오, 부산 문화' },
  { channel_id: 'ch07', channel_title: '최고의1분', channel_description: '자기계발, 동기부여, 짧은 인사이트' },
  { channel_id: 'ch08', channel_title: 'English Speaking Success', channel_description: '영어 회화, 영어 학습' },
  { channel_id: 'ch09', channel_title: 'EBS 컬렉션 - 라이프스타일', channel_description: '교양, 다큐멘터리, 라이프스타일' },
  { channel_id: 'ch10', channel_title: '최마태의 POST IT', channel_description: '자기계발, 인사이트, 동기부여' },
  { channel_id: 'ch11', channel_title: 'Christian Dior', channel_description: '패션, 럭셔리 브랜드, 하이패션' },
  { channel_id: 'ch12', channel_title: 'English Fluency Builder', channel_description: '영어 회화, 유창성 훈련' },
  { channel_id: 'ch13', channel_title: 'The Sunday Times Style', channel_description: '패션, 뷰티, 라이프스타일 매거진' },
  { channel_id: 'ch14', channel_title: '소울정', channel_description: '영성, 힐링, 마음 치유' },
  { channel_id: 'ch15', channel_title: '낮잠 NZ Ambience', channel_description: '뉴질랜드 자연 소리, ASMR, 앰비언스' },
  { channel_id: 'ch16', channel_title: '던워리비햇님', channel_description: '자기계발, 힐링, 긍정 마인드' },
  { channel_id: 'ch17', channel_title: 'Stone Soup Grimoire', channel_description: '영성, 타로, 마법, 위치크래프트' },
  { channel_id: 'ch18', channel_title: 'hostless', channel_description: '공간 디자인, 인테리어' },
  { channel_id: 'ch19', channel_title: '매니악룸 Maniac Room', channel_description: '인테리어, 공간 디자인, 원룸 꾸미기' },
  { channel_id: 'ch20', channel_title: 'JuJu healing Music&Yoga', channel_description: '힐링 음악, 요가, 명상' },
  { channel_id: 'ch21', channel_title: '라이브 아카데미 토들러', channel_description: '영어 학습, 영어 회화' },
  { channel_id: 'ch22', channel_title: '이종범의 스토리캠프', channel_description: '인문학, 스토리텔링, 역사' },
  { channel_id: 'ch23', channel_title: 'oneness', channel_description: '영성, 명상, 의식 확장' },
  { channel_id: 'ch24', channel_title: 'Beautiful Chorus', channel_description: '힐링 음악, 명상 음악, 합창' },
  { channel_id: 'ch25', channel_title: 'CuriousBrainLab', channel_description: '심리학, 뇌과학, 자기이해' },
  { channel_id: 'ch26', channel_title: '지식은 날리지', channel_description: '지식, 교양, 인문학' },
  { channel_id: 'ch27', channel_title: 'mina in york 미나', channel_description: '뉴욕 해외 생활 브이로그' },
  { channel_id: 'ch28', channel_title: '정리마켓', channel_description: '정리정돈, 미니멀 라이프, 수납' },
  { channel_id: 'ch29', channel_title: 'Essie Jain', channel_description: '음악, 싱어송라이터, 포크 음악' },
  { channel_id: 'ch30', channel_title: 'Turbo832 TV', channel_description: '라이프스타일, 일상 콘텐츠' },
  { channel_id: 'ch31', channel_title: '존이나박이나', channel_description: '커플 브이로그, 일상' },
  { channel_id: 'ch32', channel_title: '김주환의 내면소통', channel_description: '심리학, 내면 성장, 소통' },
  { channel_id: 'ch33', channel_title: '노홍철', channel_description: '예능, 토크, 유머' },
  { channel_id: 'ch34', channel_title: '유 퀴즈 온 더 튜브', channel_description: '토크, 예능, 인터뷰' },
  { channel_id: 'ch35', channel_title: 'Mei-lan', channel_description: '라이프스타일, 뷰티' },
  { channel_id: 'ch36', channel_title: 'Ch.염미솔', channel_description: '음악, 노래, 보컬' },
  { channel_id: 'ch37', channel_title: '우엉ueong', channel_description: '일상 브이로그, 라이프스타일' },
];

// ── 유틸 ──

async function withRetry<T>(fn: () => Promise<T>, label: string, maxRetries = 2): Promise<T> {
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
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw lastError ?? new Error(`${label} 최종 실패`);
}

// ── 메인 ──

async function main() {
  const totalStart = Date.now();

  console.log('\n' + '='.repeat(55));
  console.log(' Phase 1 전용 테스트');
  console.log('='.repeat(55));
  console.log(` 채널 수: ${CHANNELS.length}개\n`);

  // 1. 채널 카테고리 분류 + YouTube 분석
  console.log('[1/3] 채널 카테고리 분류 + YouTube 분석...');
  const analysisStart = Date.now();

  const [channel_categories, youtubeAnalysis] = await Promise.all([
    withRetry(() => categorizeChannels(CHANNELS), '채널 카테고리 분류'),
    withRetry(() => runYouTubeAnalysis(CHANNELS), 'YouTube 분석'),
  ]);

  console.log(`  ✓ 완료 (${Math.round((Date.now() - analysisStart) / 1000)}초)`);
  console.log(`  희소성: 상위 ${youtubeAnalysis.rarity.percentile}%`);

  // 2. TCI / Enneagram / MBTI / Vector
  console.log('\n[2/3] TCI / Enneagram / MBTI / Vector...');
  const tci_scores = calculateTCI(channel_categories);
  const enneagram = estimateEnneagram(tci_scores, channel_categories);
  const mbti = estimateMBTI(tci_scores, channel_categories);
  const user_vector = createVector(tci_scores, enneagram.center, channel_categories);

  console.log(`  TCI: NS=${tci_scores.NS} HA=${tci_scores.HA} RD=${tci_scores.RD} P=${tci_scores.P} SD=${tci_scores.SD} CO=${tci_scores.CO} ST=${tci_scores.ST}`);
  console.log(`  MBTI: ${mbti.type} | Enneagram: ${enneagram.type}번`);

  // 3. 카드 9장 생성
  console.log('\n[3/3] Phase 1 카드 9장 생성 (LLM 5배치 병렬)...');
  const cardGenStart = Date.now();

  let capturedPayload: any = null;
  const mockSupabase = {
    from: () => ({
      upsert: (payload: any) => {
        capturedPayload = payload;
        return {
          select: () => ({
            single: () => Promise.resolve({ data: { id: 'test-phase1-id' }, error: null }),
          }),
        };
      },
    }),
  } as any;

  await runPhase1FromPrecomputed(mockSupabase, 'test-user-id', {
    channel_categories,
    tci_scores,
    enneagram_center: enneagram.center,
    enneagram_type: enneagram.type,
    mbti_scores: mbti.scores,
    mbti_type: mbti.type,
    user_vector,
    channelCount: CHANNELS.length,
  }, youtubeAnalysis);

  const cardGenTime = Math.round((Date.now() - cardGenStart) / 1000);

  if (!capturedPayload) {
    console.error('카드 생성 실패!');
    process.exit(1);
  }

  const cards: ReportCard[] = capturedPayload.cards;
  const matchedTypeId: string = capturedPayload.matched_husband_type;
  const matchScore: number = capturedPayload.match_score;

  const allTypes = getAllHusbandTypes();
  const husband = allTypes.find((t) => t.id === matchedTypeId);

  console.log(`  ✓ 완료 (${cardGenTime}초)`);
  console.log(`  매칭: ${husband?.name || matchedTypeId} (${Math.round(matchScore * 100)}%)`);

  // ── 결과 파일 생성 ──
  const totalTime = Math.round((Date.now() - totalStart) / 1000);
  const o: string[] = [];

  o.push('# Phase 1 테스트 결과\n');
  o.push(`> 생성: ${new Date().toLocaleString('ko-KR')} | 소요: ${totalTime}초 | 채널: ${CHANNELS.length}개\n`);

  // 분석 요약
  o.push('## 분석 요약\n');
  o.push(`- **TCI**: NS=${tci_scores.NS} HA=${tci_scores.HA} RD=${tci_scores.RD} P=${tci_scores.P} SD=${tci_scores.SD} CO=${tci_scores.CO} ST=${tci_scores.ST}`);
  o.push(`- **MBTI**: ${mbti.type}`);
  o.push(`- **Enneagram**: ${enneagram.type}번`);
  o.push(`- **1위 축**: ${youtubeAnalysis.topBottom.top1.name} (${youtubeAnalysis.topBottom.top1.score}점)`);
  o.push(`- **2위 축**: ${youtubeAnalysis.topBottom.top2.name} (${youtubeAnalysis.topBottom.top2.score}점)`);
  o.push(`- **최저 축**: ${youtubeAnalysis.topBottom.bottom.name} (${youtubeAnalysis.topBottom.bottom.score}점)`);
  o.push(`- **희소성**: 상위 ${youtubeAnalysis.rarity.percentile}%`);
  o.push(`- **매칭**: ${husband?.name || matchedTypeId} (${Math.round(matchScore * 100)}%)\n`);

  // 카드 9장
  o.push('---\n');
  o.push('## 카드 9장\n');

  for (const card of cards) {
    o.push(`### 카드 ${card.card_number}: ${card.title}`);
    if (card.subtitle) o.push(`*${card.subtitle}*`);
    o.push(`(${card.content.length}자)\n`);
    o.push(card.content);
    o.push('\n---\n');
  }

  // 문체 검증
  o.push('## 문체 검증\n');
  let totalViolations = 0;
  for (const card of cards) {
    const violations = checkStyleViolations(card.content);
    totalViolations += violations.length;
    if (violations.length > 0) {
      o.push(`**카드 ${card.card_number}** — ${violations.length}건`);
      for (const v of violations) o.push(`- ${v}`);
      o.push('');
    }
  }
  o.push(totalViolations === 0 ? '모든 카드 통과 ✓\n' : `총 ${totalViolations}건 위반\n`);

  // 검증 요약
  o.push('## 검증 요약\n');
  const llmCards = cards.filter((c) => c.card_number >= 2 && c.card_number <= 8);
  const shortCards = llmCards.filter((c) => c.content.length < 1500);
  o.push(`| 항목 | 결과 |`);
  o.push(`|------|------|`);
  o.push(`| 카드 수 | ${cards.length}장 |`);
  o.push(`| 1500자 미달 (#2~#8) | ${shortCards.length}장 (${shortCards.map((c) => `#${c.card_number}`).join(', ') || '없음'}) |`);
  o.push(`| 문체 위반 | ${totalViolations}건 |`);
  o.push(`| 소요 시간 | ${totalTime}초 |`);

  const outputPath = resolve(process.cwd(), 'phase1-test-output.md');
  writeFileSync(outputPath, o.join('\n'), 'utf-8');

  console.log(`\n✓ 결과 저장: ${outputPath}`);
  console.log(`총 소요: ${totalTime}초`);
  console.log(`카드: ${cards.length}장 | 1500자 미달: ${shortCards.length}장 | 문체 위반: ${totalViolations}건`);
  console.log('='.repeat(55) + '\n');
}

main().catch((err) => {
  console.error('\n테스트 실패:', err);
  process.exit(1);
});
