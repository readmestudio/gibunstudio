import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllEssays } from "@/lib/essays/data";
import { EssayCard } from "@/components/EssaySubscription";
import { NewsletterSubscribeForm } from "@/components/NewsletterSubscribeForm";

export const metadata: Metadata = {
  title: "마음 구독 에세이 | 기분 스튜디오",
  description:
    "매주 목요일, 한 주를 살아가며 만난 마음에 대한 에세이를 보내드려요.",
};

// CMS 에서 수정 후 1분 내 반영되도록 ISR
export const revalidate = 60;

export default async function EssaysIndexPage() {
  const essays = await getAllEssays();

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <section className="relative overflow-hidden px-5 pt-20 pb-20 md:pt-24 md:pb-28">
        {/* 배경 장식 doodle — 부드러운 오프닝 분위기용 */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <Image
            src="/doodles/star-sparkle.svg"
            alt=""
            width={80}
            height={80}
            className="absolute top-16 left-[6%] w-12 h-12 md:w-16 md:h-16 opacity-[0.09]"
          />
          <Image
            src="/doodles/heart-doodle.svg"
            alt=""
            width={80}
            height={80}
            className="absolute top-[22%] right-[5%] w-12 h-12 md:w-16 md:h-16 opacity-[0.09]"
          />
          <Image
            src="/doodles/plant-doodle.svg"
            alt=""
            width={80}
            height={80}
            className="absolute bottom-28 left-[8%] w-14 h-14 md:w-20 md:h-20 opacity-[0.08]"
          />
          <Image
            src="/doodles/mystic-eye.svg"
            alt=""
            width={80}
            height={80}
            className="absolute bottom-16 right-[10%] w-12 h-12 md:w-16 md:h-16 opacity-[0.09]"
          />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* 타이틀 영역 */}
          <div className="text-center mb-12 md:mb-16">
            <p className="text-xs md:text-sm font-semibold tracking-[0.2em] uppercase text-[var(--foreground)]/60 mb-4 md:mb-5">
              마음 구독 에세이
            </p>
            <p
              className="mx-auto max-w-2xl text-base md:text-lg leading-relaxed text-[var(--foreground)]/75"
              style={{ wordBreak: "keep-all" }}
            >
              매주 목요일, 한 주를 살아가며 만난 마음에 대한 에세이를 보내드려요.
            </p>
          </div>

          {/* 에세이 썸네일 */}
          {essays.length === 0 ? (
            <p className="text-center text-[var(--foreground)]/60 py-16">
              곧 첫 번째 편지가 도착합니다.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-16 md:mb-20">
              {essays.map((essay) => (
                <EssayCard key={essay.slug} essay={essay} />
              ))}
            </div>
          )}

          {/* 구독 CTA */}
          <div className="max-w-xl mx-auto text-center">
            <p
              className="text-sm md:text-base text-[var(--foreground)]/80 mb-4 md:mb-5"
              style={{ wordBreak: "keep-all" }}
            >
              이메일을 남겨 주시면 매일 아침마다 우편함으로 찾아갈게요.
            </p>
            <NewsletterSubscribeForm variant="hero" />
          </div>

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
