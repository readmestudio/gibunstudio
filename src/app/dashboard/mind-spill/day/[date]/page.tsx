/**
 * /dashboard/mind-spill/day/[date]
 *
 * 그 날짜의 데일리 체크인 작성/조회 페이지.
 *  · entry가 없으면 자동 생성 (insert if not exists).
 *  · periodCta — 결제 confirmed에 묶이지 않은 entries가 3개 이상이면 활성.
 */
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DailyEntryClient } from "@/components/mind-spill/DailyEntryClient";
import { MindSpillFonts } from "@/components/mind-spill/MindSpillFonts";
import { readerNameFrom } from "@/lib/mind-spill/reader-name";
import {
  EMPTY_BRAIN_DUMP,
  EMPTY_DAILY_SCAN,
  type DailyEntry,
} from "@/lib/mind-spill/types";
import "@/components/mind-spill/mind-spill-theme.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { date: string };

export default async function DailyEntryPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { date } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) notFound();

  const todayISO = toISO(new Date());
  if (date > todayISO) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/dashboard/mind-spill/day/${date}`);
  }

  let entry = await fetchEntry(supabase, user.id, date);
  if (!entry) {
    entry = await createEmptyEntry(supabase, user.id, date);
    if (!entry) {
      redirect("/dashboard/mind-spill?error=entry_create");
    }
  }

  const periodCta = await resolvePeriodCta(supabase, user.id);

  return (
    <>
      <MindSpillFonts />
      <DailyEntryClient
        entry={entry}
        dateLabel={formatDateLabel(parsed)}
        periodCta={periodCta}
        readerName={readerNameFrom(user)}
      />
    </>
  );
}

/* ─── helpers ─── */

async function fetchEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string
): Promise<DailyEntry | null> {
  const { data } = await supabase
    .from("mind_spill_daily_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("entry_date", date)
    .maybeSingle();
  return (data as DailyEntry | null) ?? null;
}

async function createEmptyEntry(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  date: string
): Promise<DailyEntry | null> {
  const { data, error } = await supabase
    .from("mind_spill_daily_entries")
    .insert({
      user_id: userId,
      entry_date: date,
      daily_scan: EMPTY_DAILY_SCAN,
      brain_dump: EMPTY_BRAIN_DUMP,
      moments: [],
      classification: {},
      released: [],
      actions: [],
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return fetchEntry(supabase, userId, date);
    }
    console.error("[entry] insert failed:", error);
    return null;
  }
  return data as DailyEntry;
}

/**
 * Period CTA 상태 계산.
 *  · confirmed 결제에 묶이지 않은 entry 수를 셈.
 *  · 3개 이상이면 "ready" — 결제 CTA 활성.
 *
 * 효율 위해 최근 14일 윈도우만 본다 (일반 사용자의 entry 수는 적음).
 */
async function resolvePeriodCta(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<
  | { kind: "none"; unclaimedCount: number }
  | { kind: "ready"; unclaimedCount: number; entryIds: string[] }
> {
  const since = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return d.toISOString().slice(0, 10);
  })();

  const [entriesRes, periodPurchasesRes] = await Promise.all([
    supabase
      .from("mind_spill_daily_entries")
      .select("id, entry_date")
      .eq("user_id", userId)
      .gte("entry_date", since)
      .order("entry_date", { ascending: true }),
    supabase
      .from("mind_spill_period_purchases")
      .select("period_report_id, status, mind_spill_period_reports(entry_ids)")
      .eq("user_id", userId)
      .eq("status", "confirmed"),
  ]);

  const allEntries = (entriesRes.data ?? []) as { id: string; entry_date: string }[];

  // confirmed 결제에 묶인 entry id들을 모음.
  const claimedSet = new Set<string>();
  type PeriodRow = { entry_ids: string[] | null };
  type PurchaseRow = {
    period_report_id: string;
    status: string;
    mind_spill_period_reports: PeriodRow | PeriodRow[] | null;
  };
  const purchases = (periodPurchasesRes.data ?? []) as PurchaseRow[];
  for (const p of purchases) {
    const rel = p.mind_spill_period_reports;
    const rows: PeriodRow[] = Array.isArray(rel) ? rel : rel ? [rel] : [];
    for (const r of rows) {
      for (const id of r.entry_ids ?? []) claimedSet.add(id);
    }
  }

  const unclaimed = allEntries.filter((e) => !claimedSet.has(e.id));
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

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]}요일)`;
}
