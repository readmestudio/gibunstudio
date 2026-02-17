/**
 * 셀프 해킹으로 만나는 진짜 나 — 4개 아이콘 카드 섹션
 * 브랜드 스토리(Hack yourself) 뒤에 삽입
 */

const ELEMENTS = [
  {
    title: "핵심 신념",
    description:
      "\"나는 사랑받을 자격이 없다\" 같은 무의식 깊이 자리 잡은 믿음. 모든 패턴의 뿌리입니다.",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    title: "자동 사고",
    description:
      "의식하지 못한 채 자동으로 떠오르는 생각들. 당신의 감정과 행동을 순식간에 지배합니다.",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    title: "감정 패턴",
    description:
      "특정 상황에서 반복적으로 나타나는 감정 반응. 왜 같은 상황에서 같은 감정이 드는지의 열쇠입니다.",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    title: "애착 유형",
    description:
      "관계에서의 연결·회피·불안 패턴. 왜 같은 유형의 사람에게 끌리는지를 설명합니다.",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0z" />
      </svg>
    ),
  },
];

export function SelfHackingElements() {
  return (
    <section>
      <div className="container px-5 py-24 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-12 text-center">
          <h2
            className="mb-6 text-4xl font-bold text-[var(--foreground)] md:text-8xl lg:text-6xl"
            style={{ wordBreak: "keep-all" }}
          >
            셀프 해킹으로 만나는 진짜 나
          </h2>
          <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2">
            반복되는 패턴 뒤에는 이런 것들이 숨어 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
          {ELEMENTS.map((el) => (
            <div
              key={el.title}
              className="flex flex-col items-center p-6 text-center border border-[var(--border)] rounded-2xl"
            >
              <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-[var(--surface)] text-[var(--foreground)]">
                {el.icon}
              </div>
              <h3 className="mb-3 text-lg font-semibold text-[var(--foreground)]">
                {el.title}
              </h3>
              <p
                className="text-sm leading-relaxed text-[var(--foreground)]/70"
                style={{ wordBreak: "keep-all" }}
              >
                {el.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
