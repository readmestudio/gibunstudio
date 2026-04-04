'use client';

import { useRouter } from 'next/navigation';
import { CardCarousel } from '@/components/husband-match/CardCarousel';
import { ReportCardPage } from '@/components/husband-match/ReportCardPage';
import { LockedCard } from '@/components/husband-match/LockedCard';
import { PaymentGate } from '@/components/husband-match/PaymentGate';
import { Phase1Result } from '@/lib/husband-match/types';
import { splitCardsIntoPages } from '@/lib/husband-match/split-cards-into-pages';

interface Phase1ReportClientProps {
  result: Phase1Result;
}

export function Phase1ReportClient({ result }: Phase1ReportClientProps) {
  const router = useRouter();

  // 8장 카드 → 페이지 분할
  const pages = splitCardsIntoPages(result.cards, result.user_name);

  // PaymentGate 추가 (마지막 페이지)
  const paymentGateCard = (
    <PaymentGate
      phase1Id={result.id}
      onProceed={() => {
        router.push(`/husband-match/payment/${result.id}`);
      }}
    />
  );

  // 챕터별 시작 인덱스 계산
  const chapterBreaks: number[] = [];
  let lastChapter = -1;
  pages.forEach((page, idx) => {
    if (page.chapterNumber !== lastChapter) {
      chapterBreaks.push(idx);
      lastChapter = page.chapterNumber;
    }
  });
  // PaymentGate도 하나의 챕터로
  chapterBreaks.push(pages.length);

  // 페이지 → 컴포넌트 변환
  const pageComponents = pages.map((page, idx) => {
    // 잠긴 카드 (딜브레이커)
    if (page.isLocked) {
      return (
        <LockedCard
          key={`locked-${idx}`}
          title={page.title}
          subtitle={page.subtitle}
          previewText={page.body}
          onUnlock={() => {
            router.push(`/husband-match/payment/${result.id}`);
          }}
        />
      );
    }

    // 일반 페이지
    return (
      <ReportCardPage
        key={`page-${idx}`}
        chapterRoman={page.chapterRoman}
        subtitle={page.subtitle}
        title={page.title}
        body={page.body}
        arrowSummary={page.arrowSummary}
        pageNumber={page.pageNumber}
        totalPages={page.totalPages + 1} // +1 for PaymentGate
        illustration={page.illustration}
      />
    );
  });

  const allCards = [...pageComponents, paymentGateCard];

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Card Carousel */}
        <CardCarousel
          cards={allCards}
          chapterBreaks={chapterBreaks}
        />
      </div>
    </div>
  );
}
