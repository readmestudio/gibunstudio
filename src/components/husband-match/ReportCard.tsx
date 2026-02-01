'use client';

interface ReportCardProps {
  title: string;
  content: string;
  cardType?: 'intro' | 'analysis' | 'result' | 'insight';
  metadata?: {
    subtitle?: string;
    tags?: string[];
    highlight?: string;
  };
}

export function ReportCard({ title, content, cardType = 'analysis', metadata }: ReportCardProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `남편상 분석: ${title}`,
          text: content.substring(0, 200) + '...',
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled or failed');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${title}\n\n${content}`);
      alert('카드 내용이 클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-[var(--border)]">
        {metadata?.subtitle && (
          <p className="text-sm font-medium text-[var(--accent)] mb-2">
            {metadata.subtitle}
          </p>
        )}
        <h2 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
          {title}
        </h2>
        {metadata?.tags && metadata.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {metadata.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium bg-[var(--surface)] text-[var(--foreground)]/70 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-8">
        {metadata?.highlight && (
          <div className="mb-6 p-4 bg-[var(--accent)]/10 border-l-4 border-[var(--accent)] rounded-r">
            <p className="text-sm font-medium text-[var(--foreground)]">
              {metadata.highlight}
            </p>
          </div>
        )}
        <div className="prose prose-sm max-w-none">
          <div
            className="text-[var(--foreground)]/80 leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)]/30">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm font-medium text-[var(--accent)] hover:underline"
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
      </div>
    </div>
  );
}
