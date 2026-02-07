"use client";

import Link from "next/link";
import { useState } from "react";
import { OpenNotifyModal } from "@/components/OpenNotifyModal";

export default function Program7DayPage() {
  const [showOpenNotify, setShowOpenNotify] = useState(true);

  return (
    <div>
      {/* 히어로 배경 */}
      <section
        className="relative bg-center bg-no-repeat bg-cover py-16"
        style={{ backgroundImage: "url('/patterns/patternTop.svg')" }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            7일간의 상담 부트캠프
          </h1>
          <p className="mt-4 text-lg text-[var(--foreground)]/80">
            7일간 매일 미션을 달성하며 내면 아이 분석 리포트를 받아보세요.
          </p>
        </div>
      </section>

      {/* 본문 */}
      <div className="mx-auto max-w-3xl px-4 py-16">
        <OpenNotifyModal isOpen={showOpenNotify} onClose={() => setShowOpenNotify(false)} />
        {!showOpenNotify && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
            <p className="text-lg font-medium text-[var(--foreground)]">
              상담 부트캠프는 오픈 예정입니다.
            </p>
            <p className="mt-2 text-sm text-[var(--foreground)]/70">
              오픈 알림을 받으시려면 위 모달에서 신청해 주세요.
            </p>
            <button
              type="button"
              onClick={() => setShowOpenNotify(true)}
              className="mt-6 text-[var(--accent)] font-medium hover:underline"
            >
              오픈 알림 신청하기
            </button>
            <div className="mt-6">
              <Link href="/" className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)]">
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
