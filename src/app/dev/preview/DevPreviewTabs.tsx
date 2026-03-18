'use client';

import { useState } from 'react';
import { ReportCard } from '@/components/husband-match/ReportCard';

interface DevPreviewTabsProps {
  phase1Result: any;
  phase2Result: any;
}

export function DevPreviewTabs({ phase1Result, phase2Result }: DevPreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<'phase1' | 'phase2'>('phase1');

  const hexagonData = {
    labels: ['자기초월', '자율성', '자극추구', '위험회피', '인내력', '연대감'],
    values: [
      phase1Result.tci_scores.ST,
      phase1Result.tci_scores.SD,
      phase1Result.tci_scores.NS,
      phase1Result.tci_scores.HA,
      phase1Result.tci_scores.P,
      phase1Result.tci_scores.CO,
    ],
  };

  const phase1Cards = phase1Result.cards;
  const phase2Cards = phase2Result.deep_cards;

  return (
    <div className="min-h-screen bg-white">
      {/* 탭 네비게이션 */}
      <div className="sticky top-0 z-50 bg-white border-b-2 border-[var(--foreground)]">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setActiveTab('phase1')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${
              activeTab === 'phase1'
                ? 'bg-[var(--foreground)] text-white'
                : 'text-[var(--foreground)]/60 hover:bg-[var(--surface)]'
            }`}
          >
            Phase 1 ({phase1Cards.length}장)
          </button>
          <button
            onClick={() => setActiveTab('phase2')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${
              activeTab === 'phase2'
                ? 'bg-[var(--foreground)] text-white'
                : 'text-[var(--foreground)]/60 hover:bg-[var(--surface)]'
            }`}
          >
            Phase 2 ({phase2Cards.length}장)
          </button>
        </div>
      </div>

      {/* 카드 목록 */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {activeTab === 'phase1' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                남편상 분석 리포트
              </h1>
              <p className="text-sm text-[var(--foreground)]/60">
                매칭: {phase1Result.matched_husband_type} ({Math.round(phase1Result.match_score * 100)}%)
                · MBTI: {phase1Result.mbti_type}
              </p>
            </div>
            <div className="space-y-6">
              {phase1Cards.map((card: any, i: number) => (
                <div key={card.card_number}>
                  <p className="text-xs text-[var(--foreground)]/40 text-center mb-2">
                    {i + 1} / {phase1Cards.length}
                  </p>
                  <ReportCard
                    title={card.title}
                    content={card.content}
                    cardNumber={card.card_number}
                    cardType={card.card_type}
                    metadata={{
                      subtitle: card.subtitle,
                      tags: card.tags,
                      highlight: card.highlight,
                    }}
                    hexagonData={card.card_number === 2 ? hexagonData : undefined}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'phase2' && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                심층 분석 리포트
              </h1>
              <p className="text-sm text-[var(--foreground)]/60">
                자기일치도: {Math.round(phase2Result.cross_validation_insights.authenticity_score * 100)}%
                · 숨겨진 욕구: {phase2Result.cross_validation_insights.hidden_desires.length}개
              </p>
            </div>
            <div className="space-y-6">
              {phase2Cards.map((card: any, i: number) => (
                <div key={card.card_number}>
                  <p className="text-xs text-[var(--foreground)]/40 text-center mb-2">
                    {i + 1} / {phase2Cards.length}
                  </p>
                  <ReportCard
                    title={card.title}
                    content={card.content}
                    cardType={card.card_type}
                    metadata={{
                      subtitle: card.subtitle,
                      tags: card.tags,
                      highlight: card.highlight,
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* DEV 뱃지 */}
      <div className="fixed bottom-4 right-4 z-50 bg-[var(--foreground)] text-white px-3 py-1.5 rounded-full text-xs font-bold opacity-70">
        DEV PREVIEW
      </div>
    </div>
  );
}
