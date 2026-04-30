"use client";

import Link from "next/link";
import { SHARED_COPY } from "@/lib/self-workshop/belief-verification-copy";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";

/**
 * 모든 스테이지 하단 고정 "나중에 이어할게요" 링크.
 * 셸이 자동저장을 이미 처리하므로 여기서는 단순히 워크북 목록으로 복귀만.
 * 다음 진입 시 current_stage 기준으로 해당 스테이지에서 재개.
 */
export function PersistentExit() {
  return (
    <div
      style={{
        padding: "0 20px 12px",
        textAlign: "center",
      }}
    >
      <Link
        href="/dashboard/self-workshop"
        className="inline-flex items-center gap-2 text-[var(--v2-mute)] underline-offset-4 hover:text-[var(--v2-ink)] hover:underline"
      >
        <Mono size={11} weight={500} color="currentColor" tracked={0.08}>
          ← {SHARED_COPY.exitLabel}
        </Mono>
      </Link>
    </div>
  );
}
