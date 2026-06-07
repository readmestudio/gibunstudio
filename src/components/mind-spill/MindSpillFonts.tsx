/**
 * Mind Spill 에디토리얼 폰트 로더.
 * 작성/돌아보기/대시보드 등 .mind-spill · .ms-report 를 쓰는 페이지에서 공용으로 사용.
 * React 19 가 <link rel="stylesheet"> 를 <head> 로 hoist + href 기준 dedupe 한다.
 */
export function MindSpillFonts() {
  return (
    // eslint-disable-next-line @next/next/no-page-custom-font
    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap"
      rel="stylesheet"
    />
  );
}
