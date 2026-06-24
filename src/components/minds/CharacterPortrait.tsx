"use client";

/**
 * 마음 캐릭터 초상 (콰이엇 에디토리얼 프레임).
 *
 * 종이톤 원형 프레임 안에 캐릭터 이미지를 띄운다. 배역별 일러스트(PNG)는 원을
 * 꽉 채우고(cover), 옛 손그림 도들(stroke-only SVG)은 작게 가운데 띄운다(contain).
 * 리더/주연은 accent 링으로 강조.
 */

import { M } from "./quiet-editorial";

interface Props {
  src: string;
  alt: string;
  size?: number;
  /** 리더/주연 강조 링. */
  highlight?: boolean;
}

export function CharacterPortrait({ src, alt, size = 132, highlight }: Props) {
  // 풀-블리드 일러스트(PNG/JPG) vs 선화 도들(SVG)을 구분해 렌더링 방식을 바꾼다.
  const isIllustration = !src.toLowerCase().endsWith(".svg");

  return (
    <div
      className="relative mx-auto flex items-center justify-center overflow-hidden rounded-full"
      style={{
        width: size,
        height: size,
        background: M.paper2,
        border: `1.4px solid ${highlight ? M.accent : M.ink}`,
        color: M.ink,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={isIllustration ? size : size * 0.6}
        height={isIllustration ? size : size * 0.6}
        style={
          isIllustration
            ? { width: "100%", height: "100%", objectFit: "cover" }
            : { objectFit: "contain", opacity: 0.9 }
        }
      />
    </div>
  );
}
