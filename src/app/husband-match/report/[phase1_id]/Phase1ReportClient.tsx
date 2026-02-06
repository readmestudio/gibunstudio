'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardCarousel } from '@/components/husband-match/CardCarousel';
import { ReportCard } from '@/components/husband-match/ReportCard';
import { PaymentGate } from '@/components/husband-match/PaymentGate';
import { Phase1Result } from '@/lib/husband-match/types';

interface Phase1ReportClientProps {
  result: Phase1Result;
}

export function Phase1ReportClient({ result }: Phase1ReportClientProps) {
  const router = useRouter();

  // 카드 2용 육각형 차트 데이터 생성 (TCI 6차원)
  const hexagonData = {
    labels: ['자기초월', '자율성', '자극추구', '위험회피', '인내력', '연대감'],
    values: [
      result.tci_scores.ST,
      result.tci_scores.SD,
      result.tci_scores.NS,
      result.tci_scores.HA,
      result.tci_scores.P,
      result.tci_scores.CO,
    ],
  };

  // Create card components from result data
  const reportCards = result.cards.map((card) => (
    <ReportCard
      key={card.card_number}
      title={card.title}
      content={card.content}
      cardNumber={card.card_number}
      cardType={card.card_type as any}
      metadata={{
        subtitle: card.subtitle,
        tags: card.tags,
        highlight: card.highlight,
      }}
      hexagonData={card.card_number === 2 ? hexagonData : undefined}
    />
  ));

  // Add payment gate as the last card
  const paymentGateCard = (
    <PaymentGate
      phase1Id={result.id}
      onProceed={() => {
        router.push(`/husband-match/payment/${result.id}`);
      }}
    />
  );

  const allCards = [...reportCards, paymentGateCard];

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            당신의 남편상 분석 리포트
          </h1>
          <p className="text-[var(--foreground)]/70">
            YouTube 구독 채널 기반 성격 및 이상형 분석
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border-2 border-[var(--foreground)]">
            <span className="text-sm font-medium text-[var(--foreground)]/60">
              매칭 타입:
            </span>
            <span className="text-sm font-bold text-[var(--foreground)]">
              {result.matched_husband_type}
            </span>
            <span className="text-sm text-[var(--foreground)]/60">
              (매칭도: {(result.match_score * 100).toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Card Carousel */}
        <CardCarousel cards={allCards} totalCards={result.cards.length + 1} />

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-[var(--foreground)]/60">
            이 분석은 YouTube 구독 채널을 기반으로 생성되었습니다.
            <br />더 정확한 분석을 원하시면 심층 분석을 진행해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
