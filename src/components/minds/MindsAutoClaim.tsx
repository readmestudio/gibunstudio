"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";

/**
 * 로그인 상태에서 이 기기(localStorage)의 /minds 리드를 내 계정에 자동 귀속한다.
 *
 * 서버 측 이메일 귀속(claimMindsLeadsByEmail)은 "이메일 있는 익명 리드"만 잡는다.
 * 이메일 없이 익명으로 진행한 리드는 이 기기의 localStorage leadId 로만 찾을 수 있어,
 * 대시보드 진입 시 한 번 claim 라우트를 호출해 보완한다.
 *
 *  · 세션당 1회만 시도(sessionStorage 가드) — 매 렌더 반복 호출 방지.
 *  · 새로 귀속됐으면 router.refresh() 로 서버 컴포넌트를 다시 그려 카드가 즉시 뜨게 함.
 *  · 화면에 아무것도 렌더하지 않는다(부수효과 전용).
 */
export function MindsAutoClaim() {
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem("minds_claimed")) return;
    const leadId = localStorage.getItem(MINDS_LEAD_STORAGE_KEY);
    // 이 기기에 리드가 없으면 서버 이메일 귀속으로 충분 — 표시만 하고 종료.
    if (!leadId) {
      sessionStorage.setItem("minds_claimed", "1");
      return;
    }
    (async () => {
      try {
        const res = await fetch("/api/minds/lead/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId }),
        });
        sessionStorage.setItem("minds_claimed", "1");
        const data = await res.json().catch(() => ({}));
        // 리드가 내 계정에 붙었으면 서버 컴포넌트를 새로 그려 카드 노출.
        if (res.ok && data?.claimedLeadId) router.refresh();
      } catch {
        // 실패해도 조용히 넘어간다 — 다음 방문에 다시 시도(가드는 세션 한정).
      }
    })();
  }, [router]);

  return null;
}
