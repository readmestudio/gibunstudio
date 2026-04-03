const CARDS = [
  {
    label: "A",
    title: "좋은 사람인 건 알아요",
    description:
      "하지만 나만의 기준이 없으니 흔들릴 수밖에 없습니다.",
  },
  {
    label: "B",
    title: "조건은 괜찮은데, 확신이 없다",
    description:
      "스펙은 충분한데 '이 사람이랑 결혼해도 괜찮을까?' 하는 불안이 사라지지 않습니다.",
  },
  {
    label: "C",
    title: "MBTI도 해봤지만, 결혼 상대에 대한 확신은 없었다",
    description:
      "'INFJ는 ENFP랑 잘 맞아요.' — 이런 말로는 부족합니다.\n나의 갈등 방식, 욕구, 두려움까지 알아야 진짜 판단이 됩니다.",
  },
];

export default function PainPointCards() {
  return (
    <section className="py-16">
      <div className="grid gap-4 sm:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border-2 border-[var(--foreground)] p-6 transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--foreground)] text-white text-xs font-bold mb-4">
              {card.label}
            </span>
            <h3
              className="text-base font-bold text-[var(--foreground)] mb-2"
              style={{ wordBreak: "keep-all" }}
            >
              {card.title}
            </h3>
            <p
              className="text-sm leading-relaxed text-[var(--foreground)]/60 whitespace-pre-line"
              style={{ wordBreak: "keep-all" }}
            >
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
