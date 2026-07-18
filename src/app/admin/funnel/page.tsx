import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "퍼널 분석 | 기분 스튜디오",
  robots: { index: false },
};

// 진입할 때마다 최신 카운트를 다시 집계한다.
export const dynamic = "force-dynamic";

// ── 데이터 모델 메모(왜 이렇게 세는가) ────────────────────────────────
// 모든 퍼널(사주·내면 아이·마음 배역)이 한 테이블 `minds_leads` 로 들어오고,
// 퍼널은 test_type(saju/inner_child/minds) + landing_path(영/한 구분)로 나눈다.
//  · 방문(광고 유입)   → minds_visits (test_type 슬러그가 영/한 분리: saju_en/inner_child_en/…)
//                        ⚠️ utm·fbclid 있는 "광고 방문"만 기록. 현재 영어 퍼널만 트래킹 배선됨.
//  · 리드/시작         → minds_leads 행 존재
//  · 테스트 완료       → parts_map IS NOT NULL (모든 퍼널 공통·가장 견고한 판정)
//  · 리포트/메일/결제   → parts_map 하위 필드 or 결제 테이블 (퍼널마다 다름)
// 영/한 inner_child 는 test_type 이 같아 landing_path 로만 갈린다 → KR = 전체 − EN 으로 파생.

// ── 기간 필터 ─────────────────────────────────────────────────────
type RangeKey = "7" | "30" | "all";
const RANGE_TABS: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "7", label: "최근 7일", days: 7 },
  { key: "30", label: "최근 30일", days: 30 },
  { key: "all", label: "전체 기간", days: null },
];

function sinceISO(range: RangeKey): string | null {
  const tab = RANGE_TABS.find((t) => t.key === range) ?? RANGE_TABS[2];
  if (tab.days == null) return null;
  const d = new Date();
  d.setDate(d.getDate() - tab.days);
  return d.toISOString();
}

// count 쿼리 하나를 안전하게 실행 — 실패하면(예: JSONB 경로 필터 미지원) null 을 돌려
// 페이지가 죽지 않고 해당 단계만 "—" 로 표시되게 한다.
async function safeCount(
  build: () => PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number | null> {
  try {
    const { count, error } = await build();
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
}

function sub(a: number | null, b: number | null): number | null {
  if (a == null || b == null) return null;
  return Math.max(0, a - b);
}

interface StageVM {
  label: string;
  hint?: string;
  count: number | null;
}
interface FunnelVM {
  key: string;
  label: string;
  lang: "EN" | "KR";
  blurb: string;
  note?: string;
  stages: StageVM[];
}

export default async function AdminFunnelPage({
  searchParams,
}: {
  // Next.js 16: searchParams 는 Promise.
  searchParams: Promise<{ range?: string }>;
}) {
  await requireAdmin("/admin/funnel");

  const sp = await searchParams;
  const range: RangeKey =
    sp.range === "7" || sp.range === "30" || sp.range === "all"
      ? sp.range
      : "30";
  const since = sinceISO(range);

  const admin = createAdminClient();

  // 기간이 걸린 count 베이스 빌더. head:true 로 행은 안 받고 count 만.
  const leads = () => {
    let q = admin.from("minds_leads").select("*", { count: "exact", head: true });
    if (since) q = q.gte("created_at", since);
    return q;
  };
  const visits = () => {
    let q = admin
      .from("minds_visits")
      .select("*", { count: "exact", head: true });
    if (since) q = q.gte("created_at", since);
    return q;
  };
  const purchases = (table: string) => {
    let q = admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed");
    if (since) q = q.gte("created_at", since);
    return q;
  };

  // 모든 카운트를 한 번에 — 각 퍼널 단계·파생용 원자값.
  const [
    // 방문(광고) — 슬러그가 영/한 분리
    vSajuEn,
    vIcEn,
    vIcKr,
    vMinds,
    // 사주(EN)
    lSaju,
    lSajuReport,
    lSajuEmail,
    // inner_child 전체(영+한) / EN 세부
    lIcTotal,
    lIcDoneTotal,
    lIcEn,
    lIcEnDone,
    lIcEnFree,
    lIcEnManual,
    lIcEnEmail,
    // 마음 배역(KR)
    lMinds,
    lMindsDone,
    pMinds,
  ] = await Promise.all([
    safeCount(() => visits().eq("test_type", "saju_en")),
    safeCount(() => visits().eq("test_type", "inner_child_en")),
    safeCount(() => visits().eq("test_type", "inner_child")),
    safeCount(() => visits().eq("test_type", "minds")),

    safeCount(() => leads().eq("test_type", "saju")),
    safeCount(() =>
      leads().eq("test_type", "saju").not("parts_map->report", "is", null),
    ),
    safeCount(() =>
      leads()
        .eq("test_type", "saju")
        .eq("parts_map->email_sent->>ok", "true"),
    ),

    safeCount(() => leads().eq("test_type", "inner_child")),
    safeCount(() =>
      leads().eq("test_type", "inner_child").not("parts_map", "is", null),
    ),
    safeCount(() =>
      leads()
        .eq("test_type", "inner_child")
        .eq("landing_path", "/inner-child/en"),
    ),
    safeCount(() =>
      leads()
        .eq("test_type", "inner_child")
        .eq("landing_path", "/inner-child/en")
        .not("parts_map", "is", null),
    ),
    safeCount(() =>
      leads()
        .eq("test_type", "inner_child")
        .eq("landing_path", "/inner-child/en")
        .not("parts_map->free_report", "is", null),
    ),
    safeCount(() =>
      leads()
        .eq("test_type", "inner_child")
        .eq("landing_path", "/inner-child/en")
        .not("parts_map->manual_report", "is", null),
    ),
    safeCount(() =>
      leads()
        .eq("test_type", "inner_child")
        .eq("landing_path", "/inner-child/en")
        .eq("parts_map->email_sent->>ok", "true"),
    ),

    safeCount(() => leads().eq("test_type", "minds")),
    safeCount(() =>
      leads().eq("test_type", "minds").not("parts_map", "is", null),
    ),
    safeCount(() => purchases("minds_relationship_purchases")),
  ]);

  // 파생: KR inner_child = 전체 − EN(landing_path=/inner-child/en).
  // neq(null 제외) 대신 뺄셈으로 구해 landing_path 가 null/'/inner-child' 인 KR 리드를 놓치지 않는다.
  const lIcKr = sub(lIcTotal, lIcEn);
  const lIcKrDone = sub(lIcDoneTotal, lIcEnDone);

  // ── 퍼널 4종 조립 ────────────────────────────────────────────────
  const AD_HINT = "utm·fbclid 있는 광고 방문만";
  const funnels: FunnelVM[] = [
    {
      key: "saju_en",
      label: "K-Saju",
      lang: "EN",
      blurb: "사주×자미두수 영어 퍼널 · $12.90 이메일 리포트",
      note: "익명 퍼널이라 테스트만 하고 신청 안 한 방문자는 개별 기록이 없어요(리드=이메일 신청 시점에 생성). 그래서 방문→리드 사이 이탈은 개별 추적되지 않아요.",
      stages: [
        { label: "광고 방문", hint: AD_HINT, count: vSajuEn },
        { label: "리포트 신청(리드)", hint: "이메일 신청", count: lSaju },
        { label: "리포트 생성", hint: "LLM 리포트 저장", count: lSajuReport },
        { label: "메일 발송 성공", count: lSajuEmail },
      ],
    },
    {
      key: "inner_child_en",
      label: "Inner Child (EN)",
      lang: "EN",
      blurb: "내면 아이 영어 퍼널 · $9.90 유료 리포트",
      stages: [
        { label: "광고 방문", hint: AD_HINT, count: vIcEn },
        { label: "리드", hint: "landing=/inner-child/en", count: lIcEn },
        { label: "테스트 완료", hint: "채점 완료(parts_map)", count: lIcEnDone },
        { label: "무료 리포트 생성", count: lIcEnFree },
        { label: "유료 리포트 신청", hint: "manual_report", count: lIcEnManual },
        { label: "메일 발송 성공", count: lIcEnEmail },
      ],
    },
    {
      key: "inner_child_kr",
      label: "내면 아이 (KR)",
      lang: "KR",
      blurb: "내면 아이 한국어 퍼널 · 판매 페이지 전환형",
      note: "한국어 퍼널은 광고 방문(minds_visits) 트래킹이 아직 배선되지 않아 방문 수가 0으로 보일 수 있어요. 유료 결제 전환은 전용 테이블 연동 후 추가 예정이에요.",
      stages: [
        { label: "광고 방문", hint: AD_HINT, count: vIcKr },
        { label: "리드(시작)", count: lIcKr },
        { label: "테스트 완료", hint: "채점 완료(parts_map)", count: lIcKrDone },
      ],
    },
    {
      key: "minds_kr",
      label: "마음 배역 (KR)",
      lang: "KR",
      blurb: "다섯 배역 한국어 퍼널 · ₩9,900 관계 리포트",
      note: "한국어 퍼널은 광고 방문(minds_visits) 트래킹이 아직 배선되지 않아 방문 수가 0으로 보일 수 있어요.",
      stages: [
        { label: "광고 방문", hint: AD_HINT, count: vMinds },
        { label: "리드(시작)", count: lMinds },
        { label: "테스트 완료", hint: "채점 완료(parts_map)", count: lMindsDone },
        { label: "유료 리포트 결제", hint: "confirmed", count: pMinds },
      ],
    },
  ];

  // ── 상단 KPI(현재 기간 합계) ─────────────────────────────────────
  const sumSafe = (arr: (number | null)[]) =>
    arr.reduce<number>((s, v) => s + (v ?? 0), 0);
  const kpis = [
    {
      label: "총 광고 방문",
      value: sumSafe([vSajuEn, vIcEn, vIcKr, vMinds]),
      unit: "회",
    },
    {
      label: "총 리드(시작)",
      value: sumSafe([lSaju, lIcTotal, lMinds]),
      unit: "명",
    },
    {
      label: "총 테스트 완료",
      value: sumSafe([lSaju, lIcDoneTotal, lMindsDone]),
      unit: "명",
    },
  ];

  const rangeHref = (key: RangeKey) => `/admin/funnel?range=${key}`;

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-5xl mx-auto px-5 py-16">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-xs font-semibold text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
          >
            ← 대시보드
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            퍼널 분석
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            사주·내면 아이·마음 배역(영/한) 퍼널별로 몇 명이 들어와서 몇 명이
            테스트를 완료하고, 리포트·결제까지 갔는지 한눈에 봐요. 테스트마다
            단계가 조금씩 달라 퍼널 그래프를 따로 그렸어요.
          </p>
        </div>

        {/* 기간 탭 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {RANGE_TABS.map((t) => {
            const active = t.key === range;
            return (
              <Link
                key={t.key}
                href={rangeHref(t.key)}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                    : "border-[var(--foreground)]/15 text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* KPI */}
        <div className="mb-10 grid grid-cols-3 gap-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-5 py-4"
            >
              <p className="text-[11px] text-[var(--foreground)]/50">
                {k.label}
              </p>
              <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                {k.value.toLocaleString("ko-KR")}
                <span className="ml-1 text-sm font-medium text-[var(--foreground)]/50">
                  {k.unit}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* 퍼널 카드들 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {funnels.map((f) => (
            <FunnelCard key={f.key} funnel={f} />
          ))}
        </div>

        {/* 판독 노트 */}
        <div className="mt-10 rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-5 py-4 text-[13px] leading-relaxed text-[var(--foreground)]/55">
          <p className="mb-1 font-semibold text-[var(--foreground)]/70">
            읽는 법
          </p>
          <ul className="list-disc space-y-1 pl-4">
            <li>
              <b>광고 방문</b>은 utm·fbclid가 붙은 유입만 세요(자연 유입 제외).
              영어 퍼널만 트래킹이 배선돼 한국어 퍼널은 아직 0이에요.
            </li>
            <li>
              <b>테스트 완료</b>는 채점 결과(parts_map)가 저장된 리드예요. 위기
              응답 등 리포트가 안 만들어진 완료도 포함돼요.
            </li>
            <li>
              각 단계의 %는 <b>바로 앞 단계 대비</b> 전환율이에요. 자연 유입이
              많으면 리드가 광고 방문보다 많아 100%를 넘을 수도 있어요.
            </li>
            <li>
              <b>—</b>는 아직 집계 배선이 없거나 조회에 실패한 단계예요.
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}

// ── 퍼널 카드(그래프) ───────────────────────────────────────────────
function FunnelCard({ funnel }: { funnel: FunnelVM }) {
  // 바 너비 기준 = 첫 번째 유효 단계(퍼널 최상단). 없으면 1로 나눠 0% 처리.
  const base = funnel.stages.find((s) => (s.count ?? 0) > 0)?.count ?? 0;

  return (
    <div className="flex flex-col rounded-2xl border-2 border-[var(--foreground)]/10 bg-white p-6">
      {/* 카드 헤더 */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            {funnel.label}
          </h2>
          <p className="mt-1 text-[13px] text-[var(--foreground)]/55">
            {funnel.blurb}
          </p>
        </div>
        <span className="shrink-0 rounded-full border-2 border-[var(--foreground)]/15 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--foreground)]/60">
          {funnel.lang}
        </span>
      </div>

      {/* 단계 바 */}
      <div className="space-y-3">
        {funnel.stages.map((stage, i) => {
          const prev = i > 0 ? funnel.stages[i - 1].count : null;
          const conv =
            i > 0 && prev != null && prev > 0 && stage.count != null
              ? Math.round((stage.count / prev) * 100)
              : null;
          const widthPct =
            base > 0 && stage.count != null
              ? Math.max(stage.count > 0 ? 4 : 0, (stage.count / base) * 100)
              : 0;
          // 아래로 갈수록 옅어지는 모노톤 채움(텍스트는 바 밖이라 가독성 영향 없음).
          const fillOpacity = Math.max(0.35, 0.9 - i * 0.12);

          return (
            <div key={stage.label}>
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium text-[var(--foreground)]/80">
                  {stage.label}
                  {stage.hint && (
                    <span className="ml-1.5 text-[11px] font-normal text-[var(--foreground)]/35">
                      {stage.hint}
                    </span>
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-sm font-semibold text-[var(--foreground)]">
                  {stage.count == null
                    ? "—"
                    : stage.count.toLocaleString("ko-KR")}
                  {conv != null && (
                    <span className="ml-1.5 text-[11px] font-medium text-[var(--foreground)]/40">
                      {conv}%
                    </span>
                  )}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--foreground)]/8">
                <div
                  className="h-full rounded-full bg-[var(--foreground)]"
                  style={{
                    width: `${Math.min(100, widthPct)}%`,
                    opacity: fillOpacity,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 퍼널별 주석 */}
      {funnel.note && (
        <p className="mt-4 border-t border-[var(--foreground)]/10 pt-3 text-[12px] leading-relaxed text-[var(--foreground)]/45">
          {funnel.note}
        </p>
      )}
    </div>
  );
}
