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
      {/* 섹션 제목 */}
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-4"
        style={{ wordBreak: "keep-all" }}
      >
        이 검사가 분석하는 6가지
      </h2>
      <p
        className="text-base text-[var(--foreground)]/60 text-center max-w-lg mx-auto mb-12 leading-relaxed"
        style={{ wordBreak: "keep-all" }}
      >
        유튜브 구독 채널에서 읽어내는 당신의 성격 구조입니다.
      </p>

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
          결혼 앞에서 흔들리지 않으려면,
          <br />
          먼저 나를 정확히 알아야 합니다.
        </p>
      </div>
    </section>
  );
}
