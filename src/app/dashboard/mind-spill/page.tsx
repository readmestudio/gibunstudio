/**
 * Mind Spill 메인 — 캘린더 뷰 (Freemium 모델).
 *
 * 캘린더 셀 상태:
 *   · 미작성 (empty)   — 회색 빈 셀
 *   · 작성됨 (draft)   — 검은 점 (entry 있음)
 *   · 종합 리포트 받음 — accent 채워진 원 (period 결제 confirmed에 묶인 entry)
 *   · 오늘 (today)     — 강조 테두리
 *
 * Period CTA — 미결제 + period에 묶이지 않은 entry가 3개 이상이면 활성 배너.
 *
 * URL 쿼리: ?month=YYYY-MM (없으면 오늘 기준 월)
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MindSpillFonts } from "@/components/mind-spill/MindSpillFonts";
import { PeriodCtaBanner } from "@/components/mind-spill/PeriodCtaBanner";
import "@/components/mind-spill/mind-spill-theme.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EntryRow = {
  id: string;
  entry_date: string;
  mirror_generated_at: string | null;
};

type SearchParams = Promise<{ month?: string }>;

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

  // 이번 달 entries.
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = lastDayOfMonth(year, month);
  const { data: rows } = await supabase
    .from("mind_spill_daily_entries")
    .select("id, entry_date, mirror_generated_at")
    .eq("user_id", user.id)
    .gte("entry_date", monthStart)
    .lte("entry_date", monthEnd)
    .order("entry_date", { ascending: true });
  const entries = (rows ?? []) as EntryRow[];

  // Period CTA + 캘린더 셀 표시를 위해 confirmed period에 묶인 entry id 집합 필요.
  const reportedIdSet = await fetchReportedEntryIds(supabase, user.id);

  const byDate = new Map<string, EntryRow>(
    entries.map((e) => [e.entry_date, e])
  );

  const totalEntries = entries.length;
  const reportedThisMonth = entries.filter((e) => reportedIdSet.has(e.id)).length;

  // Period CTA: 미결제 + 결제 안 묶인 entry 개수 (전기간).
  const periodCta = await resolvePeriodCta(supabase, user.id, reportedIdSet);

  const cells = buildCalendarCells(year, month);

  return (
    <div className="mind-spill">
      <MindSpillFonts />
      <main
        className="ms-container"
        style={{ paddingTop: 56, paddingBottom: 96 }}
      >
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
            marginBottom: 36,
            fontWeight: 500,
          }}
        >
          ← 대시보드
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <div className="ms-eyebrow" style={{ marginBottom: 16 }}>
            MIND · SPILL — DAILY CHECK-IN
          </div>
          <h1
            style={{
              fontFamily: "var(--ms-font-display)",
              fontWeight: 700,
              fontSize: "clamp(36px, 6vw, 60px)",
              lineHeight: 1.05,
              letterSpacing: "-0.035em",
              color: "var(--ms-ink)",
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            매일,
            <br />
            <span style={{ color: "var(--ms-accent)" }}>한 칸</span>씩.
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 15,
              maxWidth: 520,
              color: "var(--ms-ink-3)",
              lineHeight: 1.7,
              wordBreak: "keep-all",
            }}
          >
            매일 작성 + 그날 감정 분석은 무료예요. 3일치가 모이면 패턴·강점·상담사
            편지가 담긴 종합 리포트(₩4,900)를 받을 수 있어요.
          </p>
        </div>

        {/* Period CTA Banner */}
        <PeriodCtaBanner periodCta={periodCta} />

        {/* 통계 스트립 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            padding: "16px 20px",
            border: "1px solid var(--ms-line)",
            borderRadius: 14,
            background: "var(--ms-surface)",
            marginBottom: 36,
            marginTop: 24,
          }}
        >
          <StatCell label="이번 달 체크인" value={`${totalEntries}일`} />
          <StatCell label="이번 달 종합 리포트" value={`${reportedThisMonth}일`} />
        </div>

        {/* 월 이동 + 캘린더 */}
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <Link
              href={`/dashboard/mind-spill?month=${prevMonth}`}
              className="ms-eyebrow"
              style={{
                color: "var(--ms-ink-3)",
                textDecoration: "none",
                padding: "8px 10px",
              }}
            >
              ← 이전 달
            </Link>
            <h2
              style={{
                fontFamily: "var(--ms-font-display)",
                fontWeight: 600,
                fontSize: 20,
                color: "var(--ms-ink)",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              {monthLabel}
            </h2>
            <Link
              href={`/dashboard/mind-spill?month=${nextMonth}`}
              className="ms-eyebrow"
              style={{
                color: "var(--ms-ink-3)",
                textDecoration: "none",
                padding: "8px 10px",
              }}
            >
              다음 달 →
            </Link>
          </div>

          {/* 요일 헤더 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
              marginBottom: 6,
            }}
          >
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <div
                key={d}
                style={{
                  textAlign: "center",
                  fontSize: 11,
                  fontFamily: "var(--ms-font-mono)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--ms-ink-3)",
                  fontWeight: 500,
                  paddingBottom: 8,
                }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: 6,
            }}
          >
            {cells.map((cell, i) => {
              const entry = cell.iso ? byDate.get(cell.iso) ?? null : null;
              const reported = entry ? reportedIdSet.has(entry.id) : false;
              return (
                <CalendarCell
                  key={i}
                  cell={cell}
                  today={today}
                  hasEntry={!!entry}
                  reported={reported}
                />
              );
            })}
          </div>

          {/* 범례 */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              fontSize: 12,
              color: "var(--ms-ink-3)",
            }}
          >
            <LegendDot variant="draft" label="작성됨" />
            <LegendDot variant="reported" label="종합 리포트 받음" />
            <LegendDot variant="today" label="오늘" />
          </div>
        </section>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * Calendar Cell
 * ───────────────────────────────────────────── */

type CalCell = {
  date: number | null;
  iso: string | null;
  inMonth: boolean;
  isFuture: boolean;
};

function CalendarCell({
  cell,
  today,
  hasEntry,
  reported,
}: {
  cell: CalCell;
  today: string;
  hasEntry: boolean;
  reported: boolean;
}) {
  if (!cell.iso) {
    return <div style={{ aspectRatio: "1 / 1.1" }} />;
  }

  const isToday = cell.iso === today;
  const isFuture = cell.isFuture;

  if (isFuture) {
    return (
      <div
        style={{
          aspectRatio: "1 / 1.1",
          border: "1px solid var(--ms-line-2)",
          borderRadius: 10,
          padding: "8px 10px",
          opacity: 0.4,
          cursor: "not-allowed",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ms-ink-3)",
            fontFamily: "var(--ms-font-mono)",
          }}
        >
          {cell.date}
        </div>
      </div>
    );
  }

  const borderColor = isToday ? "var(--ms-ink)" : "var(--ms-line)";
  const borderWidth = isToday ? 2 : 1;

  return (
    <Link
      href={`/dashboard/mind-spill/day/${cell.iso}`}
      style={{
        position: "relative",
        display: "block",
        aspectRatio: "1 / 1.1",
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: 10,
        padding: "8px 10px",
        background: hasEntry ? "var(--ms-surface)" : "transparent",
        textDecoration: "none",
        transition: "background 0.15s, transform 0.1s",
      }}
      className="ms-cal-cell"
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: isToday ? 700 : 500,
          color: "var(--ms-ink)",
          fontFamily: "var(--ms-font-mono)",
        }}
      >
        {cell.date}
      </div>

      {hasEntry && (
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: reported ? 10 : 6,
            height: reported ? 10 : 6,
            borderRadius: "50%",
            background: reported ? "var(--ms-accent)" : "var(--ms-ink)",
            border: reported ? "1.5px solid var(--ms-ink)" : "none",
          }}
        />
      )}
    </Link>
  );
}

function LegendDot({
  variant,
  label,
}: {
  variant: "draft" | "reported" | "today";
  label: string;
}) {
  if (variant === "today") {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 14,
            border: "2px solid var(--ms-ink)",
            borderRadius: 3,
          }}
        />
        {label}
      </span>
    );
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span
        style={{
          display: "inline-block",
          width: variant === "reported" ? 10 : 6,
          height: variant === "reported" ? 10 : 6,
          borderRadius: "50%",
          background:
            variant === "reported" ? "var(--ms-accent)" : "var(--ms-ink)",
          border:
            variant === "reported" ? "1.5px solid var(--ms-ink)" : "none",
        }}
      />
      {label}
    </span>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="ms-eyebrow"
        style={{ marginBottom: 4, color: "var(--ms-ink-3)" }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--ms-font-display)",
          fontSize: 22,
          fontWeight: 600,
          color: "var(--ms-ink)",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </div>
    </div>
  );
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
  // 미결제 entry 후보 — 모든 기간의 entries 중 reportedIdSet에 없는 것.
  // 너무 오래된 데이터는 패턴 의미가 떨어지므로 최근 60일로 제한.
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

function buildCalendarCells(year: number, month: number): CalCell[] {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayISO = toISO(new Date());

  const cells: CalCell[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ date: null, iso: null, inMonth: false, isFuture: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({
      date: d,
      iso,
      inMonth: true,
      isFuture: iso > todayISO,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: null, iso: null, inMonth: false, isFuture: false });
  }
  while (cells.length < 42) {
    cells.push({ date: null, iso: null, inMonth: false, isFuture: false });
  }
  return cells;
}
