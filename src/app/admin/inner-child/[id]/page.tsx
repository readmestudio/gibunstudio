import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readFreeReportBlob } from "@/lib/minds/inner-child/free-report-store";
import type { AreaId } from "@/lib/minds/inner-child/types";

export const metadata: Metadata = {
  title: "내면 아이 리드 상세 | 기분 스튜디오",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const AREA_LABEL: Record<AreaId, string> = {
  disconnection: "단절·거절",
  impaired_autonomy: "손상된 자율성",
  other_directedness: "타인 중심성",
  overvigilance: "과잉경계·억제",
};

// SCT 슬롯 라벨(문장완성 5문항).
const SCT_LABEL: Record<string, string> = {
  childhood_self: "어릴 적 나는 ___ 아이였다",
  inner_voice: "다그치는/말리는 내 안의 목소리",
  family_rule: "우리 집에서는 ___해야 했다",
  regression_trigger: "___할 때 어린아이가 된 것 같다",
  escape_behavior: "마음이 힘들 때 ___로 도망친다",
};

interface AnswerItem {
  id: string;
  question: string;
  answer: string;
}

function fmtDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminInnerChildDetailPage({
  params,
}: {
  // Next.js 16: params 는 Promise → await 해서 푼다.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/inner-child/${id}`);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("minds_leads")
    .select("id, created_at, user_id, channel, phone, email, answers, parts_map")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) notFound();

  const answers = (data.answers as AnswerItem[] | null) ?? [];
  const blob = readFreeReportBlob(data.parts_map);
  const sr = blob?.score_result ?? null;

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-3xl mx-auto px-5 py-16">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin/inner-child"
            className="text-xs font-semibold text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
          >
            ← 내면 아이 리드
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-[var(--foreground)]">
            {sr ? sr.primary_child.child_name : "미완료 리드"}
            {sr?.crisis_flag && (
              <span className="ml-2 align-middle rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                위기
              </span>
            )}
          </h1>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--foreground)]/50">
            <span>완료일 {fmtDate(data.created_at)}</span>
            <span>
              연락처{" "}
              <span className="font-semibold text-[var(--foreground)]/70 tabular-nums">
                {data.phone || "없음"}
              </span>
            </span>
            {data.email && <span>이메일 {data.email}</span>}
            <span>회원 {data.user_id ? "가입" : "익명"}</span>
            <span className="font-mono">leadId {data.id}</span>
          </p>
          <div className="mt-3">
            <Link
              href={`/inner-child/r/${data.id}`}
              target="_blank"
              className="text-xs font-semibold text-[var(--foreground)]/70 underline underline-offset-2 hover:text-[var(--foreground)]"
            >
              유저가 본 리포트 화면 열기 ↗
            </Link>
          </div>
        </div>

        {/* 채점 결과 요약 */}
        {sr && (
          <section className="mb-8 rounded-2xl border-2 border-[var(--foreground)]/10 bg-white p-6">
            <h2 className="mb-4 text-sm font-bold text-[var(--foreground)]">
              채점 결과
            </h2>

            {/* 영역 점수 */}
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
              영역 점수 (랭크순)
            </p>
            <div className="mb-5 flex flex-col gap-1.5">
              {(
                Object.entries(sr.areas) as [
                  AreaId,
                  { score: number; rank: number },
                ][]
              )
                .sort((a, b) => a[1].rank - b[1].rank)
                .map(([area, a]) => (
                  <div key={area} className="flex items-center gap-3 text-sm">
                    <span className="w-6 text-[var(--foreground)]/40 tabular-nums">
                      {a.rank}
                    </span>
                    <span className="w-32 text-[var(--foreground)]">
                      {AREA_LABEL[area]}
                    </span>
                    <span className="tabular-nums text-[var(--foreground)]/60">
                      {a.score}점
                    </span>
                  </div>
                ))}
            </div>

            {/* 대표/차순위 아이 · 지킴이 · 특권의식 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                  대표 아이
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                  {sr.primary_child.child_name}
                </p>
                <p className="text-xs text-[var(--foreground)]/50">
                  {sr.primary_child.schema_id} · {sr.primary_child.score}점 ·{" "}
                  {sr.primary_child.conditional ? "조건적" : "무조건적"}
                </p>
                {sr.primary_child.top_item_text && (
                  <p className="mt-1 text-xs text-[var(--foreground)]/60">
                    “{sr.primary_child.top_item_text}”
                  </p>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                  지킴이
                </p>
                <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                  {sr.guardian.label}
                </p>
                <p className="text-xs text-[var(--foreground)]/50">
                  {sr.guardian.type} · 응답 {sr.guardian.answers.join(", ")}
                </p>
              </div>
              {sr.secondary_children.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                    차순위 아이
                  </p>
                  {sr.secondary_children.map((c) => (
                    <p
                      key={c.schema_id}
                      className="mt-1 text-sm text-[var(--foreground)]"
                    >
                      {c.child_name}{" "}
                      <span className="text-xs text-[var(--foreground)]/50">
                        ({c.score}점)
                      </span>
                    </p>
                  ))}
                </div>
              )}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                  특권의식(C1)
                </p>
                <p className="mt-1 text-sm text-[var(--foreground)]">
                  {sr.entitlement_score}점
                </p>
              </div>
            </div>

            {/* SCT 문장완성 */}
            <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
              문장완성 (SCT)
            </p>
            <div className="flex flex-col gap-1.5">
              {(Object.entries(sr.sct) as [string, string][]).map(
                ([slot, value]) => (
                  <div key={slot} className="text-sm">
                    <span className="text-[var(--foreground)]/50">
                      {SCT_LABEL[slot] ?? slot}:{" "}
                    </span>
                    <span className="font-medium text-[var(--foreground)]">
                      {value || "—"}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* 무료 리포트 텍스트 — 생성 필드는 퍼널마다 다르다(한국어=portrait 만,
                영어=portrait·insight·daily_prediction·gap·relation_pattern). 있는 것만 보여준다. */}
            {blob?.free_report && (
              <>
                <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                  무료 리포트 (LLM 생성)
                </p>
                <div className="flex flex-col gap-3 text-sm text-[var(--foreground)]/80">
                  {(
                    [
                      ["portrait", blob.free_report.portrait],
                      ["insight", blob.free_report.insight],
                      ["daily_prediction", blob.free_report.daily_prediction],
                      ["gap", blob.free_report.gap],
                      ["relation_pattern", blob.free_report.relation_pattern],
                    ] as [string, string | undefined][]
                  )
                    .filter(([, v]) => Boolean(v))
                    .map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                          {k}
                        </span>
                        <p className="whitespace-pre-wrap">{v}</p>
                      </div>
                    ))}
                </div>
              </>
            )}
          </section>
        )}

        {/* 원본 답변 전문 */}
        <section className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white p-6">
          <h2 className="mb-4 text-sm font-bold text-[var(--foreground)]">
            제출한 답변 원본{" "}
            <span className="font-normal text-[var(--foreground)]/40">
              ({answers.length}문항)
            </span>
          </h2>
          {answers.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--foreground)]/50">
              저장된 답변이 없어요. (시작만 하고 완료하지 않은 리드일 수 있어요)
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--foreground)]/10 text-left text-[11px] uppercase tracking-wider text-[var(--foreground)]/40">
                    <th className="px-2 py-2 font-semibold">문항</th>
                    <th className="px-2 py-2 font-semibold">질문</th>
                    <th className="px-2 py-2 font-semibold">답변</th>
                  </tr>
                </thead>
                <tbody>
                  {answers.map((a, i) => (
                    <tr
                      key={`${a.id}-${i}`}
                      className="border-b border-[var(--foreground)]/5 align-top last:border-0"
                    >
                      <td className="whitespace-nowrap px-2 py-2.5 font-mono text-xs text-[var(--foreground)]/50">
                        {a.id}
                      </td>
                      <td className="px-2 py-2.5 text-[var(--foreground)]/70">
                        {a.question}
                      </td>
                      <td className="px-2 py-2.5 font-semibold text-[var(--foreground)] whitespace-pre-wrap break-words">
                        {a.answer}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
