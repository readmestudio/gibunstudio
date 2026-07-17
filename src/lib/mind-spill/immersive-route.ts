/**
 * 전역 GIBUN 헤더/푸터를 숨길 경로 판별. Header·Footer 가 공유하는 단일 함수.
 *
 * 숨기는 이유는 두 가지다.
 *  1) 몰입형 — 자체 top-rail·footer 를 가진 화면(Mind Spill 워크북)
 *  2) 언어 불일치 — 전역 헤더/푸터는 한국어 전용("기분 레터"·"로그인")이라 영어 퍼널에
 *     그대로 뜨면 해외 독자에게 깨져 보인다. EN 은 비로그인 퍼널이라 헤더 기능도 쓸모없다.
 */
export function isImmersiveRoute(pathname: string | null): boolean {
  if (!pathname) return false;

  // 내면 아이 찾기 워크샵 랜딩은 상단 전역 헤더(기분 홈·로그인·대시보드)를 노출한다
  // (2026-07-10: 몰입형에서 제외 — 이전엔 헤더/푸터를 숨겼음).
  if (pathname.startsWith("/dashboard/mind-spill/weekly/")) return true;

  // 영어 퍼널(/inner-child/en 및 하위 r/·full/) — 한국어 전역 헤더/푸터 노출 금지.
  // `/inner-child/english` 같은 다른 경로가 걸리지 않게 정확히 끊는다.
  if (pathname === "/inner-child/en" || pathname.startsWith("/inner-child/en/")) return true;

  // K-Saju 영어 퍼널(/saju/en 및 하위 r/) — 같은 이유. 2026-07-17 누락 발견:
  // 발송된 영문 리포트 상단에 한국어 헤더("기분 레터"·"로그인")가 그대로 떴다.
  if (pathname === "/saju/en" || pathname.startsWith("/saju/en/")) return true;

  return false;
}
