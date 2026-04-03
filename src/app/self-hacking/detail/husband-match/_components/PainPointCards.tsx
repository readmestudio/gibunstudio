const CARDS = [
  {
    label: "A",
    quote: "지금 만나는\n남자와 결혼해도\n될지 모르겠어요",
  },
  {
    label: "B",
    quote: "늘 결혼\n이야기는\n나오는데 그\n다음을\n못넘어가요",
  },
  {
    label: "C",
    quote: "주변 압박\n때문에\n오래 만났으니까\n결혼하고 싶진\n않아요",
  },
];

export default function PainPointCards() {
  return (
    <section className="py-16">
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] mb-10"
        style={{ wordBreak: "keep-all" }}
      >
        나에게 맞는 배우자 분석 이런 분께 추천해요
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.label}
            className="relative rounded-2xl border-2 border-[var(--foreground)] p-6 min-h-[220px] flex flex-col transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]"
          >
            {/* 라벨 */}
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--foreground)] text-white text-xs font-bold mb-6">
              {card.label}
            </span>

            {/* 유저 후기 */}
            <p
              className="text-xl font-bold text-[var(--foreground)] leading-snug whitespace-pre-line"
              style={{ wordBreak: "keep-all" }}
            >
              &ldquo;{card.quote}&rdquo;
            </p>
          </div>
        ))}
      </div>

      {/* 콜아웃 */}
      <div className="mt-12 py-12 text-center border-y border-[var(--border)]">
        <p
          className="text-lg font-semibold text-[var(--foreground)] mb-8"
          style={{ wordBreak: "keep-all" }}
        >
          이 분석을 통해 이런 것들을 알 수 있어요
        </p>
        <ol className="inline-block text-left space-y-2">
          <li className="text-base text-[var(--foreground)]/70" style={{ wordBreak: "keep-all" }}>
            <span className="font-semibold text-[var(--foreground)]">1.</span>{"  "}결혼을 결정짓는 나의 주요 성격 및 기질
          </li>
          <li className="text-base text-[var(--foreground)]/70" style={{ wordBreak: "keep-all" }}>
            <span className="font-semibold text-[var(--foreground)]">2.</span>{"  "}나의 연애 스타일, 갈등 타입, 결혼까지 가는 조건
          </li>
          <li className="text-base text-[var(--foreground)]/70" style={{ wordBreak: "keep-all" }}>
            <span className="font-semibold text-[var(--foreground)]">3.</span>{"  "}나에게 잘 맞는 배우자 타입
          </li>
        </ol>
      </div>
    </section>
  );
}
