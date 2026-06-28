import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "워크북 설문 응답 | 기분 스튜디오",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

// workshop_survey_responses 한 행.
interface SurveyRow {
  id: string;
  created_at: string;
  name: string | null;
  phone: string | null;
  age: string | null;
  job: string | null;
  concern: string | null;
  goal: string | null;
  status: string | null;
  workshop_type: string | null;
}

// 제출 시각을 한국 시간 기준 "2026.06.28 14:30" 형태로.
function formatKst(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

export default async function AdminWorkshopSurveysPage() {
  await requireAdmin("/admin/workshop-surveys");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workshop_survey_responses")
    .select(
      "id, created_at, name, phone, age, job, concern, goal, status, workshop_type"
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as SurveyRow[];

  return (
    <main className="min-h-screen bg-[var(--surface)]">
      <div className="container mx-auto max-w-4xl px-5 py-16">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-xs font-semibold text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
          >
            ← 관리자 대시보드
          </Link>
          <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/50">
            WORKBOOK · 설문 응답
          </p>
          <h1 className="mt-1 text-3xl font-bold text-[var(--foreground)]">
            워크북 제작 설문
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            결제 후 회원이 제출한 맞춤 제작 설문이에요. 총{" "}
            <span className="font-bold">{rows.length}</span>건.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-sm text-red-700">
            응답을 불러오지 못했어요: {error.message}
          </p>
        )}

        {!error && rows.length === 0 && (
          <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white p-8 text-center text-sm text-[var(--foreground)]/50">
            아직 제출된 설문이 없어요.
          </p>
        )}

        <div className="space-y-4">
          {rows.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white p-6"
            >
              {/* 상단: 이름 + 제출 시각 */}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {r.name ?? "(이름 없음)"}
                </h2>
                <span className="text-xs text-[var(--foreground)]/45">
                  {formatKst(r.created_at)}
                </span>
              </div>

              {/* 기본 정보 */}
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <Item label="연락처" value={r.phone} />
                <Item label="나이" value={r.age} />
                <Item label="직업" value={r.job} />
                <Item label="고민" value={r.concern} />
              </dl>

              {/* 주관식: 해결받고 싶은 부분 */}
              <div className="mt-4 rounded-lg border-2 border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold text-[var(--foreground)]/50">
                  워크북으로 해결받고 싶은 부분
                </p>
                <p className="mt-1.5 whitespace-pre-wrap break-keep text-sm leading-relaxed text-[var(--foreground)]/80">
                  {r.goal ?? "-"}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function Item({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-[var(--foreground)]/45">{label}</dt>
      <dd className="mt-0.5 break-keep font-medium text-[var(--foreground)]">
        {value && value.trim() ? value : "-"}
      </dd>
    </div>
  );
}
