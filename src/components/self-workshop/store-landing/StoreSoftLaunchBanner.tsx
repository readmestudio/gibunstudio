/**
 * 페이지 최상단 띠 배너 — 소프트 런칭 안내.
 * 검정 fill + 흰 카피, 단일 라인 (모바일은 자동 줄바꿈).
 */
export function StoreSoftLaunchBanner() {
  return (
    <div
      role="note"
      aria-label="소프트 런칭 안내"
      className="bg-[var(--foreground)] text-white py-2.5 px-4 text-center text-[12px] sm:text-[13px] leading-relaxed break-keep"
    >
      현재 소수의 인원으로 소프트 런칭 후 고도화하고 있어요. 추후 판매가
      오픈되면 알림을 보내드릴게요.
    </div>
  );
}
