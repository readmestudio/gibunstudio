/**
 * 문제 현상 섹션 — "왜 성취해도 공허할까"
 *
 * 독자의 증상을 객관적으로 설명하고 "당신이 이상한 게 아니다"라는 안도감을 준다.
 * 중앙 정렬 에세이, 중간에 풀폭 인용구 배치.
 */
export function ProblemStatementSection() {
  return (
    <section className="mx-auto max-w-[680px] px-4 py-20">
      {/* 라벨 */}
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        THE PROBLEM
      </p>

      {/* H1 */}
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-[1.35] break-keep">
        성취해도 채워지지 않는 이유,
        <br />
        당신의 의지 문제가 아닙니다.
      </h2>

      {/* 본문 1 */}
      <div className="mt-12 space-y-6 text-base sm:text-lg leading-[1.8] text-[var(--foreground)]/75 break-keep">
        <p>
          프로젝트를 성공시켜도 기쁨은 하루를 넘기지 못합니다.
          <br />
          칭찬을 들어도 &apos;이번엔 운이 좋았을 뿐&apos;이라는 생각이 먼저
          듭니다.
          <br />
          쉬려고 하면 뒤처질 것 같은 불안이 밀려옵니다.
        </p>

        <p>
          이것은 당신이 게으르거나 약해서가 아닙니다.
          <br />
          &apos;성취하지 않으면 가치가 없다&apos;는 깊은 믿음이 당신의 뇌를
          장악하고 있기 때문입니다.
        </p>
      </div>

      {/* 풀폭 인용구 */}
      <blockquote
        className="my-14 border-y-2 border-[var(--foreground)]/15 py-10 text-center text-2xl sm:text-3xl leading-[1.5] text-[var(--foreground)] italic break-keep"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        <span aria-hidden className="block text-4xl text-[var(--foreground)]/30 mb-2">
          &ldquo;
        </span>
        문제는 당신의 의지가 아니라,
        <br />
        당신의 뇌에 새겨진 패턴입니다.
      </blockquote>

      {/* 본문 2 */}
      <div className="space-y-6 text-base sm:text-lg leading-[1.8] text-[var(--foreground)]/75 break-keep">
        <p>
          심리학에서는 이를 &apos;성취 중독(Achievement Addiction)&apos;이라
          부릅니다.
          <br />
          단순히 열심히 사는 것과는 다릅니다. 열심히 사는 사람은 쉴 줄 알지만,
          성취 중독은 쉬는 것 자체가 공포가 됩니다.
        </p>
      </div>
    </section>
  );
}
