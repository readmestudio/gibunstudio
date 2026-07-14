"use client";

/**
 * 영어 퍼널(/inner-child/en) 클라이언트 이벤트 → /api/inner-child/en/track 헬퍼.
 *
 * KR track.ts 의 영어판(구조 동일, 라우트·저장키만 다름). KR 파일은 건드리지 않는다.
 *
 * 보내는 이벤트:
 *   · test_start     — 랜딩 "Take the free 3-min test" 클릭
 *   · reached_paywall — 무료 리포트 페이월(잠금) 도달
 *   · request_click  — "Request the full report · $9.90" 클릭(요청 모달 오픈)
 *  (이메일 제출은 /api/inner-child/en/request 가 직접 슬랙 알림을 쏜다)
 *
 * 설계 메모(KR 과 동일):
 *  - 세션(JS 컨텍스트)당 이벤트별 1회만 전송 — 스크롤을 오르내려도 슬랙엔 한 번만.
 *  - 이탈 중에도 전송을 보장하려 navigator.sendBeacon 우선, 미지원 시 keepalive fetch.
 *  - leadId 는 인자 우선(리포트 페이지는 prop 으로 정확히 안다), 없으면 저장키에서 폴백.
 */

const KEY = "inner_child_en_lead_id";

type EnFunnelEvent = "test_start" | "reached_paywall" | "request_click";

// 모듈 스코프 — 같은 페이지 세션 동안 유지되는 "이미 보냄" 표시.
const alreadySent = new Set<string>();

export function trackEnFunnel(event: EnFunnelEvent, leadId?: string | null): void {
  if (typeof window === "undefined") return;
  if (alreadySent.has(event)) return;
  alreadySent.add(event);

  let id: string | null = leadId ?? null;
  if (!id) {
    try {
      id = localStorage.getItem(KEY);
    } catch {
      // localStorage 접근 불가(시크릿 모드 등) — 익명으로 보낸다.
    }
  }

  const payload = JSON.stringify({ event, leadId: id });

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/inner-child/en/track", blob)) return;
    }
  } catch {
    // sendBeacon 실패 — 아래 fetch 로 폴백.
  }

  fetch("/api/inner-child/en/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // 알림은 부가 기능 — 실패해도 사용자 흐름에 영향 없음.
  });
}
