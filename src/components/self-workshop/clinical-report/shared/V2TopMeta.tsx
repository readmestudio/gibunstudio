import { Eyebrow } from "./Eyebrow";
import { Mono } from "./Mono";

/**
 * V2 인스펙터 메타 바.
 * 좌측: caseId · docId · "● SECTION NN OF 06"
 * 우측: sectionAnchor · timestamp
 *
 * 핸드오프 cascade-v2.jsx의 TopMeta + sectionNum dot variant.
 */
export function V2TopMeta({
  caseId,
  docId,
  sectionNum,
  sectionAnchor,
  ts,
}: {
  caseId: string;
  docId: string;
  sectionNum: number;
  sectionAnchor: string;
  ts?: string;
}) {
  return (
    <div
      className="grid items-center gap-x-4"
      style={{
        gridTemplateColumns: "1fr auto",
        padding: "10px 20px",
        borderBottom: "1px solid var(--v2-line)",
        background: "var(--v2-paper)",
      }}
    >
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
        <Mono size={11} weight={600} color="var(--v2-ink)">
          {caseId}
        </Mono>
        <span
          aria-hidden
          style={{ width: 1, height: 10, background: "var(--v2-line)" }}
        />
        <Mono size={11} color="var(--v2-body2)">
          {docId}
        </Mono>
        <span
          aria-hidden
          style={{ width: 1, height: 10, background: "var(--v2-line)" }}
        />
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden
            style={{
              width: 6,
              height: 6,
              borderRadius: 6,
              background: "var(--v2-accent)",
            }}
          />
          <Eyebrow size={9.5} weight={600} color="var(--v2-body2)" tracked="0.16em">
            SECTION {String(sectionNum).padStart(2, "0")} OF 06
          </Eyebrow>
        </span>
      </div>
      <div className="flex items-center gap-3.5">
        <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
          {sectionAnchor}
        </Eyebrow>
        {ts && (
          <Mono size={10.5} color="var(--v2-mute)">
            {ts}
          </Mono>
        )}
      </div>
    </div>
  );
}
