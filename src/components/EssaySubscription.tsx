import Image from "next/image";
import Link from "next/link";
import { getLatestEssays, formatEssayDate, type Essay } from "@/lib/essays/data";

export function EssayCard({ essay }: { essay: Essay }) {
  return (
    <Link href={`/essays/${essay.slug}`}>
      <div className="flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]">
        {essay.coverImage ? (
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-[var(--surface)]/50">
            <Image
              src={essay.coverImage}
              alt={essay.title}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ) : essay.illustration ? (
          <div className="flex items-center justify-center py-10 px-6">
            <Image
              src={`/doodles/${essay.illustration}.svg`}
              alt={essay.title}
              width={96}
              height={96}
              className="w-24 h-24 opacity-80"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 px-6 min-h-[176px] bg-[var(--surface)]/50">
            <p
              className="text-lg md:text-xl font-bold text-[var(--foreground)] text-center leading-snug italic"
              style={{ wordBreak: "keep-all" }}
            >
              {essay.title}
            </p>
          </div>
        )}

        <div className="flex flex-col flex-grow p-5 border-t border-[var(--foreground)]/10">
          <time
            dateTime={essay.publishedAt}
            className="text-xs text-[var(--foreground)]/50 mb-2 tracking-wide"
          >
            {formatEssayDate(essay.publishedAt)}
          </time>
          <h4
            className="text-lg font-semibold text-[var(--foreground)] mb-1"
            style={{ wordBreak: "keep-all" }}
          >
            {essay.title}
          </h4>
          <p
            className="text-sm leading-relaxed text-[var(--foreground)]/60 flex-grow line-clamp-2"
            style={{ wordBreak: "keep-all" }}
          >
            {essay.preview}
          </p>
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
            읽어보기 →
          </span>
        </div>
      </div>
    </Link>
  );
}

export async function EssaySubscription() {
  const latest = await getLatestEssays(3);

  return (
    <section className="bg-[var(--surface)]">
      <div className="container px-5 py-24 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-12 text-center">
          <strong className="mb-4 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/70">
            마음 구독 에세이
          </strong>
          <h2
            className="mb-4 text-3xl font-bold text-[var(--foreground)] md:text-5xl"
            style={{ wordBreak: "keep-all" }}
          >
            오늘의 마음에게,
            <br className="sm:hidden" /> 편지를 보내요
          </h2>
          <p
            className="mx-auto text-base leading-relaxed text-[var(--foreground)]/70 lg:w-2/3"
            style={{ wordBreak: "keep-all" }}
          >
            번아웃, 조급함, 완벽주의 — 조용히 덜어내고 싶은 마음들에게 건네는 짧은 편지를 모았어요.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {latest.map((essay) => (
            <EssayCard key={essay.slug} essay={essay} />
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            href="/essays"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:opacity-70 transition-opacity"
          >
            모든 에세이 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
