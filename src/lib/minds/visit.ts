"use client";

import { captureAttribution, getAttribution } from "@/lib/attribution";

/**
 * 광고 랜딩 도착을 서버에 1회 기록한다(→ POST /api/minds/visit → minds_visits).
 *
 * 왜 클라이언트에서 쏘나:
 *   랜딩은 서버 컴포넌트라 서버에서 세도 되지만, 그러면 프리페치·크롤러·봇의
 *   요청까지 전부 방문으로 잡힌다. 브라우저가 실제로 렌더한 뒤 쏘면 "사람이 본
 *   화면"에 훨씬 가깝다.
 *
 * 세션당 1회:
 *   같은 방문자가 새로고침하거나 퍼널 안에서 화면을 오가도 분모가 부풀지 않도록
 *   sessionStorage 로 잠근다. attribution 의 first-touch 와 같은 수명(세션)이라
 *   두 값의 기준이 어긋나지 않는다.
 *
 * 광고 유입이 아니면 서버가 버리므로, 여기서는 굳이 미리 거르지 않는다
 * (판정 규칙을 서버 한 곳에만 두기 위함 — 두 곳에 두면 언젠가 갈라진다).
 */
export function trackVisit(testType: string): void {
  if (typeof window === "undefined") return;

  // 전역 <AttributionCapture /> 가 먼저 돌기를 기대지 않고 직접 캡처한다.
  // 지금은 레이아웃상 그쪽 effect 가 앞서지만, 그건 형제 렌더 순서라는 우연에
  // 기대는 것이라 레이아웃이 바뀌면 UTM 이 빈 채로 저장되는 식으로 조용히 깨진다.
  // captureAttribution 은 first-touch 가드가 있어 두 번 불러도 값이 바뀌지 않는다.
  captureAttribution();

  const key = `gibun_visit_sent:${testType}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // 시크릿 모드 등 sessionStorage 불가 — 중복 위험을 감수하고 기록은 시도한다.
  }

  void fetch("/api/minds/visit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      testType,
      attribution: getAttribution(),
      referrer: document.referrer || undefined,
    }),
    keepalive: true, // 사용자가 곧바로 이탈해도 요청이 끊기지 않게.
  }).catch(() => {
    // 측정 실패는 조용히 무시 — 랜딩 경험을 막지 않는다.
  });
}
