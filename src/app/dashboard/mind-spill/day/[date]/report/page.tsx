/**
 * /dashboard/mind-spill/day/[date]/report
 *
 * 하루치 단일 리포트 (report-redesign / Report.html 이식, 읽기 전용 SSR).
 *   · RECAP — daily_scan(감정·수면·컨디션·신체) + moments 요약 그리드.
 *   · 반영(거울) — daily_analysis("오늘 하루 정리하기") 결과. 없으면 생성 안내.
 *   · 다음 한 걸음 — actions.
 *
 * entry 가 없으면 작성 페이지로 보낸다.
 */
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MindSpillFonts } from "@/components/mind-spill/MindSpillFonts";
import type { DailyEntry, DailyScan } from "@/lib/mind-spill/types";
import "@/components/mind-spill/mind-spill-theme.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { date: string };

export default async function DailyReportPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { date } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/dashboard/mind-spill/day/${date}/report`);
  }

  const { data } = await supabase
    .from("mind_spill_daily_entries")
    .select("*")
    .eq("user_id", user.id)
    .eq("entry_date", date)
    .maybeSingle();
  const entry = (data as DailyEntry | null) ?? null;

  // 작성 자체가 없으면 작성 페이지로.
  if (!entry) redirect(`/dashboard/mind-spill/day/${date}`);

  const dateLabel = formatDateLabel(parsed);
  const scan = entry.daily_scan;
  const analysis = entry.daily_analysis;

  const emotions = (scan.emotions ?? []).map((name) => ({
    name,
    val: emotionVal(scan, name),
  }));
  const avgIntensity = emotions.length
    ? Math.round(emotions.reduce((a, e) => a + e.val, 0) / emotions.length)
    : 0;
  const recovery = scan.sleep_recovery ?? 0;
  const moments = (entry.moments ?? []).filter(
    (m) => m.title.trim() || m.experience.trim() || (m.reason ?? "").trim()
  );
  const actions = (entry.actions ?? []).filter(
    (a) => a.goal.trim() || a.first_step.trim()
  );
  const bodySigns = scan.body_signs ?? [];

  return (
    <div className="mind-spill">
      <MindSpillFonts />
      <main className="ms-container" style={{ paddingTop: 32, paddingBottom: 100 }}>
        {/* 헤더 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Link
            href="/dashboard/mind-spill"
            style={{
              fontFamily: "var(--ms-font-mono)",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ms-ink-3)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            ← 캘린더
          </Link>
          <Link
            href={`/dashboard/mind-spill/day/${date}`}
            style={{
              fontFamily: "var(--ms-font-mono)",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ms-ink-3)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            수정하기 →
          </Link>
        </div>

        <header className="ms-r-head">
          <div className="ms-eyebrow">DAILY REPORT · {dateLabel}</div>
          <h1 className="ms-r-title">
            {analysis?.today_focus ? (
              analysis.today_focus
            ) : (
              <>
                {dateLabel}의 <span className="acc">기록</span>
              </>
            )}
          </h1>
          <p className="ms-r-lede">
            {analysis?.intro ??
              "오늘 기록한 마음을 한눈에 모았어요. 아래에서 그날의 감정·컨디션과 다음 한 걸음을 다시 펼쳐볼 수 있어요."}
          </p>
        </header>

        {/* RECAP */}
        <section className="ms-r-recap">
          <div className="ms-r-recap-head">
            <div className="left">
              <span className="lbl">RECAP</span>
              <h4>하루 요약</h4>
            </div>
            <div className="right">
              <span>
                감정 <b>{emotions.length}</b>
              </span>
              <span>
                신체 <b>{bodySigns.length}</b>
              </span>
              <span>
                모먼트 <b>{moments.length}</b>
              </span>
            </div>
          </div>

          <div className="ms-r-recap-grid">
            {/* 감정 */}
            <div className="ms-r-rc emo">
              <div className="rc-k">
                <span>감정 · EMOTION</span>
                <b>{avgIntensity ? `INTENSITY ${avgIntensity}/10` : "—"}</b>
              </div>
              {emotions.length ? (
                emotions.map((e) => (
                  <div className="ms-r-mini" key={e.name}>
                    <span className="l">{e.name}</span>
                    <span className="b">
                      <i style={{ width: `${e.val * 10}%` }} />
                    </span>
                    <span className="n">{e.val}</span>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 13, color: "var(--ms-ink-4)" }}>
                  기록 없음
                </div>
              )}
            </div>

            {/* 수면 */}
            <div className="ms-r-rc sle">
              <div className="rc-k">
                <span>수면 · SLEEP</span>
                <b>{recovery ? `RESTORED ${recovery * 10}%` : "—"}</b>
              </div>
              <div className="ms-r-sleep">
                <div className="ms-r-sr">
                  <svg viewBox="0 0 90 90" aria-hidden="true">
                    <circle className="t" cx="45" cy="45" r="36" />
                    <circle
                      className="f"
                      cx="45"
                      cy="45"
                      r="36"
                      style={{
                        strokeDashoffset: 226.2 * (1 - recovery / 10),
                      }}
                    />
                  </svg>
                  <div className="c">
                    {scan.sleep_avg_hours != null
                      ? `${scan.sleep_avg_hours}h`
                      : "—"}
                  </div>
                </div>
                <div className="ms-r-sst">
                  <div className="row">
                    <span>평균 수면</span>
                    <span>
                      {scan.sleep_avg_hours != null
                        ? `${scan.sleep_avg_hours}h`
                        : "—"}
                    </span>
                  </div>
                  <div className="row">
                    <span>잠들기까지</span>
                    <span>
                      {scan.sleep_latency_min != null
                        ? `${scan.sleep_latency_min}분`
                        : "—"}
                    </span>
                  </div>
                  <div className="row">
                    <span>회복감</span>
                    <span>{recovery ? `${recovery}/10` : "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 컨디션 */}
            <div className="ms-r-rc con">
              <div className="rc-k">
                <span>컨디션 · CONDITION</span>
              </div>
              <div className="ms-r-clist">
                {(
                  [
                    ["에너지", scan.energy],
                    ["집중력", scan.focus],
                    ["의욕", scan.motivation],
                  ] as const
                ).map(([label, v]) => (
                  <div className="row" key={label}>
                    <span className="l">{label}</span>
                    <span className="seg">
                      {Array.from({ length: 10 }, (_, i) => (
                        <i key={i} className={v != null && i < v ? "on" : undefined} />
                      ))}
                    </span>
                    <span className="n">{v != null ? `${v}` : "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 신체 */}
            <div className="ms-r-rc bod">
              <div className="rc-k">
                <span>신체 반응 · BODY</span>
                <b>{bodySigns.length}</b>
              </div>
              <div className="ms-r-btags">
                {bodySigns.length ? (
                  bodySigns.map((b) => (
                    <span className="t" key={b}>
                      {b}
                    </span>
                  ))
                ) : (
                  <span className="none">기록한 신체 신호 없음</span>
                )}
              </div>
            </div>

            {/* 모먼트 */}
            <div className="ms-r-rc mom">
              <div className="rc-k">
                <span>좋았던 순간 · MOMENTS</span>
                <b>{moments.length}</b>
              </div>
              <div className="ms-r-mlist">
                {moments.length ? (
                  moments.map((m, i) => (
                    <div className="m" key={m.id}>
                      <span className="nn">{String(i + 1).padStart(2, "0")}</span>
                      <span className="tt">
                        <b>{m.title.trim() || "(제목 없음)"}</b>
                        {m.reason?.trim() ? ` — ${m.reason.trim()}` : ""}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="none">기록한 좋았던 순간 없음</span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 반영(거울) */}
        <div className="ms-r-sec-label">
          <span className="barlet" />
          REFLECTION · 오늘의 반영
        </div>
        {analysis ? (
          <section className="ms-r-mirror">
            <div className="ms-r-mirror-head">
              <h4>
                오늘의 반영
                <span className="tag">ANALYZED</span>
              </h4>
              <span className="gen">
                {entry.daily_analysis_generated_at
                  ? `GENERATED ${formatStamp(entry.daily_analysis_generated_at)}`
                  : "GENERATED"}
              </span>
            </div>
            {analysis.intro && (
              <div className="ms-r-mirror-summary">{analysis.intro}</div>
            )}
            {analysis.today_focus && (
              <div className="ms-r-mirror-focus">
                <div className="k">오늘의 초점</div>
                <div className="v">{analysis.today_focus}</div>
              </div>
            )}
            <div className="ms-r-mirror-body">
              <ReflList a="a." title="달라진 점" items={analysis.changes} />
              <ReflList a="b." title="반복되는 생각" items={analysis.recurring_themes} />
              <ReflList a="c." title="희망적인 부분" items={analysis.hopeful} hope />
            </div>
            {analysis.closing && (
              <div className="ms-r-mirror-closing">
                <p>{analysis.closing}</p>
              </div>
            )}
          </section>
        ) : (
          <div className="ms-r-noanalysis">
            <p>
              아직 이 날의 <b>&lsquo;오늘 하루 정리하기&rsquo;</b> 분석이 없어요.
              <br />
              작성 페이지에서 정리하기를 누르면, 그날의 변화·반복·희망을 짚은 반영이
              이 리포트에 담겨요.
            </p>
            <Link
              href={`/dashboard/mind-spill/day/${date}`}
              className="ms-btn-ink"
              style={{
                display: "inline-block",
                padding: "12px 22px",
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              오늘 하루 정리하러 가기 →
            </Link>
          </div>
        )}

        {/* 다음 한 걸음 */}
        {actions.length > 0 && (
          <>
            <div className="ms-r-sec-label">
              <span className="barlet" />
              NEXT STEP · 다음 한 걸음
            </div>
            <div className="ms-r-actions">
              {actions.map((a) => (
                <div className="ms-r-act" key={a.id}>
                  <div className="at">{a.goal.trim() || "행동"}</div>
                  {a.first_step.trim() && <div className="ad">{a.first_step}</div>}
                  <div className="meta">
                    {a.when.trim() && (
                      <span>
                        언제 <b>{a.when}</b>
                      </span>
                    )}
                    {a.where.trim() && (
                      <span>
                        어디서 <b>{a.where}</b>
                      </span>
                    )}
                    {a.if_then.trim() && (
                      <span>
                        안 되면 <b>{a.if_then}</b>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ─── 반영 리스트 ─── */

function ReflList({
  a,
  title,
  items,
  hope = false,
}: {
  a: string;
  title: string;
  items: string[];
  hope?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`ms-r-refl${hope ? " hope" : ""}`}>
      <div className="sub">
        <span className="a">{a}</span>
        {title}
      </div>
      <ul>
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

/* ─── helpers ─── */

function emotionVal(scan: DailyScan, name: string): number {
  const per = scan.emotion_intensities ?? {};
  if (typeof per[name] === "number") return per[name];
  if (scan.emotion_intensity != null) return scan.emotion_intensity;
  return 5;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

function formatDateLabel(d: Date): string {
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DOW[d.getDay()]}요일)`;
}

function formatStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
