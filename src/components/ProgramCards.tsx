import Link from "next/link";
import { getHomePrograms } from "@/lib/programs/registry";
import type { ProgramDefinition } from "@/lib/programs/registry";

/** 프로그램 id → 아이콘 SVG 매핑 */
const ICON_MAP: Record<string, React.ReactNode> = {
  "husband-match": (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className="w-6 h-6" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  counseling: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className="w-6 h-6" viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
    </svg>
  ),
  "self-workshop": (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className="w-6 h-6" viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  geumjjok: (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className="w-6 h-6" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

function defaultIcon() {
  return (
    <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className="w-6 h-6" viewBox="0 0 24 24">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

function ProgramCard({ program }: { program: ProgramDefinition }) {
  const icon = ICON_MAP[program.id] ?? defaultIcon();

  const inner = (
    <>
      <div className="inline-flex items-center justify-center flex-shrink-0 w-12 h-12 mb-4 text-[var(--foreground)] rounded-full bg-[var(--surface)]">
        {icon}
      </div>
      <div className="flex-grow pl-6">
        <h3 className="text-2xl font-semibold text-[var(--foreground)] flex items-center gap-2">
          {program.title}
          {program.comingSoon && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--foreground)]/30 text-[var(--foreground)]/60">
              Coming Soon
            </span>
          )}
        </h3>
        <p className="mt-6 text-lg text-[var(--foreground)]/70">
          {program.description}
        </p>
        {!program.comingSoon && (
          <span className="mt-4 inline-flex items-center text-sm font-medium text-[var(--foreground)] hover:underline">
            자세히 보기 →
          </span>
        )}
      </div>
    </>
  );

  if (program.comingSoon) {
    return (
      <div className="flex p-4 lg:w-1/4 opacity-70 cursor-default">
        {inner}
      </div>
    );
  }

  return (
    <Link href={program.href} className="flex p-4 lg:w-1/4">
      {inner}
    </Link>
  );
}

export function ProgramCards() {
  const programs = getHomePrograms();

  return (
    <section id="features">
      <div className="container px-5 py-32 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-20 text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tighter text-[var(--foreground)] md:text-8xl lg:text-6xl">
            당신을 위한 프로그램
          </h2>
          <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70">
            나를 이해하고 성장하는 여정을 시작하세요.
          </p>
        </div>
        <div className="flex flex-wrap -mx-4 -mt-4 -mb-10 space-y-6 sm:-m-4 md:space-y-0">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </div>
    </section>
  );
}
