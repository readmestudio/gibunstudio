'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardCarousel } from '@/components/husband-match/CardCarousel';
import { SurveyCard } from '@/components/husband-match/SurveyCard';
import { SURVEY_QUESTIONS } from '@/lib/husband-match/data/survey-questions';

interface SurveyClientProps {
  phase1Id: string;
  paymentId: string;
}

export function SurveyClient({ phase1Id, paymentId }: SurveyClientProps) {
  const router = useRouter();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async () => {
    // Validate all questions answered
    const unanswered = SURVEY_QUESTIONS.filter(
      (q) => !responses[q.id] || (typeof responses[q.id] === 'string' && !responses[q.id].trim())
    );

    if (unanswered.length > 0) {
      alert(`${unanswered.length}개의 질문에 답변해주세요.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase1_id: phase1Id,
          payment_id: paymentId,
          survey_responses: responses,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit survey');
      }

      await response.json();

      // 검토 후 마이페이지에서 확인하도록 안내 페이지로 이동
      router.push('/husband-match/report-pending');
    } catch (error) {
      console.error('Survey submission error:', error);
      alert('서베이 제출에 실패했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  // Create survey cards
  const surveyCards = SURVEY_QUESTIONS.map((question, index) => (
    <SurveyCard
      key={question.id}
      question={question}
      value={responses[question.id]}
      onChange={(value) => handleResponseChange(question.id, value)}
      questionNumber={index + 1}
      totalQuestions={SURVEY_QUESTIONS.length}
    />
  ));

  // Add submit card at the end
  const submitCard = (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden min-h-[500px] flex flex-col">
      <div className="p-8 pb-6 border-b border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
          서베이 완료
        </h2>
      </div>
      <div className="flex-1 p-8 flex flex-col justify-center items-center">
        <div className="text-center mb-8">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
            모든 질문에 답변하셨습니다!
          </h3>
          <p className="text-[var(--foreground)]/70">
            이제 심층 분석 리포트를 생성할 준비가 되었습니다.
          </p>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-4 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '분석 중...' : '심층 분석 시작하기'}
        </button>

        <p className="mt-6 text-sm text-[var(--foreground)]/60">
          분석은 약 30초 소요됩니다
        </p>
      </div>
    </div>
  );

  const allCards = [...surveyCards, submitCard];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            심층 분석 서베이
          </h1>
          <p className="text-[var(--foreground)]/70">
            9가지 질문에 솔직하게 답변해주세요
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {SURVEY_QUESTIONS.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  responses[SURVEY_QUESTIONS[index].id]
                    ? 'bg-green-500'
                    : index === currentCardIndex
                    ? 'bg-[var(--accent)]'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Card Carousel */}
        <CardCarousel
          cards={allCards}
          totalCards={SURVEY_QUESTIONS.length + 1}
        />

        {/* Progress Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--foreground)]/60">
            답변한 질문: {Object.keys(responses).length} / {SURVEY_QUESTIONS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
