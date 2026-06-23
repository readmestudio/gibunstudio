"use client";

/**
 * 마음 캐릭터 초상 (콰이엇 에디토리얼 프레임).
 *
 * 손그림 도들(stroke-only SVG) placeholder를 종이톤 원형 프레임 안에 띄운다.
 * 힉스필드 캐릭터 이미지가 준비되면 동일 자리에 src만 바꿔 끼우면 된다(레이아웃 불변).
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
  return (
    <div
      className="relative mx-auto flex items-center justify-center rounded-full"
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
        width={size * 0.6}
        height={size * 0.6}
        style={{ objectFit: "contain", opacity: 0.9 }}
      />
    </div>
  );
}
