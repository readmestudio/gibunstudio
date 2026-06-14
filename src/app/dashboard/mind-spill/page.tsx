/**
 * Mind Spill 메인 — 감정 캘린더 뷰 (report-redesign 적용).
 *
 * "매일, 한 칸씩" — 작성한 날은 그날의 감정·강도·컨디션을 블렌딩한 색 한 칸으로,
 * 작성 안 한 날은 + 칸으로. 작성한 날들을 잇는 에너지 흐름 곡선(토글) + 색 범례.
 *
 * 셀의 mesh gradient 는 서버에서 계산해 문자열로 전달(SSR). 그리드 상호작용
 * (에너지 오버레이·모달·토글)은 MindSpillCalendar(클라이언트)가 담당.
 *
 * URL 쿼리: ?month=YYYY-MM (없으면 오늘 기준 월)
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MindSpillFonts } from "@/components/mind-spill/MindSpillFonts";
import { PeriodCtaBanner } from "@/components/mind-spill/PeriodCtaBanner";
import {
  MindSpillCalendar,
  type CalCell,
} from "@/components/mind-spill/calendar/MindSpillCalendar";
import {
  EMOTION_COLORS,
  emotionHsl,
  grainFor,
  meshLayers,
  swatchBg,
  toScanColorInput,
  clamp,
} from "@/lib/mind-spill/emotion-color";
import type { DailyScan } from "@/lib/mind-spill/types";
import "@/components/mind-spill/mind-spill-theme.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EntryRow = {
  id: string;
  entry_date: string;
  daily_scan: DailyScan | null;
};

type SearchParams = Promise<{ month?: string }>;

const EMOTION_ORDER = [
  "기쁨",
  "평온",
  "불안",
  "초조",
  "압박감",
  "슬픔",
  "피로",
  "분노",
  "외로움",
];

export default async function MindSpillCalendarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/mind-spill");

  const params = await searchParams;
  const { year, month, monthLabel, prevMonth, nextMonth, today } =
    resolveMonth(params.month);

  // 이번 달 entries (color blending 위해 daily_scan 포함).
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = lastDayOfMonth(year, month);
  const { data: rows } = await supabase
    .from("mind_spill_daily_entries")
    .select("id, entry_date, daily_scan")
    .eq("user_id", user.id)
    .gte("entry_date", monthStart)
    .lte("entry_date", monthEnd)
    .order("entry_date", { ascending: true });
  const entries = (rows ?? []) as EntryRow[];

  const reportedIdSet = await fetchReportedEntryIds(supabase, user.id);
  const byDate = new Map<string, EntryRow>(entries.map((e) => [e.entry_date, e]));

  const totalEntries = entries.length;
  const reportedThisMonth = entries.filter((e) => reportedIdSet.has(e.id)).length;

  // 이번 달 가장 많았던 감정.
  const topEmotion = computeTopEmotion(entries);

  // Period CTA.
  const periodCta = await resolvePeriodCta(supabase, user.id, reportedIdSet);

  // 캘린더 셀 — 색 계산 포함.
  const cells = buildCells(year, month, today, byDate, reportedIdSet);

  return (
    <div className="mind-spill">
      <MindSpillFonts />

      {/* TOP RAIL */}
      <div className="ms-container" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="ms-cal-rail">
          <div className="ms-cal-rail-inner">
            <div className="ms-cal-brand">
              <span className="ms-cal-blip" />한 회 · MIND&nbsp;SPILL
            </div>
            <div className="ms-cal-rail-center">감정 캘린더 · EMOTION FIELD</div>
            <div className="ms-cal-rail-right">{year} · VOL.01</div>
          </div>
        </div>
      </div>

      <main className="ms-container" style={{ paddingTop: 24, paddingBottom: 40 }}>
        <Link
          href="/dashboard"
          style={{
            display: "inline-block",
            fontFamily: "var(--ms-font-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ms-ink-3)",
            textDecoration: "none",
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          ← 대시보드
        </Link>

        {/* HERO */}
        <header className="ms-cal-hero">
          <div className="ms-cal-kick">
            <span className="ln" />
            EMOTION CALENDAR · 매일 한 칸
          </div>
          <h1 className="ms-cal-h1">
            매일,
            <br />
            <span className="g">한 칸씩.</span>
          </h1>
          <p className="ms-cal-lede">
            매일 한 번의 체크인이 한 칸의 색이 됩니다. 칸이 모이면{" "}
            <b>이번 달 내 마음의 결</b>이 색으로 드러나요. 칸을 누르면 그날의 체크인을
            작성하고, 이미 작성한 날은 <b>보기</b>로 다시 펼칩니다.
          </p>
        </header>

        {/* PROMO + STATS */}
        <div className="ms-cal-topgrid">
          <PeriodCtaBanner periodCta={periodCta} />
          <CalendarStats
            totalEntries={totalEntries}
            reportedThisMonth={reportedThisMonth}
            topEmotion={topEmotion}
          />
        </div>

        {/* MONTH NAV */}
        <div className="ms-cal-monthbar">
          <Link
            href={`/dashboard/mind-spill?month=${prevMonth}`}
            className="ms-cal-navbtn l"
          >
            ← 이전 달
          </Link>
          <h3>{monthLabel}</h3>
          <Link
            href={`/dashboard/mind-spill?month=${nextMonth}`}
            className="ms-cal-navbtn r"
          >
            다음 달 →
          </Link>
        </div>

        {/* CALENDAR (client) */}
        <MindSpillCalendar cells={cells} />

        {/* LEGEND */}
        <section className="ms-cal-legend">
          <div className="ms-cal-lhead">
            <h4>색은 이렇게 만들어져요</h4>
            <span className="en">How the color is blended</span>
          </div>
          <p className="intro">
            그날 체크인한 <b>감정·강도·컨디션·신체 반응</b>이 하나의 그라디언트로
            블렌딩됩니다. 정해진 점수표가 아니라, 그날의 결을 닮은 색 한 칸이 남아요.
          </p>
          <div className="ms-cal-legend-grid">
            <div className="ms-cal-swatches">
              {EMOTION_ORDER.map((name) => (
                <div className="ms-cal-sw" key={name}>
                  <div className="chip" style={{ background: swatchBg(name) }} />
                  <div className="t">
                    <b>{name}</b>
                    <small>{EMOTION_COLORS[name]?.en}</small>
                  </div>
                </div>
              ))}
            </div>
            <div className="ms-cal-axes">
              <Axis
                title="감정 → 색상"
                en="HUE"
                bar="linear-gradient(90deg,#FFD49A,#FF9E7D,#FF8C82,#E59ED8,#C3A9F0,#9FB8F0,#A9C8F5)"
                desc="고른 감정의 색이 모여 칸의 바탕색이 돼요. 여러 감정이면 색이 자연스럽게 섞입니다."
              />
              <Axis
                title="강도 → 선명함"
                en="SATURATION"
                bar="linear-gradient(90deg,#E8E2EC,#C9A9E0,#A66BE0)"
                desc="감정이 강할수록 색이 더 선명하고 짙어집니다."
              />
              <Axis
                title="컨디션 → 밝기"
                en="LIGHTNESS"
                bar="linear-gradient(90deg,#5B4E66,#A99CC0,#EFE7F4)"
                desc="에너지·의욕이 낮은 날은 색이 가라앉고, 좋은 날은 환하게 떠요."
              />
              <Axis
                title="신체 반응 → 질감"
                en="GRAIN"
                bar="linear-gradient(90deg,#D8CFE2,#B7A9C8)"
                desc="신체 신호가 많은 날은 칸 표면에 거친 결(노이즈)이 더 얹혀요."
              />
            </div>
          </div>
        </section>

        <footer className="ms-cal-footer">
          매일, 한 칸씩 · 비우고 채우는 한 회 · MIND SPILL
        </footer>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Stats / Legend 보조 컴포넌트
 * ───────────────────────────────────────────── */

function CalendarStats({
  totalEntries,
  reportedThisMonth,
  topEmotion,
}: {
  totalEntries: number;
  reportedThisMonth: number;
  topEmotion: { name: string; count: number } | null;
}) {
  const filled = Math.min(5, totalEntries);
  const dotGrad = topEmotion
    ? topEmotionGradient(topEmotion.name)
    : "var(--ms-line)";
  return (
    <div className="ms-cal-stats">
      <div className="ms-cal-stat-row">
        <div className="ms-cal-stat">
          <div className="k">이번 달 체크인</div>
          <div className="v">
            {totalEntries}
            <small>일</small>
          </div>
          <div className="ms-cal-streak">
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} className={i < filled ? "on" : undefined} />
            ))}
          </div>
        </div>
        <div className="ms-cal-stat">
          <div className="k">종합 리포트</div>
          <div className="v">
            {reportedThisMonth}
            <small>일</small>
          </div>
          <div className="ms-cal-streak">
            {[0, 1, 2, 3, 4].map((i) => (
              <i key={i} />
            ))}
          </div>
        </div>
      </div>
      <div className="ms-cal-stat ms-cal-topemo">
        <div className="k">이번 달 가장 많았던 감정</div>
        <div className="ms-cal-topemo-row">
          <span className="ms-cal-topemo-dot" style={{ background: dotGrad }} />
          <span className="ms-cal-topemo-name">{topEmotion?.name ?? "—"}</span>
          <span className="ms-cal-topemo-count">
            {topEmotion ? `${topEmotion.count} DAYS` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function Axis({
  title,
  en,
  bar,
  desc,
}: {
  title: string;
  en: string;
  bar: string;
  desc: string;
}) {
  return (
    <div className="ms-cal-axis">
      <div className="at">
        <b>{title}</b>
        <small>{en}</small>
      </div>
      <div className="gbar" style={{ background: bar }} />
      <div className="desc">{desc}</div>
    </div>
  );
}

function topEmotionGradient(name: string): string {
  const c = EMOTION_COLORS[name];
  if (!c) return "var(--ms-ink-4)";
  return `linear-gradient(135deg, hsl(${c.h} ${c.s}% ${c.l}%), hsl(${
    (c.h + 20) % 360
  } ${c.s}% ${c.l - 6}%))`;
}

/* ─────────────────────────────────────────────
 * 셀 빌드 (색 계산 포함)
 * ───────────────────────────────────────────── */

function buildCells(
  year: number,
  month: number,
  today: string,
  byDate: Map<string, EntryRow>,
  reportedIdSet: Set<string>
): CalCell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalCell[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ kind: "empty" });

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      d
    ).padStart(2, "0")}`;
    const isToday = iso === today;
    const isFuture = iso > today;
    const entry = byDate.get(iso) ?? null;
    const scan = entry?.daily_scan ?? null;
    const hasScan = !!scan && (scan.emotions?.length ?? 0) > 0;

    if (hasScan && scan) {
      cells.push(buildDoneCell(d, iso, scan, reportedIdSet.has(entry!.id)));
    } else if (isToday) {
      cells.push({ kind: "today", date: d, iso });
    } else if (isFuture) {
      cells.push({ kind: "locked", date: d });
    } else {
      cells.push({ kind: "todo", date: d, iso });
    }
  }

  while (cells.length % 7 !== 0) cells.push({ kind: "empty" });
  while (cells.length < 42) cells.push({ kind: "empty" });
  return cells;
}

function buildDoneCell(
  date: number,
  iso: string,
  scan: DailyScan,
  reported: boolean
): CalCell {
  const input = toScanColorInput(scan);
  const mesh = meshLayers(input);
  const grain = grainFor(input);
  const emotionsRaw = scan.emotions ?? [];
  const top = emotionsRaw[0] ?? "평온";

  return {
    kind: "done",
    date,
    iso,
    bg: mesh.bg,
    grain,
    dark: mesh.avgL < 60,
    topEmotion: top,
    topEmotionDot: emotionHsl(top),
    moreEmotions: emotionsRaw.length > 1,
    intensityFilled: clamp(Math.round(input.intensity / 2), 0, 5),
    energy: Math.round(input.energy),
    intensity: Math.round(input.intensity),
    drive: Math.round(input.drive),
    sleepLabel: formatSleep(scan.sleep_avg_hours),
    body: input.body,
    emotions: emotionsRaw.map((name) => ({ name, dot: emotionHsl(name) })),
    reported,
  };
}

function formatSleep(h: number | null): string {
  if (h == null) return "—";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}h${String(mm).padStart(2, "0")}m`;
}

function computeTopEmotion(
  entries: EntryRow[]
): { name: string; count: number } | null {
  const count = new Map<string, number>();
  for (const e of entries) {
    for (const name of e.daily_scan?.emotions ?? []) {
      count.set(name, (count.get(name) ?? 0) + 1);
    }
  }
  let best: { name: string; count: number } | null = null;
  for (const [name, c] of count) {
    if (!best || c > best.count) best = { name, count: c };
  }
  return best;
}

/* ─────────────────────────────────────────────
 * Period CTA + 결제 묶인 entry id 헬퍼
 * ───────────────────────────────────────────── */

async function fetchReportedEntryIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from("mind_spill_period_purchases")
    .select("status, mind_spill_period_reports(entry_ids)")
    .eq("user_id", userId)
    .eq("status", "confirmed");

  const set = new Set<string>();
  type Row = {
    status: string;
    mind_spill_period_reports:
      | { entry_ids: string[] | null }
      | { entry_ids: string[] | null }[]
      | null;
  };
  const rows = (data ?? []) as Row[];
  for (const r of rows) {
    const rel = r.mind_spill_period_reports;
    const arr = Array.isArray(rel) ? rel : rel ? [rel] : [];
    for (const item of arr) {
      for (const id of item.entry_ids ?? []) set.add(id);
    }
  }
  return set;
}

async function resolvePeriodCta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  reportedIdSet: Set<string>
): Promise<
  | { kind: "none"; unclaimedCount: number }
  | { kind: "ready"; unclaimedCount: number; entryIds: string[] }
> {
  const since = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().slice(0, 10);
  })();

  const { data } = await supabase
    .from("mind_spill_daily_entries")
    .select("id, entry_date")
    .eq("user_id", userId)
    .gte("entry_date", since)
    .order("entry_date", { ascending: true });

  const all = (data ?? []) as { id: string; entry_date: string }[];
  const unclaimed = all.filter((e) => !reportedIdSet.has(e.id));
  const count = unclaimed.length;

  if (count < 3) {
    return { kind: "none", unclaimedCount: count };
  }
  return {
    kind: "ready",
    unclaimedCount: count,
    entryIds: unclaimed.map((e) => e.id),
  };
}

/* ─── Date helpers ─── */

function resolveMonth(monthQuery: string | undefined) {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();

  if (monthQuery && /^\d{4}-\d{2}$/.test(monthQuery)) {
    const [yStr, mStr] = monthQuery.split("-");
    const y = Number(yStr);
    const m = Number(mStr) - 1;
    if (y >= 2020 && y <= 2100 && m >= 0 && m <= 11) {
      year = y;
      month = m;
    }
  }

  const prev = new Date(year, month - 1, 1);
  const next = new Date(year, month + 1, 1);

  return {
    year,
    month,
    monthLabel: `${year}년 ${month + 1}월`,
    prevMonth: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`,
    nextMonth: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    today: toISO(now),
  };
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month + 1, 0);
  return toISO(d);
}
