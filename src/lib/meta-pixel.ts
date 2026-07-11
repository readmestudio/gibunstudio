/**
 * Meta 픽셀 이벤트 발화 헬퍼.
 *
 * 픽셀 스크립트는 `app/layout.tsx` 에서 전역(`window.fbq`)으로 초기화된다.
 * 대부분은 클릭이 아니라 **실제 전환이 성공한 순간**에 track 한다 —
 * (예: 알림신청 성공, 대기신청 서베이 제출 성공). 단, 광고 최적화를 위해
 * 퍼널 진입 클릭처럼 명시적으로 잡고 싶은 순간은 맞춤 이벤트로 따로 발화한다
 * (`trackMetaCustom`). 픽셀이 아직 로드 전이거나 SSR 환경이면 조용히 무시한다.
 */
type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { fbq?: Fbq }).fbq;
}

/** Meta 표준 이벤트(Lead·ViewContent·InitiateCheckout 등)를 발화한다. */
export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  const fbq = getFbq();
  if (!fbq) return;
  if (params) fbq("track", event, params);
  else fbq("track", event);
}

/**
 * fbq 가 아직 준비되지 않았어도 이벤트를 놓치지 않고 발화한다.
 *
 * 픽셀 스크립트(`app/layout.tsx`)는 `afterInteractive` 로 로드되는데, 결제완료 페이지처럼
 * **리다이렉트 직후 마운트 즉시 발화**하는 전환 픽셀은 그 스크립트가 `window.fbq` 를
 * 정의하기 **전에** 이펙트가 돌 수 있다. 그 찰나에 `trackMetaEvent` 를 쓰면 "fbq 없음"으로
 * 조용히 스킵되어 전환이 영영 유실된다(결제완료 Purchase 가 안 잡히던 원인).
 *
 * 그래서 이 함수는 `fbq` 가 나타날 때까지 짧게 폴링한 뒤 발화한다. `onFired` 는 **실제
 * 발화에 성공한 순간에만** 호출되므로, 쿼리 파라미터 정리 등 후처리를 여기에 건다
 * (발화 실패 시 마커를 지우면 재시도조차 못 하게 되기 때문). 반환된 함수로 취소한다.
 */
export function trackMetaEventWhenReady(
  event: string,
  params: Record<string, unknown>,
  opts?: { retries?: number; intervalMs?: number; onFired?: () => void }
): () => void {
  const retries = opts?.retries ?? 50; // 100ms × 50 ≈ 5초까지 대기
  const intervalMs = opts?.intervalMs ?? 100;
  let cancelled = false;
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const tick = () => {
    if (cancelled) return;
    const fbq = getFbq();
    if (fbq) {
      fbq("track", event, params);
      opts?.onFired?.();
      return;
    }
    if (attempts++ < retries) {
      timer = setTimeout(tick, intervalMs);
    }
  };
  tick();

  return () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  };
}

/**
 * Meta 맞춤 이벤트를 발화한다 (표준 이벤트에 없는 우리만의 전환 지점용).
 * 발화된 이벤트는 이벤트 관리자에 자동으로 나타나며, 이를 기준으로 맞춤 전환을
 * 만들어 광고 캠페인을 최적화할 수 있다. (예: "StartTest" → 테스트 시작 클릭)
 */
export function trackMetaCustom(
  event: string,
  params?: Record<string, unknown>
): void {
  const fbq = getFbq();
  if (!fbq) return;
  if (params) fbq("trackCustom", event, params);
  else fbq("trackCustom", event);
}
