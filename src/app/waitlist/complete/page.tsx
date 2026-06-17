import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "대기신청 완료 | GIBUN",
  description:
    "심리 상담 워크북 대기신청이 완료됐어요. 남겨주신 답변을 꼼꼼히 살펴보고, 정식 오픈 시점에 가장 먼저 안내드리겠습니다.",
  // 광고 전환 추적용 완료 페이지 — 검색 노출은 막는다.
  robots: { index: false, follow: false },
};

/**
 * /waitlist/complete
 *
 * 대기신청을 마친 유저가 도달하는 전환(Thank-you) 페이지.
 * URL 키워드 `waitlist/complete` 로 Meta 맞춤 전환("URL · 포함") 을 잡는다.
 * 신청 폼은 성공 시 이 경로로 router.push 한다.
 */
export default function WaitlistCompletePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      <div className="mx-auto w-full max-w-xl px-5 py-16 sm:px-6 sm:py-24">
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white px-7 py-14 text-center sm:px-10 sm:py-16">
          {/* 체크 아이콘 */}
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--foreground)]">
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">
            대기신청 해주셔서 감사합니다
          </h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-[var(--foreground)]/60">
            남겨주신 답변 하나하나 꼼꼼히 읽고,
            <br className="hidden sm:block" /> 더 잘 맞는 워크북을 정성껏 준비하겠습니다.
          </p>

          {/* 안내 — 오픈 시점에 연락 */}
          <p className="mx-auto mt-7 max-w-md rounded-2xl border-2 border-[var(--foreground)] bg-[var(--surface)] px-6 py-5 text-[15px] font-medium leading-relaxed text-[var(--foreground)]">
            워크북이 준비되어 정식 오픈하는 시점에,
            <br className="hidden sm:block" /> 입력해주신 연락처로{" "}
            <strong>가장 먼저 정중히 안내</strong>드리겠습니다.
          </p>

          {/* 홈으로 */}
          <div className="mt-10 border-t border-[var(--border)] pt-8">
            <Link
              href="/"
              className="text-sm font-medium text-[var(--foreground)]/50 underline-offset-4 hover:underline"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
