// 광고 유입 추적(Attribution)
// ────────────────────────────────────────────────────────────
// 광고는 /payment/self-workshop 로 랜딩되지만, 실제 대기신청 제출은
// /waitlist 에서 일어난다. 페이지를 이동하면 URL 쿼리(?utm_content=ad01 …)는
// 사라지므로, "첫 진입 순간"의 파라미터를 세션에 보관했다가 제출 시 함께 보낸다.
//
// 왜 sessionStorage + "첫 터치(first-touch)"인가:
//   이미 저장된 값이 있으면 덮어쓰지 않아 "최초로 데려온 광고"가 끝까지 유지된다.
//   (사이트를 여기저기 돌아다녀도 처음 들어온 광고가 공로를 갖는다.)

const STORAGE_KEY = "gibun_attribution";
const MAX_LEN = 200;

// 캡처 대상 쿼리 파라미터 — utm_* 표준 5종 + 메타 클릭 ID(fbclid).
const UTM_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

export type Attribution = Partial<
  Record<(typeof UTM_PARAMS)[number] | "landing_path", string>
>;

/**
 * URL 쿼리에서 추적 파라미터를 읽어 첫 진입 시 1회만 세션에 저장한다.
 * 추적 파라미터가 전혀 없으면(자연 유입) 아무것도 저장하지 않는다.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    // 이미 저장돼 있으면(첫 터치 유지) 건드리지 않는다.
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;

    const params = new URLSearchParams(window.location.search);
    const captured: Attribution = {};
    for (const key of UTM_PARAMS) {
      const v = params.get(key);
      if (v) captured[key] = v.slice(0, MAX_LEN);
    }

    // 추적 파라미터가 하나라도 있을 때만 저장.
    if (Object.keys(captured).length === 0) return;
    captured.landing_path = window.location.pathname.slice(0, MAX_LEN);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(captured));
  } catch {
    // 시크릿 모드 등 sessionStorage 접근 불가 환경에서는 조용히 무시.
  }
}

/** 보관된 유입 정보를 반환한다(없으면 빈 객체). */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Attribution) : {};
  } catch {
    return {};
  }
}
