const DATING_DOTS = ["성격", "관심사", "활동성", "취미"];

const MARRIAGE_AXES = [
  { icon: "🧬", name: "타고난 기질", desc: "유전적으로 타고난 행동 경향" },
  { icon: "⚡", name: "갈등 방식", desc: "싸울 때 나오는 자동 반응" },
  { icon: "🌙", name: "내면의 욕구", desc: "무의식적으로 채우고 싶은 것" },
  { icon: "🔥", name: "스트레스 반응", desc: "압박받을 때의 행동 패턴" },
  { icon: "🔗", name: "관계 패턴", desc: "친밀함을 다루는 고유한 방식" },
  { icon: "💎", name: "가치관", desc: "인생에서 절대 양보 못 하는 것" },
];

export default function ChemistrySection() {
  return (
    <section className="py-20">
      {/* 제목 */}
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-4"
        style={{ wordBreak: "keep-all" }}
      >
        결혼은 화학 반응입니다
      </h2>
      <p
        className="text-base text-[var(--foreground)]/60 text-center max-w-lg mx-auto mb-12 leading-relaxed"
        style={{ wordBreak: "keep-all" }}
      >
        같은 두 사람이라도, 연애라는 환경에서는 반응하지 않던 요인들이
        결혼이라는 특수한 상황에 놓이면 비로소 반응하기 시작합니다.
      </p>

      {/* Before / After 비교 */}
      <div className="grid gap-4 sm:grid-cols-2 mb-12">
        {/* Before — 연애 */}
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6">
          <p className="text-xs font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-3">
            연애할 땐
          </p>
          <h3
            className="text-base font-bold text-[var(--foreground)] mb-4"
            style={{ wordBreak: "keep-all" }}
          >
            이런 것만 잘 맞아도 돼요
          </h3>
          <div className="flex flex-wrap gap-2">
            {DATING_DOTS.map((dot) => (
              <span
                key={dot}
                className="inline-block px-3 py-1.5 text-sm rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)]/70"
              >
                {dot}
              </span>
            ))}
          </div>
        </div>

        {/* After — 결혼 */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] p-6">
          <p className="text-xs font-semibold text-[var(--foreground)]/40 uppercase tracking-wider mb-3">
            결혼하는 순간
          </p>
          <h3
            className="text-base font-bold text-[var(--foreground)] mb-2"
            style={{ wordBreak: "keep-all" }}
          >
            이 모든 게 맞아야 합니다
          </h3>
          <p className="text-xs text-[var(--foreground)]/50 mb-4">
            행복한 결혼 생활을 위해 꼭 체크해야 할 6가지 항목
          </p>
          <div className="flex flex-wrap gap-2">
            {MARRIAGE_AXES.map((axis) => (
              <span
                key={axis.name}
                className="inline-block px-3 py-1.5 text-sm rounded-full bg-[var(--foreground)] text-white"
              >
                {axis.icon} {axis.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 6축 카드 그리드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-12">
        {MARRIAGE_AXES.map((axis) => (
          <div
            key={axis.name}
            className="rounded-xl border-2 border-[var(--foreground)] p-4 transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]"
          >
            <span className="text-2xl mb-2 block">{axis.icon}</span>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-1">
              {axis.name}
            </h4>
            <p className="text-xs text-[var(--foreground)]/50 leading-relaxed">
              {axis.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 강조 박스 */}
      <div
        className="rounded-2xl bg-[var(--foreground)] text-white p-8 text-center"
        style={{ wordBreak: "keep-all" }}
      >
        <p className="text-base sm:text-lg font-semibold leading-relaxed">
          결혼이라는 환경에서 내가 어떤 반응을 일으키는 분자인지 알기 위해,
          <br />
          먼저 그 분자의 구조를 파악해야 합니다.
        </p>
      </div>
    </section>
  );
}
