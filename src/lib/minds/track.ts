"use client";

/**
 * /minds·/inner-child 깔때기의 클라이언트 전용 이벤트를 서버(/api/minds/track)로 보내는 헬퍼.
 *
 * 보내는 이벤트:
 *   · test_start      — 랜딩 "3분 무료 테스트" 버튼 클릭(테스트 시작)
 *   · reached_paywall — 페이월 카드에 도달(/minds 배역표 Final · /inner-child 잠금 목차)
 *   · checkout_click  — 결제 CTA 클릭(결제 모달 오픈)
 *
 * 퍼널 변형:
 *  - funnel 인자로 어느 깔때기(/minds | /inner-child)인지 넘긴다(기본 MINDS_FUNNEL → 현행 무회귀).
 *  - leadId 는 그 퍼널의 저장키(funnel.leadStorageKey)에서 읽는다 — /minds 와 /inner-child 가
 *    각자 다른 키를 쓰므로, 변형을 넘겨야 leadId 가 올바로 해석된다.
 *  - variant 를 페이로드에 실어, 서버가 슬랙 알림을 퍼널별로 구분해 라벨링한다.
 *
 * 설계 메모:
 *  - 세션(JS 컨텍스트)당 (변형×이벤트)별 1회만 전송한다. 캐러셀을 앞뒤로 넘겨 페이월 카드가
 *    여러 번 마운트돼도, CTA 를 여러 번 눌러도 슬랙엔 한 번만 뜬다.
 *  - checkout_click 직후 router.push 로 페이지를 떠나므로, 일반 fetch 는 중간에 잘릴
 *    수 있다 → navigator.sendBeacon 을 우선 쓴다(이탈 중에도 전송 보장). 미지원
 *    환경은 keepalive fetch 로 폴백.
 */

import { MINDS_FUNNEL, type MindsFunnelConfig } from "@/lib/minds/funnel-config";

type MindsFunnelEvent = "test_start" | "reached_paywall" | "checkout_click";

// 모듈 스코프 — 같은 페이지 세션 동안 유지되는 "이미 보냄" 표시("변형:이벤트" 키).
const alreadySent = new Set<string>();

export function trackMindsFunnel(
  event: MindsFunnelEvent,
  funnel: MindsFunnelConfig = MINDS_FUNNEL
): void {
  if (typeof window === "undefined") return;
  const dedupeKey = `${funnel.variant}:${event}`;
  if (alreadySent.has(dedupeKey)) return;
  alreadySent.add(dedupeKey);

  let leadId: string | null = null;
  try {
    leadId = localStorage.getItem(funnel.leadStorageKey);
  } catch {
    // localStorage 접근 불가(시크릿 모드 등) — leadId 없이 익명으로 보낸다.
  }

  const payload = JSON.stringify({ event, leadId, variant: funnel.variant });

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
