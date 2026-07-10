/**
 * Mind Spill 워크북 작성/돌아보기는 자체 top-rail·footer 를 가진 몰입형 화면이라
 * 전역 GIBUN 헤더/푸터를 숨긴다. Header·Footer 가 공유하는 단일 판별 함수.
 */
export function isImmersiveRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  // 내면 아이 찾기 워크샵 랜딩은 상단 전역 헤더(기분 홈·로그인·대시보드)를 노출한다
  // (2026-07-10: 몰입형에서 제외 — 이전엔 헤더/푸터를 숨겼음).
  return pathname.startsWith("/dashboard/mind-spill/weekly/");
}
