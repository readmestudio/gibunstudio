/**
 * Meta 픽셀 표준 이벤트 발화 헬퍼.
 *
 * 픽셀 스크립트는 `app/layout.tsx` 에서 전역(`window.fbq`)으로 초기화된다.
 * 여기서는 클릭이 아니라 **실제 전환이 성공한 순간**에 코드로 직접 track 한다 —
 * (예: 알림신청 성공, 대기신청 서베이 제출 성공). 픽셀이 아직 로드 전이거나
 * SSR 환경이면 조용히 무시한다.
 */
type Fbq = (...args: unknown[]) => void;

export function trackMetaEvent(
  event: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const fbq = (window as Window & { fbq?: Fbq }).fbq;
  if (!fbq) return;
  if (params) fbq("track", event, params);
  else fbq("track", event);
}
