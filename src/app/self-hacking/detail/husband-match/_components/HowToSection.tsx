const STEPS = [
  {
    num: "01",
    title: "유튜브 구독 리스트를 캡처해요",
    desc: "유튜브 앱에서 구독 > 전체 > 관련성 순으로 설정하고, 보이는 목록을 스크린샷으로 찍어주세요.",
    visual: "video" as const,
  },
  {
    num: "02",
    title: "스크린샷을 업로드해요",
    desc: "캡처한 이미지 3장 이상을 올려주세요. 채널이 많을수록 분석이 정확해져요.",
    visual: "upload" as const,
  },
  {
    num: "03",
    title: "가입하고 분석 리포트를 받으면 끝!",
    desc: "카카오로 간편 가입 후, AI가 즉시 9장의 분석 카드를 만들어드려요.",
    visual: "done" as const,
  },
];

export default function HowToSection() {
  return (
    <section className="py-20">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        진행 방법
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-12 leading-snug"
        style={{ wordBreak: "keep-all" }}
      >
        검사는 어떻게 진행되나요?
      </h2>

      <div className="space-y-16">
        {STEPS.map((step) => (
          <div key={step.num}>
            {/* 스텝 헤더 */}
            <div className="flex items-center gap-3 mb-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--foreground)] text-white text-sm font-bold flex items-center justify-center">
                {step.num}
              </span>
              <h3
                className="text-lg font-bold text-[var(--foreground)]"
                style={{ wordBreak: "keep-all" }}
              >
                {step.title}
              </h3>
            </div>
            <p
              className="text-base text-[var(--foreground)]/60 mb-6 pl-11"
              style={{ wordBreak: "keep-all" }}
            >
              {step.desc}
            </p>

            {/* 시각 요소 */}
            {step.visual === "video" && (
              <div className="flex justify-center">
                <div className="w-[220px] rounded-[2.5rem] border-2 border-[var(--foreground)] bg-[var(--foreground)] p-2">
                  <div className="mx-auto w-20 h-4 rounded-b-lg bg-[var(--foreground)] relative z-10" />
                  <div className="rounded-[2rem] overflow-hidden bg-white -mt-1">
                    <video autoPlay loop muted playsInline className="w-full h-auto">
                      <source src="/videos/capture-guide.mov" type="video/mp4" />
                    </video>
                  </div>
                  <div className="mt-2 mx-auto w-20 h-1 rounded-full bg-white/30" />
                </div>
              </div>
            )}

            {step.visual === "upload" && (
              <div className="pl-11">
                <div className="rounded-xl border-2 border-dashed border-[var(--foreground)]/20 p-6 text-center">
                  <svg className="w-10 h-10 mx-auto mb-3 text-[var(--foreground)]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-sm text-[var(--foreground)]/40">
                    스크린샷 3장 이상 업로드
                  </p>
                </div>
              </div>
            )}

            {step.visual === "done" && (
              <div className="pl-11">
                <div className="rounded-xl bg-[var(--foreground)] text-white p-6 text-center">
                  <p className="text-3xl mb-2">🎉</p>
                  <p
                    className="text-base font-semibold"
                    style={{ wordBreak: "keep-all" }}
                  >
                    9장의 분석 카드가 즉시 발급됩니다
                  </p>
                  <p className="text-sm text-white/60 mt-1">완전 무료 · 약 3분 소요</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
