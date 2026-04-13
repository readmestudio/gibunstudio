import { WORKBOOK_SCREENSHOTS } from "@/lib/self-workshop/landing-data";

export function WorkbookPreviewSection() {
  // 무한 루프를 위해 2배로 복제
  const doubled = [...WORKBOOK_SCREENSHOTS, ...WORKBOOK_SCREENSHOTS];

  return (
    <section className="py-16 bg-[var(--foreground)] -mx-4 px-4 overflow-hidden">
      <p className="text-xs font-semibold tracking-widest uppercase text-white/40 mb-3 text-center">
        PREVIEW
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-10">
        실제 워크북 화면입니다
      </h2>

      {/* 롤링 컨테이너 */}
      <div className="relative group">
        <div
          className="flex gap-4"
          style={{
            animation: "slideScreenshots 30s linear infinite",
          }}
        >
          {doubled.map((item, i) => (
            <div
              key={`${item.label}-${i}`}
              className="flex-shrink-0 w-[240px] h-[340px] rounded-xl bg-white/10 border border-white/20 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <span className="text-white/60 text-lg font-bold">
                  {String(((i % WORKBOOK_SCREENSHOTS.length) + 1)).padStart(2, "0")}
                </span>
              </div>
              <p className="text-sm font-semibold text-white mb-1">
                {item.label}
              </p>
              <p className="text-xs text-white/50">{item.description}</p>
              <div className="mt-4 px-3 py-1 rounded-full border border-white/20 text-[10px] text-white/40">
                스크린샷 준비 중
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS 키프레임 */}
      <style jsx>{`
        @keyframes slideScreenshots {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .group:hover div[style] {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}
