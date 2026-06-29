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
