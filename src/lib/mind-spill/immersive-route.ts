/**
 * Mind Spill 워크북 작성/돌아보기는 자체 top-rail·footer 를 가진 몰입형 화면이라
 * 전역 GIBUN 헤더/푸터를 숨긴다. Header·Footer 가 공유하는 단일 판별 함수.
 */
export function isImmersiveRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname.startsWith("/dashboard/mind-spill/weekly/") ||
    // 내면 아이 찾기 워크샵 랜딩·완료 페이지 — 자체 top-bar·footer 를 가진 몰입형(다크) 상세페이지.
    pathname.startsWith("/inner-child/workshop")
  );
}
