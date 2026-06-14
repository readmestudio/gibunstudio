import type { Metadata } from "next";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export const metadata: Metadata = {
  title: "심리 상담 워크북 대기신청 | GIBUN",
  description:
    "1급 심리상담사와 명상 디렉터가 만든 심리상담 워크북. 대기자 전용 최저가 할인 쿠폰과 정식 출시 소식을 가장 먼저 받아보세요.",
};

export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-6 sm:py-24">
        {/* ── 히어로 ── */}
        <header className="text-center">
          <p className="mb-5 inline-block rounded-full border border-[var(--border-dark)] px-4 py-1.5 text-xs font-medium tracking-wide text-[var(--foreground)]/70">
            1급 심리상담사 · 명상 디렉터가 만든 심리상담 워크북
          </p>
          <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            심리 상담 워크북,
            <br />
            가장 먼저 만나보세요
          </h1>
          <p className="mx-auto mt-5 max-w-lg leading-relaxed text-[var(--foreground)]/60">
            당신의 이야기를 들려주시면
            <br className="hidden sm:block" /> 더 잘 맞는 워크북으로 찾아올게요.
          </p>
          <p className="mx-auto mt-7 max-w-lg rounded-2xl border-2 border-[var(--foreground)] bg-[var(--surface)] px-6 py-5 text-[15px] font-medium leading-relaxed text-[var(--foreground)]">
            아래 정보를 남겨주시면 <strong>대기자 전용 최저가 할인 쿠폰</strong>과
            함께,
            <br className="hidden sm:block" /> 정식 출시 소식을 가장 먼저
            알려드릴게요.
          </p>
        </header>

        {/* ── 설문 폼 ── */}
        <div className="mt-14">
          <WaitlistForm />
        </div>
      </div>
    </main>
  );
}
