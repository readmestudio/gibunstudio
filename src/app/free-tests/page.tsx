import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * /free-tests — 무료 심리 테스트 모음 (관리자 전용).
 *
 * 흩어져 있던 무료 진단들을 한 곳에 모아 카드로 고르게 하는 페이지. 현재는 관리자
 * (ADMIN_EMAILS)만 접근 가능하도록 `requireAdmin()` 가드를 둔다. 로그인 안 했으면
 * /login 으로, 관리자가 아니면 홈으로 리다이렉트된다.
 */

export const metadata: Metadata = {
  title: "무료 심리 테스트 | GIBUN",
  description:
    "남편성향·마음 배역·성취중독·멘탈헬스·마음 체크인까지, 로그인 없이 무료로 만나보는 마음 진단 모음.",
};

interface FreeTest {
  id: string;
  title: string;
  description: string;
  href: string;
  doodle: string; // /public/doodles 내 파일명(확장자 제외)
  badge: string;
  /** 목록은 공개지만, 시작하려면 로그인이 필요한 테스트 표시용. */
  loginRequired?: boolean;
}

/** 사용자가 지정한 5개 무료 테스트(노출 순서 유지). */
const FREE_TESTS: FreeTest[] = [
  {
    id: "husband-match",
    title: "배우자 기질 적합성 검사",
    description: "유튜브 구독으로 읽는 내 기질과, 옆에 있으면 좋을 사람.",
    href: "/husband-match/birth-info",
    doodle: "heart-doodle",
    badge: "무료",
    loginRequired: true,
  },
  {
    id: "minds",
    title: "내 마음 배역 진단",
    description: "내 안에서 동시에 목소리를 내는 5가지 배역을 만나봐요.",
    href: "/minds",
    doodle: "mystic-eye",
    badge: "무료 · 가입 없이",
  },
  {
    id: "achievement",
    title: "성취 중독 자가진단",
    description: "쉬면 불안한 나, 20문항 CBT로 위험 레벨을 바로 확인.",
    href: "/achievement",
    doodle: "anchor-storm",
    badge: "무료 · 가입 없이",
  },
  {
    id: "mind-check",
    title: "멘탈 헬스 체크",
    description: "불안·우울·번아웃 등 7가지 마음 신호를 21문항으로 점검.",
    href: "/test/mind-check",
    doodle: "face-smile",
    badge: "무료 · 가입 없이",
  },
  {
    id: "mind-spill",
    title: "데일리 마음 체크인",
    description: "매일 한 줄, 감정의 흐름을 기록하고 반복 패턴을 발견해요.",
    href: "/dashboard/mind-spill",
    doodle: "journal-book",
    badge: "무료",
    loginRequired: true,
  },
];

export default async function FreeTestsPage() {
  await requireAdmin("/free-tests");

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="container mx-auto max-w-5xl px-5 py-16 lg:px-24">
        <header className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--foreground)]/50">
            무료 심리 테스트
          </p>
          <h1 className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
            지금 내 마음, 무료로 들여다보기
          </h1>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-[var(--foreground)]/70">
            로그인 없이 바로 시작할 수 있어요. 5가지 진단 중 지금 마음에 닿는 걸
            골라보세요.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FREE_TESTS.map((t) => (
            <Link
              key={t.id}
              href={t.href}
              className="group flex flex-col overflow-hidden rounded-2xl border-2 border-[var(--foreground)] bg-white transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]"
            >
              {/* 일러스트 */}
              <div className="flex items-center justify-center py-10">
                <Image
                  src={`/doodles/${t.doodle}.svg`}
                  alt={t.title}
                  width={80}
                  height={80}
                  className="h-20 w-20 opacity-80"
                />
              </div>

              {/* 텍스트 */}
              <div className="flex flex-grow flex-col border-t border-[var(--foreground)]/10 p-5">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex rounded-md bg-[var(--foreground)]/5 px-2 py-0.5 text-[11px] font-semibold text-[var(--foreground)]/60">
                    {t.badge}
                  </span>
                  {t.loginRequired && (
                    <span className="text-[11px] text-[var(--foreground)]/40">
                      시작 시 로그인
                    </span>
                  )}
                </div>
                <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">
                  {t.title}
                </h2>
                <p className="flex-grow text-sm leading-relaxed text-[var(--foreground)]/60">
                  {t.description}
                </p>
                <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
                  테스트 시작 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
