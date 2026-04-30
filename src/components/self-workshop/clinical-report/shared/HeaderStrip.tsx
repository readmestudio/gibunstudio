import { Eyebrow } from "./Eyebrow";
import { Mono } from "./Mono";

/**
 * 임상 리포트 상단 검정 스트립.
 * 좌측: REPORT / FIG. NN  CASE-XXXX
 * 우측: SECTION NN — TITLE
 *
 * 모든 텍스트는 props로 들어오고 컴포넌트는 어떤 콘텐츠도 하드코딩하지 않는다.
 * 모바일 폭에서는 좌우가 wrap되어 두 줄로 보일 수 있다.
 */
export function HeaderStrip({
  reportLabel,
  figureNumber,
  caseId,
  sectionLabel,
  sectionTitle,
}: {
  reportLabel: string;
  figureNumber: string;
  caseId: string;
  sectionLabel: string;
  sectionTitle: string;
}) {
  return (
    <div
      className="relative flex flex-wrap items-center gap-x-4 gap-y-1 overflow-hidden px-4 py-2"
      style={{
        background: "var(--ink)",
        color: "#fff",
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      <div className="relative z-10 flex items-center gap-2">
        <Eyebrow size={9} weight={700} color="#fff" tracked="0.22em">
          {reportLabel} / FIG. {figureNumber}
        </Eyebrow>
        <span style={{ width: 1, height: 10, background: "#2A2A2E" }} />
        <Mono size={10} weight={500} color="#fff" tracked={0.04}>
          {caseId}
        </Mono>
      </div>
      <div className="relative z-10 ml-auto flex items-center">
        <Eyebrow size={9} weight={700} color="#fff" tracked="0.22em">
          {sectionLabel} — {sectionTitle}
        </Eyebrow>
      </div>
      {/* 흐르는 흰 하이라이트 — 6초 주기 */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0"
        style={{
          width: "20%",
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          animation: "sweepX 6s linear infinite",
        }}
      />
    </div>
  );
}
