"use client";

/**
 * 저장된 /minds 결과 다시보기 화면.
 *  - 결과가 있으면: 링크 복사 바 + 마음 리포트(MindsFreeReport) 렌더.
 *  - 결과가 없으면: 친절한 안내 + 새로 시작 링크. (이 leadId 가 자동복원용으로
 *    localStorage 에 남아 있었다면 지워서, 무효 링크로 무한 복원되는 것을 막는다.)
 */

import { useEffect } from "react";
import Link from "next/link";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";
import { MindsFreeReport } from "@/components/minds/MindsFreeReport";
import { MindsResultLinkBar } from "@/components/minds/MindsResultLinkBar";
import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";

export function MindsResultView({
  leadId,
  partsMap,
}: {
  leadId: string;
  partsMap: PartsMap | null;
}) {
  useEffect(() => {
    if (!partsMap && typeof window !== "undefined") {
      if (localStorage.getItem(MINDS_LEAD_STORAGE_KEY) === leadId) {
        localStorage.removeItem(MINDS_LEAD_STORAGE_KEY);
      }
    }
  }, [partsMap, leadId]);

  if (!partsMap) {
    return (
      <div className="mx-auto w-full max-w-[448px] px-6 py-20 text-center">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">
          결과를 찾을 수 없어요
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          링크가 잘못되었거나, 결과가 더 이상 보관되어 있지 않을 수 있어요.
        </p>
        <Link
          href="/minds"
          className="mt-8 inline-block rounded-full border border-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-transform active:scale-[0.99]"
        >
          마음 진단 시작하기
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[448px] px-6 py-8 sm:py-10">
      <MindsResultLinkBar leadId={leadId} />
      <MindsFreeReport partsMap={partsMap} />
    </div>
  );
}
