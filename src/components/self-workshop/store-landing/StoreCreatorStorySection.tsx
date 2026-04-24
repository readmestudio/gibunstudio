import { CREATOR_STORY_PARAGRAPHS } from "./content";

/**
 * [05] 창작자 스토리
 *
 * 담담하고 진솔한 톤. "왜 만들었는지"가 먼저 전달되도록 구성.
 */
export function StoreCreatorStorySection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        MIND FIRST
      </p>
      <h2 className="text-center text-2xl sm:text-3xl font-bold leading-[1.35] text-[var(--foreground)] break-keep">
        결국 퍼포먼스를 잘 내기 위해서는
        <br />
        마음이 먼저였습니다
      </h2>

      <div className="mt-12 rounded-2xl border-2 border-[var(--foreground)]/15 bg-[var(--surface)] p-8 sm:p-10">
        {CREATOR_STORY_PARAGRAPHS.map((paragraph, idx) => (
          <p
            key={idx}
            className={`text-base sm:text-lg leading-relaxed text-[var(--foreground)]/80 break-keep ${
              idx > 0 ? "mt-5" : ""
            } ${paragraph.highlight ? "font-semibold text-[var(--foreground)]" : ""}`}
          >
            {paragraph.text}
          </p>
        ))}

        <p className="mt-8 text-right text-sm text-[var(--foreground)]/50">
          — 기분 스튜디오 창작자 드림
        </p>
      </div>
    </section>
  );
}
