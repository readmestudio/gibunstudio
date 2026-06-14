'use client';

/**
 * 텍스트 리포트 카드 컴포넌트
 * 구성: 로마숫자 챕터 + 제목 + 본문 (일러스트 없는 텍스트 전용)
 * 내용 길이만큼 카드가 펼쳐지고, 페이지 스크롤로 전체를 읽는 구조
 */

interface ReportCardPageProps {
  /** 로마숫자 챕터 (예: "I", "II") */
  chapterRoman: string;
  /** 챕터 subtitle (예: "KIM JIAN의 관계 화학 리포트") */
  subtitle: string;
  /** 카드 제목 (큰 글씨) */
  title: string;
  /** 본문 텍스트 (줄바꿈 포함 plain text) */
  body: string;
  /** → 요약 한 줄 */
  arrowSummary?: string;
  /** 현재 페이지 번호 (1-based) */
  pageNumber: number;
  /** 전체 페이지 수 */
  totalPages: number;
}

// 로마숫자 변환
const ROMAN_NUMERALS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
  6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX',
};

export function toRoman(n: number): string {
  return ROMAN_NUMERALS[n] || String(n);
}

export function ReportCardPage({
  chapterRoman,
  subtitle,
  title,
  body,
  arrowSummary,
  pageNumber,
  totalPages,
}: ReportCardPageProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `남편상 분석: ${title}`,
          text: body.substring(0, 200) + '...',
          url: window.location.href,
        });
      } catch {
        // 공유 취소
      }
    } else {
      navigator.clipboard.writeText(`${title}\n\n${body}`);
      alert('카드 내용이 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[var(--foreground)] overflow-hidden flex flex-col">
      {/* 페이지 번호 */}
      <div className="flex-shrink-0 pt-6 px-8 relative h-10">
        <span className="absolute top-6 right-8 text-xs font-medium text-[var(--foreground)]/40 tracking-wider">
          {pageNumber} / {totalPages}
        </span>
      </div>

      {/* 로마숫자 + subtitle + 구분선 + title */}
      <div className="flex-shrink-0 px-8 pb-3 text-center">
        <p className="text-2xl font-bold text-[var(--foreground)] tracking-widest mb-1">
          {chapterRoman}
        </p>
        <p className="text-xs font-medium text-[var(--foreground)]/50 tracking-[0.2em] uppercase mb-3">
          {subtitle}
        </p>
        <div className="w-12 h-[2px] bg-[var(--foreground)]/20 mx-auto mb-4" />
        <h2
          className="text-xl font-bold text-[var(--foreground)] leading-snug whitespace-pre-wrap"
          style={{ wordBreak: 'keep-all' }}
        >
          {title}
        </h2>
      </div>

      {/* 본문 — 내용 길이만큼 펼쳐짐 (스크롤로 읽기) */}
      <div className="px-8 py-3">
        {arrowSummary && (
          <p
            className="text-xs font-medium text-[var(--foreground)]/50 mb-3 italic"
            style={{ wordBreak: 'keep-all' }}
          >
            → {arrowSummary}
          </p>
        )}
        <p
          className="text-[15px] leading-[1.9] text-[var(--foreground)]/80 whitespace-pre-wrap"
          style={{ wordBreak: 'keep-all' }}
        >
          {body}
        </p>
      </div>

      {/* 하단: 공유 버튼 + 워터마크 */}
      <div className="flex-shrink-0 px-8 pb-6 pt-4 mt-2 flex flex-col items-center gap-2">
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[var(--foreground)] text-white text-sm font-medium rounded-full hover:opacity-80 transition-opacity"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          공유하기
        </button>
        <p className="text-[10px] text-[var(--foreground)]/30 tracking-wider">
          inga.so/gibun · 기분 분석
        </p>
      </div>
    </div>
  );
}
