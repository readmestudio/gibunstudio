import { Mono } from "./Mono";

/**
 * V2 하단 메타 스트립 — ink2 배경.
 * 좌측 caption + 우측 "END · FIG.NN".
 */
export function V2BottomStrip({
  caption,
  figureNumber,
}: {
  caption: string;
  figureNumber: string;
}) {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        padding: "10px 20px",
        borderTop: "1px solid var(--v2-ink2)",
        background: "var(--v2-ink2)",
        color: "var(--v2-mute2)",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      <Mono size={10} color="var(--v2-mute2)">
        {caption}
      </Mono>
      <Mono size={10} color="var(--v2-mute2)">
        END · FIG.{figureNumber}
      </Mono>
    </div>
  );
}
