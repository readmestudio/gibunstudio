'use client';

import Link from 'next/link';
import { CardCarousel } from '@/components/husband-match/CardCarousel';
import { ReportCard } from '@/components/husband-match/ReportCard';
import { Phase2Result } from '@/lib/husband-match/types';

interface Phase2ReportClientProps {
  result: Phase2Result & {
    phase1_results: any;
  };
}

export function Phase2ReportClient({ result }: Phase2ReportClientProps) {
  // Create card components from deep cards
  const deepCards = result.deep_cards.map((card) => (
    <ReportCard
      key={card.card_number}
      title={card.title}
      content={card.content}
      cardType={card.card_type as any}
      metadata={{
        subtitle: card.subtitle,
        tags: card.tags,
        highlight: card.highlight,
      }}
    />
  ));

  // Add completion card
  const completionCard = (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-sm border border-purple-200 overflow-hidden min-h-[500px] flex flex-col">
      <div className="p-8 pb-6 border-b border-purple-200">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          분석이 완료되었습니다! 🎉
        </h2>
      </div>
      <div className="flex-1 p-8 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            심층 분석이 완료되었습니다
          </h3>
          <p className="text-gray-700 mb-6">
            YouTube 데이터와 설문을 교차 분석하여 당신의 진짜 모습과 이상적인 파트너상을
            찾았습니다.
          </p>

          {/* Insights Summary */}
          <div className="bg-white rounded-xl border border-purple-200 p-6 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">핵심 인사이트</h4>
            <div className="space-y-2 text-sm text-left">
              {result.cross_validation_insights.hidden_desires.map(
                (desire, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-purple-600 mt-0.5">•</span>
                    <span className="text-gray-700">{desire}</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Authenticity Score */}
          <div className="mb-8">
            <p className="text-sm text-gray-600 mb-2">진정성 점수</p>
            <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500"
                style={{
                  width: `${result.cross_validation_insights.authenticity_score * 100}%`,
                }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {(result.cross_validation_insights.authenticity_score * 100).toFixed(0)}% - YouTube와
              설문의 일치도
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors text-center"
          >
            홈으로 돌아가기
          </Link>
          <button
            onClick={() => window.print()}
            className="w-full py-3 bg-white text-gray-900 font-medium rounded-lg border-2 border-gray-300 hover:border-purple-600 transition-colors"
          >
            리포트 저장하기
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-600 text-center">
          이 리포트는 언제든지 다시 볼 수 있습니다
        </p>
      </div>
    </div>
  );

  const allCards = [...deepCards, completionCard];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-4 border border-purple-200">
            <span className="text-2xl">✨</span>
            <span className="text-sm font-medium text-purple-900">Deep Analysis</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            심층 분석 리포트
          </h1>
          <p className="text-gray-700">
            YouTube + 설문 교차 분석 결과
          </p>

          {/* Stats */}
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div>
              <p className="text-gray-600">분석한 채널</p>
              <p className="font-bold text-purple-600">
                {(Object.values(result.phase1_results.channel_categories) as number[]).reduce(
                  (a: number, b: number) => a + b,
                  0
                )}
                개
              </p>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div>
              <p className="text-gray-600">응답한 질문</p>
              <p className="font-bold text-purple-600">9개</p>
            </div>
            <div className="w-px h-8 bg-gray-300"></div>
            <div>
              <p className="text-gray-600">매칭 타입</p>
              <p className="font-bold text-purple-600">
                {result.phase1_results.matched_husband_type.split('_')[0]}
              </p>
            </div>
          </div>
        </div>

        {/* Card Carousel */}
        <CardCarousel cards={allCards} totalCards={result.deep_cards.length + 1} />

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            이 분석은 AI를 활용하여 생성되었으며, 참고용으로만 사용하시기 바랍니다.
          </p>
        </div>
      </div>
    </div>
  );
}
