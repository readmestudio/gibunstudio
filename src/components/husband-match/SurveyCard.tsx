'use client';

import { useState } from 'react';

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'choice' | 'text' | 'scale';
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
}

interface SurveyCardProps {
  question: SurveyQuestion;
  value: any;
  onChange: (value: any) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function SurveyCard({
  question,
  value,
  onChange,
  questionNumber,
  totalQuestions,
}: SurveyCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-[var(--border)]">
        <p className="text-sm font-medium text-[var(--accent)] mb-2">
          질문 {questionNumber} / {totalQuestions}
        </p>
        <h2 className="text-xl font-bold text-[var(--foreground)] leading-tight">
          {question.question}
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {question.type === 'choice' && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onChange(option)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  value === option
                    ? 'border-[var(--accent)] bg-[var(--accent)]/5'
                    : 'border-[var(--border)] hover:border-[var(--accent)]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      value === option
                        ? 'border-[var(--accent)] bg-[var(--accent)]'
                        : 'border-[var(--foreground)]/30'
                    }`}
                  >
                    {value === option && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="text-[var(--foreground)]">{option}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {question.type === 'text' && (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.placeholder}
            rows={6}
            className="w-full p-4 border-2 border-[var(--border)] rounded-lg focus:border-[var(--accent)] focus:outline-none resize-none"
          />
        )}

        {question.type === 'scale' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--foreground)]/60">
                {question.min}
              </span>
              <input
                type="range"
                min={question.min || 1}
                max={question.max || 10}
                value={value || question.min || 1}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="flex-1 mx-4"
              />
              <span className="text-sm text-[var(--foreground)]/60">
                {question.max}
              </span>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold text-[var(--accent)]">
                {value || question.min || 1}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
