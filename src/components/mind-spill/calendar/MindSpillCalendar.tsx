"use client";

/**
 * 감정 캘린더 그리드 — report-redesign / 감정 캘린더.html 이식.
 *
 *   · 셀: 그날의 색(mesh gradient, 서버에서 계산해 bg 문자열로 전달) + 감정 라벨 + 강도 점.
 *   · 에너지 흐름: 작성한 날들을 잇는 곡선 SVG 오버레이(토글). 셀 위치를 측정해 그림.
 *   · 모달: 셀을 누르면 그날 요약(작성한 날) 또는 작성 안내(빈 날) → 해당 날짜 페이지로.
 *
 * 월 이동은 서버 링크(?month=)라 컴포넌트가 매월 리마운트 → 오버레이 자동 재계산.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type CalDoneCell = {
  date: number;
  iso: string;
  /** mesh gradient CSS (서버 계산). */
  bg: string;
  grain: number;
  dark: boolean;
  topEmotion: string;
  topEmotionDot: string | null;
  moreEmotions: boolean;
  /** 0~5 채워진 강도 점 수. */
  intensityFilled: number;
  /** 0~10. 에너지 곡선 높이 + 모달. */
  energy: number;
  intensity: number;
  drive: number;
  sleepLabel: string;
  body: string[];
  emotions: { name: string; dot: string | null }[];
  reported: boolean;
};

export type CalCell =
  | { kind: "empty" }
  | { kind: "locked"; date: number }
  | { kind: "today"; date: number; iso: string }
  | { kind: "todo"; date: number; iso: string }
  | ({ kind: "done" } & CalDoneCell);

const KW = ["일", "월", "화", "수", "목", "금", "토"];

type Overlay = {
  w: number;
  h: number;
  paths: string[];
  nodes: { x: number; y: number; r: number }[];
  sw: number;
  nodeSw: number;
};

export function MindSpillCalendar({ cells }: { cells: CalCell[] }) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [energyOn, setEnergyOn] = useState(true);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [modal, setModal] = useState<CalCell | null>(null);

  const recompute = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const w = grid.clientWidth;
    const h = grid.clientHeight;
    const doneEls = Array.from(
      grid.querySelectorAll<HTMLElement>('[data-done="1"]')
    );
    if (!doneEls.length) {
      setOverlay({ w, h, paths: [], nodes: [], sw: 0, nodeSw: 0 });
      return;
    }
    const cw = doneEls[0].offsetWidth;

    const nodes = doneEls.map((el) => {
      const energy = Number(el.dataset.energy ?? "5");
      const day = Number(el.dataset.day ?? "0");
      return {
        x: el.offsetLeft + el.offsetWidth / 2,
        y: el.offsetTop + el.offsetHeight * (0.56 - (energy / 10) * 0.3),
        row: el.offsetTop,
        day,
      };
    });

    // 같은 주(행) + 연속된 날끼리 run 으로 묶음.
    const runs: (typeof nodes)[] = [];
    let cur: typeof nodes = [];
    for (let i = 0; i < nodes.length; i++) {
      if (!cur.length) {
        cur = [nodes[i]];
        continue;
      }
      const prev = cur[cur.length - 1];
      const n = nodes[i];
      if (n.row === prev.row && n.day - prev.day === 1) cur.push(n);
      else {
        runs.push(cur);
        cur = [n];
      }
    }
    if (cur.length) runs.push(cur);

    // catmull-rom → bezier 부드러운 곡선.
    const smooth = (pts: typeof nodes) => {
      if (pts.length < 2) return "";
      let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        const t = 0.2;
        const c1x = p1.x + (p2.x - p0.x) * t;
        const c1y = p1.y + (p2.y - p0.y) * t;
        const c2x = p2.x - (p3.x - p1.x) * t;
        const c2y = p2.y - (p3.y - p1.y) * t;
        d += ` C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(
          1
        )},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
      }
      return d;
    };

    const paths = runs
      .filter((r) => r.length >= 2)
      .map((r) => smooth(r));
    const R = Math.max(3.5, cw * 0.047);
    const overlayNodes = nodes.map((n) => ({ x: n.x, y: n.y, r: R }));

    setOverlay({
      w,
      h,
      paths,
      nodes: overlayNodes,
      sw: Math.max(2.5, cw * 0.028),
      nodeSw: Math.max(2, cw * 0.018),
    });
  }, []);

  useEffect(() => {
    recompute();
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(t);
      t = setTimeout(recompute, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [recompute]);

  // 모달 ESC 닫기 + 스크롤 잠금.
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal]);

  return (
    <>
      {/* 에너지 토글 바 */}
      <div className="ms-cal-energybar">
        <span className="ms-cal-el">
          <svg width="32" height="14" viewBox="0 0 32 14" aria-hidden="true">
            <path
              d="M2,9 C6,9 7,4 11,4 C15,4 16,10 20,10 C24,10 25,4 30,4"
              fill="none"
              stroke="#9F86E8"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="2" cy="9" r="2.6" fill="#fff" stroke="#FF9E7D" strokeWidth="1.8" />
            <circle cx="30" cy="4" r="2.6" fill="#fff" stroke="#8AB0F0" strokeWidth="1.8" />
          </svg>
          에너지 레벨 · 칸을 잇는 선의 높낮이
        </span>
        <button
          type="button"
          className={`ms-cal-etoggle${energyOn ? " on" : ""}`}
          onClick={() => setEnergyOn((v) => !v)}
        >
          에너지 흐름
        </button>
      </div>

      {/* 요일 */}
      <div className="ms-cal-weekdays">
        {KW.map((d, i) => (
          <span key={d} className={i === 0 ? "sun" : undefined}>
            {d}
          </span>
        ))}
      </div>

      {/* 그리드 */}
      <div className="ms-cal-grid" ref={gridRef}>
        {cells.map((cell, i) => (
          <Cell key={i} cell={cell} onOpen={() => setModal(cell)} />
        ))}

        {/* 에너지 흐름 오버레이 */}
        {overlay && (
          <svg
            className={`ms-cal-energy-layer${energyOn ? "" : " off"}`}
            width={overlay.w}
            height={overlay.h}
            viewBox={`0 0 ${overlay.w} ${overlay.h}`}
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="msEnergyGrad"
                x1="0"
                y1="0"
                x2={overlay.w}
                y2="0"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#FF9E7D" />
                <stop offset="0.5" stopColor="#C3A9F0" />
                <stop offset="1" stopColor="#8AB0F0" />
              </linearGradient>
              <filter id="msEglow" x="-40%" y="-80%" width="180%" height="260%">
                <feDropShadow
                  dx="0"
                  dy="1.5"
                  stdDeviation="4.5"
                  floodColor="#B79BE0"
                  floodOpacity="0.42"
                />
              </filter>
            </defs>
            {overlay.paths.map((d, i) => (
              <path
                key={`p${i}`}
                className="ms-cal-e-path"
                d={d}
                style={{ strokeWidth: overlay.sw }}
              />
            ))}
            {overlay.nodes.map((n, i) => (
              <g key={`n${i}`}>
                <circle className="ms-cal-e-halo" cx={n.x} cy={n.y} r={n.r * 2.2} />
                <circle
                  className="ms-cal-e-node"
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  style={{ strokeWidth: overlay.nodeSw }}
                />
              </g>
            ))}
          </svg>
        )}
      </div>

      {modal && <DayModal cell={modal} onClose={() => setModal(null)} />}
    </>
  );
}

/* ─────────────────────────────────────────────
 * Cell
 * ───────────────────────────────────────────── */

function Cell({ cell, onOpen }: { cell: CalCell; onOpen: () => void }) {
  if (cell.kind === "empty") {
    return <div className="ms-cal-cell empty-slot" />;
  }
  if (cell.kind === "locked") {
    return (
      <div className="ms-cal-cell locked">
        <div className="ms-cal-daynum">{cell.date}</div>
      </div>
    );
  }
  if (cell.kind === "today") {
    return (
      <button type="button" className="ms-cal-cell today" onClick={onOpen}>
        <div className="ms-cal-daynum">{cell.date}</div>
        <div className="ms-cal-todo-mark">
          <span>+</span>
        </div>
        <div className="ms-cal-today-tag">오늘 · 작성</div>
      </button>
    );
  }
  if (cell.kind === "todo") {
    return (
      <button type="button" className="ms-cal-cell todo" onClick={onOpen}>
        <div className="ms-cal-daynum">{cell.date}</div>
        <div className="ms-cal-todo-mark">
          <span>+</span>
        </div>
      </button>
    );
  }

  // done
  return (
    <button
      type="button"
      className={`ms-cal-cell done ms-cal-grain${cell.dark ? " dark" : ""}`}
      style={{ ["--grain" as string]: String(cell.grain) }}
      data-done="1"
      data-day={cell.date}
      data-energy={cell.energy}
      onClick={onOpen}
    >
      <div className="ms-cal-fill" style={{ background: cell.bg }} />
      <div className="ms-cal-daynum">{cell.date}</div>
      {cell.reported && <span className="ms-cal-reported" />}
      <span className="ms-cal-act">보기 →</span>
      <div className="ms-cal-emo-label">
        {cell.topEmotionDot && (
          <span
            className="dot"
            style={{ background: cell.topEmotionDot }}
          />
        )}
        {cell.topEmotion}
        {cell.moreEmotions ? " 외" : ""}
      </div>
      <div className="ms-cal-idots">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={i < cell.intensityFilled ? "on" : undefined} />
        ))}
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
 * Modal
 * ───────────────────────────────────────────── */

function DayModal({ cell, onClose }: { cell: CalCell; onClose: () => void }) {
  if (cell.kind === "empty" || cell.kind === "locked") return null;

  const iso = cell.iso;
  const [y, m, d] = iso.split("-");
  const dow = KW[new Date(`${iso}T00:00:00`).getDay()];

  const isDone = cell.kind === "done";
  const isToday = cell.kind === "today";

  return (
    <div
      className="ms-cal-scrim on"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ms-cal-modal" role="dialog" aria-modal="true">
        <button type="button" className="ms-cal-modal-close" onClick={onClose}>
          ✕
        </button>
        <div
          className={`ms-cal-modal-grad ms-cal-grain ${
            isDone && cell.dark ? "dark" : "light"
          }`}
          style={{
            background: isDone
              ? cell.bg
              : "radial-gradient(120% 120% at 30% 20%, #EFE7F4, transparent 60%), radial-gradient(120% 120% at 80% 90%, #E4DCEC, transparent 60%), #F2ECF2",
            ["--grain" as string]: String(isDone ? cell.grain : 0.1),
          }}
        >
          <div className="date">
            <div className="d">{Number(d)}</div>
            <div className="m">
              {y}.{m} · {isDone ? `${dow}요일` : isToday ? "오늘" : "미작성"}
            </div>
          </div>
        </div>

        <div className="ms-cal-modal-body">
          {isDone ? (
            <>
              <div className="ms-cal-modal-emos">
                {cell.emotions.map((e) => (
                  <span className="e" key={e.name}>
                    <span
                      className="d"
                      style={{ background: e.dot ?? "var(--ms-ink-4)" }}
                    />
                    {e.name}
                  </span>
                ))}
              </div>
              <MRow label="감정 강도" val={cell.intensity} />
              <MRow label="에너지" val={cell.energy} />
              <MRow label="의욕" val={cell.drive} />
              <div className="ms-cal-mrow">
                <span className="k">수면</span>
                <span className="vv">
                  <span className="num" style={{ minWidth: "auto" }}>
                    {cell.sleepLabel}
                  </span>
                </span>
              </div>
              <div className="ms-cal-mrow">
                <span className="k">신체 반응</span>
                <span className="vv">
                  <span
                    className="num"
                    style={{
                      minWidth: "auto",
                      fontWeight: 500,
                      color: "var(--ms-ink-3)",
                    }}
                  >
                    {cell.body.length ? cell.body.join(" · ") : "없음"}
                  </span>
                </span>
              </div>
              <div className="ms-cal-modal-actions">
                <a className="ms-cal-mbtn ghost" href={`/dashboard/mind-spill/day/${iso}`}>
                  수정하기
                </a>
                <a
                  className="ms-cal-mbtn primary"
                  href={`/dashboard/mind-spill/day/${iso}/report`}
                >
                  리포트 보기 →
                </a>
              </div>
            </>
          ) : (
            <>
              <p className="ms-cal-modal-empty-note">
                {isToday
                  ? "오늘의 체크인이 아직 비어 있어요. 지금의 감정·신체·컨디션을 5분 동안 스캔하면, 이 칸에 오늘의 색이 채워집니다."
                  : "이 날은 체크인을 건너뛰었어요. 지금 작성하면 이 칸에 그날의 색이 채워집니다."}
              </p>
              <div className="ms-cal-modal-actions">
                <button type="button" className="ms-cal-mbtn ghost" onClick={onClose}>
                  닫기
                </button>
                <a className="ms-cal-mbtn primary" href={`/dashboard/mind-spill/day/${iso}`}>
                  체크인 작성하기 →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MRow({ label, val }: { label: string; val: number }) {
  return (
    <div className="ms-cal-mrow">
      <span className="k">{label}</span>
      <span className="vv">
        <span className="minibar">
          <i style={{ width: `${val * 10}%` }} />
        </span>
        <span className="num">{val}/10</span>
      </span>
    </div>
  );
}
