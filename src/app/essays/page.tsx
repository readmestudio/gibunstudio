import type { Metadata } from "next";
import Link from "next/link";
import { ESSAYS } from "@/lib/essays/data";
import { EssayCard } from "@/components/EssaySubscription";
import { NewsletterSubscribeForm } from "@/components/NewsletterSubscribeForm";

export const metadata: Metadata = {
  title: "마음 구독 에세이 | 기분 스튜디오",
  description:
    "번아웃, 조급함, 완벽주의 — 조용히 덜어내고 싶은 마음들에게 건네는 짧은 편지 모음.",
};

export default function EssaysIndexPage() {
  const essays = [...ESSAYS].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container px-5 py-24 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-12 text-center max-w-3xl mx-auto">
          <strong className="mb-4 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/70">
            마음 구독 에세이
          </strong>
          <h1
            className="mb-4 text-3xl font-bold text-[var(--foreground)] md:text-5xl"
            style={{ wordBreak: "keep-all" }}
          >
            오늘의 마음에게, 편지를 보내요
          </h1>
          <p
            className="mx-auto text-base leading-relaxed text-[var(--foreground)]/70"
            style={{ wordBreak: "keep-all" }}
          >
            기분 스튜디오가 매주 한 편씩, 조용히 덜어내고 싶은 마음에게 건네는 편지를 모아 올려요.
          </p>
        </div>

        {/* 구독 신청 배너 */}
        <div className="max-w-2xl mx-auto mb-16">
          <NewsletterSubscribeForm variant="banner" />
        </div>

        {essays.length === 0 ? (
          <p className="text-center text-[var(--foreground)]/60 py-16">
            곧 첫 번째 편지가 도착합니다.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {essays.map((essay) => (
              <EssayCard key={essay.slug} essay={essay} />
            ))}
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:opacity-70 transition-opacity"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
