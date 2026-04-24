import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllEssays } from "@/lib/essays/data";
import { EssayCard } from "@/components/EssaySubscription";
import { NewsletterSubscribeForm } from "@/components/NewsletterSubscribeForm";

export const metadata: Metadata = {
  title: "마음 구독 에세이 | 기분 스튜디오",
  description:
    "번아웃, 조급함, 완벽주의 — 조용히 덜어내고 싶은 마음들에게 건네는 짧은 편지 모음.",
};

// CMS 에서 수정 후 1분 내 반영되도록 ISR
export const revalidate = 60;

export default async function EssaysIndexPage() {
  const essays = await getAllEssays();

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-5 pt-20 pb-20 md:pt-28 md:pb-28">
        {/* 배경 장식 doodle — 부드러운 오프닝 분위기용 */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src="/doodles/star-sparkle.svg"
            alt=""
            width={80}
            height={80}
            className="absolute top-16 left-[7%] w-12 h-12 md:w-16 md:h-16 opacity-[0.09]"
          />
          <Image
            src="/doodles/heart-doodle.svg"
            alt=""
            width={80}
            height={80}
            className="absolute top-[26%] right-[6%] w-12 h-12 md:w-16 md:h-16 opacity-[0.09]"
          />
          <Image
            src="/doodles/plant-doodle.svg"
            alt=""
            width={80}
            height={80}
            className="absolute bottom-24 left-[9%] w-14 h-14 md:w-20 md:h-20 opacity-[0.08]"
          />
          <Image
            src="/doodles/mystic-eye.svg"
            alt=""
            width={80}
            height={80}
            className="absolute bottom-16 right-[11%] w-12 h-12 md:w-16 md:h-16 opacity-[0.09]"
          />
        </div>

        <div className="relative max-w-3xl mx-auto text-center">
          <p className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-[var(--foreground)]/60 mb-6 md:mb-8">
            마음 구독 에세이
          </p>
          <h1
            className="text-5xl md:text-7xl font-bold leading-[1.12] tracking-tight text-[var(--foreground)] mb-8 md:mb-10"
            style={{ wordBreak: "keep-all" }}
          >
            오늘의 마음,
            <br />
            <span className="italic font-semibold">함께 들여다볼까요</span>
          </h1>
          <p
            className="mx-auto max-w-xl text-base md:text-lg leading-relaxed text-[var(--foreground)]/75 mb-10 md:mb-14"
            style={{ wordBreak: "keep-all" }}
          >
            번아웃, 조급함, 완벽주의 — 조용히 덜어내고 싶은 마음에게 매주 목요일,
            한 편의 편지가 도착해요.
          </p>

          <div className="max-w-xl mx-auto">
            <p
              className="text-sm md:text-base text-[var(--foreground)]/80 mb-4"
              style={{ wordBreak: "keep-all" }}
            >
              이메일을 남겨주시면 목요일 아침 받은편지함에 도착합니다.
            </p>
            <NewsletterSubscribeForm variant="hero" />
          </div>
        </div>
      </section>

      {/* Essay list */}
      <section className="px-5 pb-16 md:pb-24">
        <div className="container mx-auto max-w-5xl">
          {essays.length === 0 ? (
            <p className="text-center text-[var(--foreground)]/60 py-16">
              곧 첫 번째 편지가 도착합니다.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-center gap-4 mb-10 md:mb-12">
                <span className="h-px w-10 bg-[var(--foreground)]/20" />
                <h2 className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-[var(--foreground)]/50 whitespace-nowrap">
                  지금까지 건넨 편지들
                </h2>
                <span className="h-px w-10 bg-[var(--foreground)]/20" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {essays.map((essay) => (
                  <EssayCard key={essay.slug} essay={essay} />
                ))}
              </div>
            </>
          )}

          <div className="flex justify-center mt-14">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)] hover:opacity-70 transition-opacity"
            >
              ← 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
