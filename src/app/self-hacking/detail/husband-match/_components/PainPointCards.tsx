const CARDS = [
  {
    label: "A",
    bgTitle: "좋은 사람인 건 알아요",
    highlight: "지금 만나는\n남자와 결혼해도\n될지 모르겠어요",
  },
  {
    label: "B",
    bgTitle: "조건은 괜찮은데, 확신이 없다",
    highlight: "늘 결혼\n이야기는\n나오는데 그\n다음을\n못넘어가요",
  },
  {
    label: "C",
    bgTitle: "MBTI도 해봤지만, 결혼 상대에 대한 확신은 없었다",
    highlight: "주변 압박\n때문에\n오래 만났으니까\n결혼하고 싶진\n않아요",
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
            className="relative rounded-2xl border-2 border-[var(--foreground)] p-6 min-h-[220px] flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]"
          >
            {/* 배경 흐린 제목 */}
            <p
              className="text-sm font-semibold text-[var(--foreground)]/15 leading-snug"
              style={{ wordBreak: "keep-all" }}
            >
              {card.bgTitle}
            </p>

            {/* 라벨 */}
            <span className="absolute top-5 left-5 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--foreground)] text-white text-xs font-bold">
              {card.label}
            </span>

            {/* 강조 문구 */}
            <p
              className="mt-4 text-xl font-bold text-[var(--foreground)] leading-snug whitespace-pre-line"
              style={{ wordBreak: "keep-all" }}
            >
              {card.highlight}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
