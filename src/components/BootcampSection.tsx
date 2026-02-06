"use client";

import { useState } from "react";
import { OpenNotifyModal } from "@/components/OpenNotifyModal";

export function BootcampSection() {
  const [showOpenNotify, setShowOpenNotify] = useState(false);

  return (
    <section className="border-t border-[var(--border)] bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-[var(--foreground)]">
          7일간의 상담 부트캠프
          <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-sm font-medium text-[var(--foreground)]">
            오픈 예정
          </span>
        </h2>
        <p className="mt-4 text-[var(--foreground)]/70">
          7일간 데일리 미션을 수행하고 7일차에 분석 리포트를 받는 프로그램
        </p>
        <button
          type="button"
          onClick={() => setShowOpenNotify(true)}
          className="mt-6 inline-flex items-center text-[var(--foreground)] font-medium hover:underline"
        >
          자세히 보기 →
        </button>
      </div>
      <OpenNotifyModal isOpen={showOpenNotify} onClose={() => setShowOpenNotify(false)} />
    </section>
  );
}
