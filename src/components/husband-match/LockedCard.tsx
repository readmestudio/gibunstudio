'use client';

/**
 * 잠긴 카드 컴포넌트 — 블러 처리된 미리보기 + 결제 유도
 * 딜브레이커 카드(7번)에 사용
 */

interface LockedCardProps {
  title: string;
  subtitle?: string;
  /** 블러 처리할 미리보기 텍스트 */
  previewText: string;
  onUnlock: () => void;
}

export function LockedCard({ title, subtitle, previewText, onUnlock }: LockedCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-[var(--foreground)] overflow-hidden min-h-[500px] flex flex-col relative">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-[var(--border)] flex-shrink-0">
        {subtitle && (
          <p className="text-sm font-medium text-[var(--foreground)]/60 mb-2">
            {subtitle}
          </p>
        )}
        <h2 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
          {title}
        </h2>
      </div>

      {/* 블러 처리된 본문 미리보기 */}
      <div className="flex-1 p-8 relative">
        <div className="blur-[6px] select-none pointer-events-none">
          <p className="text-[var(--foreground)]/80 leading-relaxed whitespace-pre-wrap text-sm">
            {previewText}
          </p>
        </div>

        {/* 오버레이: 잠금 아이콘 + CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white/30 via-white/80 to-white px-8">
          {/* 잠금 아이콘 */}
          <div className="w-16 h-16 rounded-full border-2 border-[var(--foreground)] flex items-center justify-center mb-5">
            <svg
              className="w-7 h-7 text-[var(--foreground)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          <p
            className="text-center text-base font-semibold text-[var(--foreground)] mb-2 leading-snug"
            style={{ wordBreak: 'keep-all' }}
          >
            이 카드는 심층 분석에서 열립니다
          </p>
          <p
            className="text-center text-sm text-[var(--foreground)]/60 mb-6 max-w-[260px] leading-relaxed"
            style={{ wordBreak: 'keep-all' }}
          >
            당신이 참을 수 없는 것의 뿌리,
            그리고 그게 관계에 미치는 영향까지.
          </p>

          <button
            onClick={onUnlock}
            className="inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-white bg-[var(--foreground)] rounded-full hover:opacity-80 transition-opacity"
          >
            심층 분석 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}
