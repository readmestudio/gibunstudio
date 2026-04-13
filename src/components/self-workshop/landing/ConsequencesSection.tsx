import { CONSEQUENCES } from "@/lib/self-workshop/landing-data";

export function ConsequencesSection() {
  return (
    <section className="py-16">
      {/* 방치 경고 */}
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        WARNING
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-3"
        style={{ wordBreak: "keep-all" }}
      >
        이 패턴을 방치하면
      </h2>
      <p className="text-sm text-[var(--foreground)]/60 text-center mb-8 max-w-md mx-auto">
        성취 중독은 의지로 해결되지 않습니다. 패턴을 인식하지 못하면 시간이
        지날수록 더 강해져요.
      </p>

      <div className="grid grid-cols-1 gap-3 mb-12">
        {CONSEQUENCES.map((item) => (
          <div
            key={item.title}
            className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5"
          >
            <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
              {item.title}
            </p>
            <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* 전환 */}
      <div className="mx-auto h-[3px] w-8 bg-[var(--foreground)]/30 rounded-full mb-12" />

      <h3
        className="text-xl sm:text-2xl font-bold text-[var(--foreground)] text-center mb-4"
        style={{ wordBreak: "keep-all" }}
      >
        하지만, 패턴을 알면 바꿀 수 있어요
      </h3>
      <p
        className="text-sm leading-relaxed text-[var(--foreground)]/70 text-center max-w-md mx-auto"
        style={{ wordBreak: "keep-all" }}
      >
        이 워크북은 CBT(인지행동치료) 기반으로, 당신의 성취 패턴이 어디서
        시작되고 어떻게 반복되는지를 직접 추적합니다. 패턴을 인식하는 것만으로도
        자동적 사고에서 한 발짝 물러설 수 있어요.
      </p>
    </section>
  );
}
