"use client";

/**
 * /minds 깔때기의 클라이언트 전용 이벤트를 서버(/api/minds/track)로 보내는 헬퍼.
 *
 * 보내는 이벤트:
 *   · reached_paywall — 배역표(Final/페이월) 카드에 도달
 *   · checkout_click  — "워크북 구매하기" CTA 클릭(곧 결제 페이지로 이탈)
 *
 * 설계 메모:
 *  - 세션(JS 컨텍스트)당 이벤트별 1회만 전송한다. 캐러셀을 앞뒤로 넘겨 페이월 카드가
 *    여러 번 마운트돼도, CTA 를 여러 번 눌러도 슬랙엔 한 번만 뜬다.
 *  - checkout_click 직후 router.push 로 페이지를 떠나므로, 일반 fetch 는 중간에 잘릴
 *    수 있다 → navigator.sendBeacon 을 우선 쓴다(이탈 중에도 전송 보장). 미지원
 *    환경은 keepalive fetch 로 폴백.
 *  - leadId(분석 완료 리드 id)는 localStorage 에서 읽어 "누구인지"를 채운다(없으면 익명).
 */

import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";

type MindsFunnelEvent = "reached_paywall" | "checkout_click";

// 모듈 스코프 — 같은 페이지 세션 동안 유지되는 "이미 보냄" 표시.
const alreadySent = new Set<MindsFunnelEvent>();

export function trackMindsFunnel(event: MindsFunnelEvent): void {
  if (typeof window === "undefined") return;
  if (alreadySent.has(event)) return;
  alreadySent.add(event);

  let leadId: string | null = null;
  try {
    leadId = localStorage.getItem(MINDS_LEAD_STORAGE_KEY);
  } catch {
    // localStorage 접근 불가(시크릿 모드 등) — leadId 없이 익명으로 보낸다.
  }

  const payload = JSON.stringify({ event, leadId });

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/minds/track", blob);
      if (ok) return;
    }
  } catch {
    // sendBeacon 실패 — 아래 fetch 로 폴백.
  }

  // 폴백: keepalive fetch (탭이 닫혀도 전송을 이어가도록).
  fetch("/api/minds/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // 알림은 부가 기능 — 실패해도 사용자 흐름에 영향 없음.
  });
}
