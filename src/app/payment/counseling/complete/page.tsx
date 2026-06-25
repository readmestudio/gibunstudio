import Link from "next/link";
import { KAKAO_CHANNEL_URL } from "@/app/programs/counseling/content";

export const metadata = {
  title: "상담 결제 완료",
};

export default function CounselingPaymentCompletePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {/* 완료 체크 아이콘 */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--foreground)]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        결제가 완료되었습니다
      </h1>
      <p className="mt-4 break-keep text-base leading-relaxed text-[var(--foreground)]/80">
        상담을 신청해 주셔서 진심으로 감사합니다.
        <br />
        편안한 마음으로 기다려 주세요.
      </p>

      {/* 안내 박스 */}
      <div className="mt-8 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6 text-left">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          이렇게 진행돼요
        </p>
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--foreground)]/70">
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">1.</span>
            <span className="break-keep">
              담당 상담사가 상담 시간 조율과 사전 인터뷰를 위해 곧 연락드릴
              예정입니다.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">2.</span>
            <span className="break-keep">
              사전 인터뷰로 고민과 상황을 미리 듣고, 가장 잘 맞는 방향으로 상담을
              준비합니다.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">3.</span>
            <span className="break-keep">
              일정이 확정되면 Zoom 화상 상담 링크를 안내해 드립니다.
            </span>
          </li>
        </ol>
      </div>

      {/* 카카오톡 채널 연결 */}
      <a
        href={KAKAO_CHANNEL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-bold text-[var(--foreground)] transition-transform hover:-translate-y-0.5"
      >
        <span aria-hidden>💬</span> 카카오톡 채널로 문의하기
      </a>
      <p className="mt-3 break-keep text-xs leading-relaxed text-[var(--foreground)]/55">
        더 빠른 일정 조율을 원하시면 카카오톡 채널(gibun_studio)로 먼저
        연락해 주셔도 좋아요.
      </p>

      <Link
        href="/dashboard"
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)] px-6 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
      >
        대시보드로 이동
      </Link>
    </div>
  );
}
