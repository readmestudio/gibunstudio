/**
 * 8장 챕터 카드 → 한 화면씩 넘기는 페이지 배열로 분할
 * DB에는 8장 그대로 저장, 프론트에서만 분할하여 렌더링
 */

import { ReportCard } from './types';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

// 챕터별 doodle 일러스트 매핑
const CHAPTER_ILLUSTRATIONS: Record<number, string> = {
  1: '/doodles/mystic-eye.svg',
  2: '/doodles/arrow-squiggle.svg',
  3: '/doodles/face-smile.svg',
  4: '/doodles/chat-bubble.svg',
  5: '/doodles/heart-doodle.svg',
  6: '/doodles/plant-doodle.svg',
  7: '/doodles/star-sparkle.svg',
  8: '/doodles/underline-wave.svg',
};

// 챕터별 subtitle 템플릿
const CHAPTER_SUBTITLES: Record<number, string> = {
  1: '{name}의 배우자 기질 리포트',
  2: '{name}의 구독 데이터',
  3: '{name}의 성격과 기질',
  4: '{name}의 관계 패턴',
  5: '{name}의 배우자',
  6: '{name}의 행복 조건',
  7: '{name}의 딜브레이커',
  8: '심층 분석 안내',
};

export interface CardPage {
  chapterNumber: number;
  chapterRoman: string;
  subtitle: string;
  title: string;
  body: string;
  arrowSummary?: string;
  pageNumber: number;
  totalPages: number;
  illustration: string;
  isLocked?: boolean;
  // 원본 카드 참조 (특수 렌더링용)
  originalCard?: ReportCard;
}

/**
 * **볼드 섹션** 기준으로 콘텐츠를 섹션 배열로 분리
 * 각 섹션: { title, arrowSummary?, body }
 */
function splitByBoldSections(content: string): Array<{ title: string; arrowSummary?: string; body: string }> {
  const lines = content.split('\n');
  const sections: Array<{ title: string; arrowSummary?: string; body: string }> = [];
  let currentTitle = '';
  let currentArrow: string | undefined;
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // **볼드 타이틀** 감지
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (boldMatch) {
      // 이전 섹션 저장
      if (currentTitle || currentBody.length > 0) {
        sections.push({
          title: currentTitle,
          arrowSummary: currentArrow,
          body: currentBody.join('\n').trim(),
        });
      }
      currentTitle = boldMatch[1];
      currentArrow = undefined;
      currentBody = [];
      continue;
    }

    // → 요약 라인 감지 (타이틀 직후)
    if (trimmed.startsWith('→ ') && currentBody.length === 0) {
      currentArrow = trimmed.replace(/^→\s*/, '');
      continue;
    }

    currentBody.push(line);
  }

  // 마지막 섹션 저장
  if (currentTitle || currentBody.length > 0) {
    sections.push({
      title: currentTitle,
      arrowSummary: currentArrow,
      body: currentBody.join('\n').trim(),
    });
  }

  return sections;
}

/**
 * 긴 본문을 ~400자 기준으로 문단 분할
 */
function splitLongBody(body: string, maxChars: number = 400): string[] {
  if (body.length <= maxChars) return [body];

  const paragraphs = body.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if (current && (current.length + para.length) > maxChars) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [body];
}

/**
 * 메인 함수: ReportCard[] → CardPage[]
 */
export function splitCardsIntoPages(
  cards: ReportCard[],
  userName?: string,
): CardPage[] {
  const name = userName || '당신';
  const allPages: CardPage[] = [];

  for (const card of cards) {
    const chapterNum = card.card_number;
    const illustration = CHAPTER_ILLUSTRATIONS[chapterNum] || '/doodles/star-sparkle.svg';
    const subtitleTemplate = CHAPTER_SUBTITLES[chapterNum] || '';
    const chapterSubtitle = subtitleTemplate.replace('{name}', name);

    // 카드 7 (딜브레이커): 잠긴 카드 — 1페이지
    if (chapterNum === 7) {
      allPages.push({
        chapterNumber: chapterNum,
        chapterRoman: ROMAN[chapterNum - 1],
        subtitle: chapterSubtitle,
        title: card.title,
        body: card.content,
        pageNumber: 0, // 나중에 재계산
        totalPages: 0,
        illustration,
        isLocked: true,
        originalCard: card,
      });
      continue;
    }

    // 카드 1 (인트로), 카드 8 (CTA): 분할하지 않고 1페이지
    if (chapterNum === 1 || chapterNum === 8) {
      allPages.push({
        chapterNumber: chapterNum,
        chapterRoman: ROMAN[chapterNum - 1],
        subtitle: chapterSubtitle,
        title: card.title,
        body: card.content,
        pageNumber: 0,
        totalPages: 0,
        illustration,
        originalCard: card,
      });
      continue;
    }

    // 카드 2~6: **볼드 섹션** 기준 분할
    const sections = splitByBoldSections(card.content);

    if (sections.length === 0) {
      // 섹션이 없으면 전체를 1페이지로
      allPages.push({
        chapterNumber: chapterNum,
        chapterRoman: ROMAN[chapterNum - 1],
        subtitle: chapterSubtitle,
        title: card.title,
        body: card.content,
        pageNumber: 0,
        totalPages: 0,
        illustration,
        originalCard: card,
      });
      continue;
    }

    // 첫 번째 섹션: 타이틀이 없으면 카드 원본 타이틀 사용
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const sectionTitle = section.title || card.title;

      // 긴 본문 추가 분할
      const bodyChunks = splitLongBody(section.body);

      for (let j = 0; j < bodyChunks.length; j++) {
        const pageTitle = j === 0
          ? sectionTitle
          : sectionTitle + ' (계속)';

        allPages.push({
          chapterNumber: chapterNum,
          chapterRoman: ROMAN[chapterNum - 1],
          subtitle: chapterSubtitle,
          title: pageTitle,
          body: bodyChunks[j],
          arrowSummary: j === 0 ? section.arrowSummary : undefined,
          pageNumber: 0,
          totalPages: 0,
          illustration,
          originalCard: i === 0 && j === 0 ? card : undefined,
        });
      }
    }
  }

  // 페이지 번호 재계산
  const total = allPages.length;
  for (let i = 0; i < allPages.length; i++) {
    allPages[i].pageNumber = i + 1;
    allPages[i].totalPages = total;
  }

  return allPages;
}
