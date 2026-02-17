/**
 * 페이지 장식용 doodle 컴포넌트
 *
 * CardPatternDecoration과 동일한 패턴(div + backgroundImage + opacity)으로
 * 서버 컴포넌트 호환 장식 요소를 렌더링한다.
 * 기본적으로 모바일에서는 숨기고 md 이상에서만 표시한다.
 */

interface DoodleDecorationProps {
  /** doodle 파일명 (확장자 제외) → /doodles/{name}.svg */
  name: string;
  /** Tailwind 크기 클래스 (예: "w-12 h-12") */
  sizeClass: string;
  /** Tailwind 위치 클래스 (예: "top-4 right-4") */
  positionClass: string;
  /** 투명도 (기본 0.08) */
  opacity?: number;
  /** CSS rotate 값 (예: "12deg") */
  rotate?: string;
  /** 모바일에서 숨김 여부 (기본 true) */
  hideOnMobile?: boolean;
}

export function DoodleDecoration({
  name,
  sizeClass,
  positionClass,
  opacity = 0.08,
  rotate,
  hideOnMobile = true,
}: DoodleDecorationProps) {
  return (
    <div
      className={`absolute ${positionClass} ${sizeClass} pointer-events-none select-none bg-contain bg-center bg-no-repeat ${
        hideOnMobile ? "hidden md:block" : ""
      }`}
      style={{
        backgroundImage: `url('/doodles/${name}.svg')`,
        opacity,
        transform: rotate ? `rotate(${rotate})` : undefined,
      }}
      aria-hidden="true"
    />
  );
}
