"use client";

import type { Workbook, WorkbookPatch } from "@/lib/mind-spill/types";

type Props = {
  workbook: Workbook;
  onPatch?: (p: WorkbookPatch) => void;
};

function fmtVol(n: number): string {
  return String(n).padStart(2, "0");
}

/** "Started" 라벨용 짧은 날짜. ISO → "May 27, 2026" */
function fmtStartedDate(iso: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function CoverHeader({ workbook }: Props) {
  const v = fmtVol(workbook.volume_no);
  return (
    <section className="ms-cover">
      <div className="ms-cover-grid">
        <div>
          <h1 className="ms-cover-title">
            <span className="word"><span>마음을</span></span><br />
            <span className="word"><span className="accent">쏟아내고,</span></span><br />
            <span className="word"><span>자기를&nbsp;</span></span>
            <span className="word"><span>줍는&nbsp;</span></span><br />
            <span className="word"><span>한&nbsp;</span></span>
            <span className="word"><span>회.</span></span>
          </h1>
          <p className="ms-cover-lede">
            마음이 힘들 때, 생각이 많을 때, 언제든 한 회.
            <br />
            <span className="ms-cover-lede-mono">— 비우고 채웁니다 —</span>
          </p>
        </div>

        <aside className="ms-cover-side">
          <div className="ms-cover-strip">
            <span className="dot" />
            <span>SESSION · DRAFT</span>
            <span>VOL · {v}</span>
          </div>
          <div className="ms-cover-metarow">
            <div className="item">
              <span className="k">Started</span>
              <span className="v">{fmtStartedDate(workbook.created_at)}</span>
            </div>
            <div className="item">
              <span className="k">Duration</span>
              <span className="v">25 min</span>
            </div>
            <div className="item">
              <span className="k">Edition</span>
              <span className="v">Vol. {v}</span>
            </div>
          </div>
        </aside>
      </div>

      <div className="ms-cover-ticker">
        <div className="ms-ticker-track">
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: "inline-flex", gap: 36 }}>
              <span>BIWUGI · 비우기</span><i>—</i>
              <span className="accent">CHAEUGI · 채우기</span><i>—</i>
              <span>SCAN</span><i>·</i>
              <span>BRAIN DUMP</span><i>·</i>
              <span>REFLECT</span><i>·</i>
              <span>SORT</span><i>·</i>
              <span>SPLIT</span><i>·</i>
              <span>ACT</span><i>·</i>
              <span>FIND STRENGTHS</span><i>·</i>
              <span className="accent">COACH REPORT</span><i>—</i>
              <span>VOL · {v}</span><i>—</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
