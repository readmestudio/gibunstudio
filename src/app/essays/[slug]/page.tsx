import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ESSAYS,
  formatEssayDate,
  getEssayBySlug,
} from "@/lib/essays/data";

type RouteParams = { slug: string };

export function generateStaticParams(): RouteParams[] {
  return ESSAYS.map((essay) => ({ slug: essay.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { slug } = await params;
  const essay = getEssayBySlug(slug);
  if (!essay) {
    return { title: "에세이를 찾을 수 없어요 | 기분 스튜디오" };
  }
  return {
    title: `${essay.title} | 마음 구독 에세이`,
    description: essay.preview,
  };
}

export default async function EssayDetailPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { slug } = await params;
  const essay = getEssayBySlug(slug);
  if (!essay) notFound();

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <article className="container px-5 py-24 mx-auto max-w-2xl">
        <div className="flex flex-col items-center text-center mb-12">
          <Image
            src={`/doodles/${essay.illustration}.svg`}
            alt={essay.title}
            width={96}
            height={96}
            className="w-24 h-24 opacity-80 mb-8"
          />
          <time
            dateTime={essay.publishedAt}
            className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-4"
          >
            {formatEssayDate(essay.publishedAt)}
          </time>
          <h1
            className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4 leading-snug"
            style={{ wordBreak: "keep-all" }}
          >
            {essay.title}
          </h1>
          <p
            className="text-base text-[var(--foreground)]/70 leading-relaxed"
            style={{ wordBreak: "keep-all" }}
          >
            {essay.preview}
          </p>
        </div>

        <div className="border-t-2 border-[var(--foreground)]/10 pt-12">
          {essay.body ? (
            <div
              className="whitespace-pre-wrap text-base md:text-lg leading-[1.9] text-[var(--foreground)]/85"
              style={{ wordBreak: "keep-all" }}
            >
              {essay.body}
            </div>
          ) : (
            <div className="flex flex-col items-center text-center py-12">
              <p
                className="text-base text-[var(--foreground)]/60 leading-relaxed mb-6"
                style={{ wordBreak: "keep-all" }}
              >
                이 편지는 곧 도착해요.
                <br />
                다음 편지에 먼저 이야기를 담아볼게요.
              </p>
              <Link
                href="/essays"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:opacity-70 transition-opacity"
              >
                다른 편지 보러 가기 →
              </Link>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-16">
          <Link
            href="/essays"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:opacity-70 transition-opacity"
          >
            ← 에세이 목록으로 돌아가기
          </Link>
        </div>
      </article>
    </main>
  );
}
