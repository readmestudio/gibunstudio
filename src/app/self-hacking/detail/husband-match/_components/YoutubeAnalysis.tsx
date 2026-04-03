const CHANNELS = [
  { name: "자기계발 채널", tag: "자율성 高", color: "bg-[var(--foreground)]" },
  { name: "심리학 이야기", tag: "연대감 高", color: "bg-[var(--foreground)]/80" },
  { name: "일상 브이로그", tag: "사회적민감성", color: "bg-[var(--foreground)]/60" },
  { name: "경제·재테크", tag: "위험회피 低", color: "bg-[var(--foreground)]/80" },
  { name: "여행 다큐", tag: "자극추구 高", color: "bg-[var(--foreground)]" },
];

export default function YoutubeAnalysis() {
  return (
    <section className="py-20">
      <div className="grid gap-10 lg:grid-cols-2 items-center">
        {/* 텍스트 */}
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
            분자 구조 파악
          </p>
          <h2
            className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-4 leading-snug"
            style={{ wordBreak: "keep-all" }}
          >
            유튜브 구독 목록이 알고 있어요
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
            유튜브 구독 채널을 TCI 기질 이론으로 분석해 당신의 성격 분자 구조를
            파악합니다. 결혼이라는 환경에서 나는 어떤 반응을 일으키는 분자인지,
            그 전체 윤곽을 그립니다.
          </p>
        </div>

        {/* 폰 목업 */}
        <div className="flex justify-center">
          <div className="w-[260px] rounded-[2rem] border-2 border-[var(--foreground)] bg-white p-3 shadow-[6px_6px_0_var(--foreground)]/10">
            {/* 노치 */}
            <div className="mx-auto w-24 h-5 rounded-b-xl bg-[var(--foreground)] mb-4" />
            {/* 채널 리스트 */}
            <div className="space-y-2.5 px-1">
              {CHANNELS.map((ch) => (
                <div
                  key={ch.name}
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-2.5"
                >
                  {/* 채널 아이콘 */}
                  <div className={`w-8 h-8 rounded-full ${ch.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                      {ch.name}
                    </p>
                  </div>
                  <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)]">
                    {ch.tag}
                  </span>
                </div>
              ))}
            </div>
            {/* 하단 바 */}
            <div className="mt-4 mx-auto w-28 h-1 rounded-full bg-[var(--foreground)]/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
