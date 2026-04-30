import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { Mono } from "./Mono";

/**
 * 임상 리포트 제목 밴드.
 * 좌: FIGURE 큰 숫자 + /total
 * 우: eyebrow + 한국어 h2 + 서브 + (옵션) 메타 스탯 슬롯
 *
 * 모든 텍스트는 props로 받는다.
 */
export function TitleBand({
  figureNumber,
  figureTotal,
  eyebrow,
  title,
  subtitle,
  metaSlot,
}: {
  figureNumber: string;
  figureTotal: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  metaSlot?: ReactNode;
}) {
  return (
    <div
      className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 px-4 py-5"
      style={{
        background: "var(--paper)",
        borderBottom: "1px solid var(--line-clinical)",
      }}
    >
      <div className="flex items-baseline gap-1">
        <Eyebrow size={8.5} weight={600} color="var(--mute)" tracked="0.22em">
          FIGURE
        </Eyebrow>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <Mono size={26} weight={700} color="var(--ink)" tracked={-0.01}>
          {figureNumber}
        </Mono>
        <Mono size={11} weight={500} color="var(--mute)" tracked={0}>
          /{figureTotal}
        </Mono>
      </div>

      <div />
      <div>
        <Eyebrow size={9.5} weight={600} color="var(--mute)" tracked="0.22em">
          {eyebrow}
        </Eyebrow>
        <h2
          className="mt-2"
          style={{
            fontFamily: "var(--font-clinical-body)",
            fontSize: 26,
            lineHeight: 1.25,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            color: "var(--ink)",
            textWrap: "balance",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 13.5,
              lineHeight: 1.65,
              color: "var(--ink-soft)",
              textWrap: "pretty",
            }}
          >
            {subtitle}
          </p>
        )}
        {metaSlot && <div className="mt-4">{metaSlot}</div>}
      </div>
    </div>
  );
}
