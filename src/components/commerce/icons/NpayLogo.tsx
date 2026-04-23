/**
 * 네이버페이 로고 (흰 배경 원형 N + pay 텍스트)
 * 네이버페이 가맹점 브랜드 가이드 참고한 단순 SVG wrapper.
 * 버튼 내부에서 높이 기준으로 자동 스케일.
 */

interface NpayLogoProps {
  className?: string;
}

export function NpayLogo({ className = "h-4" }: NpayLogoProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold ${className}`}
      aria-label="네이버페이"
    >
      <span className="inline-flex h-[1.1em] w-[1.1em] items-center justify-center rounded-full bg-white text-[#03C75A]">
        <svg
          viewBox="0 0 16 16"
          className="h-[0.7em] w-[0.7em]"
          fill="currentColor"
          aria-hidden
        >
          <path d="M3 2v12h3.2V8.4L10.1 14H13V2H9.8v5.6L5.9 2H3z" />
        </svg>
      </span>
      <span className="text-[0.95em] tracking-tight">pay</span>
    </span>
  );
}
