export default function YoutubeAnalysis() {
  return (
    <section className="py-20">
      <div className="grid gap-10 lg:grid-cols-2 items-center">
        {/* 텍스트 */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
            나를 읽는 방법
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-4 leading-snug whitespace-pre-line"
            style={{ wordBreak: "keep-all" }}
          >
            {"유튜브 구독 목록을 통해\n당신에 대해 먼저 알아봅니다"}
          </h2>
          <p
            className="text-base leading-relaxed text-[var(--foreground)]/60 mb-6"
            style={{ wordBreak: "keep-all" }}
          >
            당신이 구독하는 채널들은 결코 무작위가 아닙니다. 새벽에 혼자 트는
            영상, 반복해서 찾게 되는 주제 — 이것이 당신의 무의식적 욕구와
            기질을 그대로 반영합니다.
          </p>
          <p
            className="text-base leading-relaxed text-[var(--foreground)]/60"
            style={{ wordBreak: "keep-all" }}
          >
            유튜브 구독 채널을 TCI 기질 이론으로 분석해 당신의 성격 구조를
            파악합니다. 결혼이라는 환경에서 나는 어떤 사람인지, 그 전체 윤곽을
            그립니다.
          </p>
        </div>

        {/* 폰 목업 + 영상 */}
        <div className="flex justify-center">
          <div className="w-[260px] rounded-[2.5rem] border-2 border-[var(--foreground)] bg-[var(--foreground)] p-2 shadow-[6px_6px_0_var(--foreground)]/10">
            {/* 노치 */}
            <div className="mx-auto w-24 h-5 rounded-b-xl bg-[var(--foreground)] relative z-10" />
            {/* 영상 */}
            <div className="rounded-[2rem] overflow-hidden bg-white -mt-1">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              >
                <source src="/videos/report-demo.mov" type="video/mp4" />
              </video>
            </div>
            {/* 하단 바 */}
            <div className="mt-2 mx-auto w-28 h-1 rounded-full bg-white/30" />
          </div>
        </div>
      </div>
    </section>
  );
}
