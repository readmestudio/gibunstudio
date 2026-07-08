"use client";

/**
 * 저장된 /inner-child 결과 다시보기 화면.
 *  - 위기(crisis) 블롭: 전문기관 안내(CrisisScreen)만 렌더 — 페이월 미노출.
 *  - 정상 결과: 링크 복사 바 + 무료 리포트(InnerChildFreeReport).
 *  - 결과 없음/깨짐: 친절한 안내 + 새로 시작 링크. (이 leadId 가 자동복원용으로
 *    localStorage 에 남아 있었다면 지워 무효 링크로 무한 복원되는 것을 막는다.)
 */

import { useEffect } from "react";
import Link from "next/link";
import { InnerChildFreeReport } from "@/components/minds/inner-child/report/InnerChildFreeReport";
import { CrisisScreen } from "@/components/minds/inner-child/InnerChildTest";
import { MindsResultLinkBar } from "@/components/minds/MindsResultLinkBar";
import { getTypeCard } from "@/lib/minds/inner-child/type-cards";
import { INNER_CHILD_FUNNEL } from "@/lib/minds/funnel-config";
import type { StoredFreeReport } from "@/lib/minds/inner-child/free-report-store";

const KEY = INNER_CHILD_FUNNEL.leadStorageKey;

export function InnerChildResultView({
  leadId,
  blob,
}: {
  leadId: string;
  blob: StoredFreeReport | null;
}) {
  useEffect(() => {
    if (!blob && typeof window !== "undefined") {
      if (localStorage.getItem(KEY) === leadId) {
        localStorage.removeItem(KEY);
      }
    }
  }, [blob, leadId]);

  if (!blob) {
    return (
      <div className="mx-auto w-full max-w-[448px] px-6 py-20 text-center">
        <h1 className="text-lg font-semibold text-[var(--foreground)]">
          결과를 찾을 수 없어요
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-500">
          링크가 잘못되었거나, 결과가 더 이상 보관되어 있지 않을 수 있어요.
        </p>
        <Link
          href="/inner-child"
          className="mt-8 inline-block rounded-full border border-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-transform active:scale-[0.99]"
        >
          내면 아이 찾기 시작하기
        </Link>
      </div>
    );
  }

  // 위기 응답 — 페이월 없이 전문기관 안내만(자체 풀스크린).
  if (blob.score_result.crisis_flag) {
    return <CrisisScreen />;
  }

  const card = getTypeCard(blob.score_result.primary_child.schema_id);

  // 잉크 오렌지 다크 풀스크린 리포트. 링크 복사 바는 footerExtra 로 카드 아래에 얹는다.
  if (card) {
    return (
      <InnerChildFreeReport
        card={card}
        score={blob.score_result}
        footerExtra={
          <div style={{ maxWidth: 440, margin: "0 auto" }}>
            <MindsResultLinkBar leadId={leadId} base={INNER_CHILD_FUNNEL.freeReportBase} />
          </div>
        }
      />
    );
  }

  // 미집필 유형 — 다크 안내.
  return (
    <div style={{ height: "100dvh", background: "#050506", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
      <h1 style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>
        {blob.score_result.primary_child.child_name}
      </h1>
      <p style={{ fontFamily: "'Pretendard',sans-serif", fontSize: 14, color: "rgba(255,255,255,.6)", marginTop: 12, lineHeight: 1.7 }}>
        이 아이의 상세 리포트는 준비 중이에요. 곧 만나보실 수 있어요.
      </p>
    </div>
  );
}
