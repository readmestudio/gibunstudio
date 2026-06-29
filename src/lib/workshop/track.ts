"use client";

/**
 * 워크북 결제수단 버튼 "클릭"(구매 시도)을 서버(/api/workshop/track)로 보내는 헬퍼.
 *
 * 왜 클라이언트에서 쏘나: 결제 시작 알림(notifyMindsPaymentStart)은 워크북 결제
 * 생성 라우트의 로그인 인증을 통과한 뒤에야 뜬다. 성취중독 무료 테스트는 로그인
 * 불필요 퍼널이라 비로그인 사용자가 버튼을 눌러도 그 알림이 안 뜬다 → 클릭 시점에
 * 여기서 직접 신호를 보내 운영자가 "구매 시도"를 놓치지 않게 한다.
 *
 * 설계 메모(minds/track.ts 와 동일 패턴):
 *  - source·method 별로 세션(JS 컨텍스트)당 1회만 전송한다(같은 수단을 여러 번 눌러도
 *    슬랙엔 한 번만 뜬다).
 *  - 클릭 직후 NicePay 결제창으로 이탈하므로 navigator.sendBeacon 을 우선 쓴다(이탈
 *    중에도 전송 보장). 미지원 환경은 keepalive fetch 로 폴백.
 *  - source 는 "키"만 보낸다 — 서버가 화이트리스트로 안전한 라벨로 바꾼다.
 */

/** /api/workshop/track 의 SOURCE_LABELS 키와 일치해야 한다. */
export type WorkshopFunnelSource = "achievement-test";

// 모듈 스코프 — 같은 페이지 세션 동안 유지되는 "이미 보냄" 표시(source:method).
const alreadySent = new Set<string>();

export function trackWorkshopBuyAttempt(
  source: WorkshopFunnelSource,
  method: string | null
): void {
  if (typeof window === "undefined") return;

  const dedupeKey = `${source}:${method ?? "unknown"}`;
  if (alreadySent.has(dedupeKey)) return;
  alreadySent.add(dedupeKey);

  const payload = JSON.stringify({ event: "buy_attempt", source, method });

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/workshop/track", blob);
      if (ok) return;
    }
  } catch {
    // sendBeacon 실패 — 아래 fetch 로 폴백.
  }

  // 폴백: keepalive fetch (결제창으로 이탈해도 전송을 이어가도록).
  fetch("/api/workshop/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // 알림은 부가 기능 — 실패해도 사용자 결제 흐름엔 영향 없음.
  });
}
