import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin/auth";
import { listSessions, type IntakeSessionStatus } from "@/lib/intake/store";
import { createSessionAction, reissueTokenAction } from "./actions";
import CopyLinkButton from "./CopyLinkButton";

export const metadata: Metadata = {
  title: "상담 진단(intake) 세션 | 기분 스튜디오",
  robots: { index: false },
};

// 진입할 때마다 최신 세션 목록을 보여준다.
export const dynamic = "force-dynamic";

/** 상태 뱃지 라벨·클래스 (모노톤, expired 만 옅게). */
const STATUS_BADGE: Record<IntakeSessionStatus, { label: string; className: string }> = {
  issued: {
    label: "발급",
    className: "border-[var(--foreground)]/20 text-[var(--foreground)]/60 bg-white",
  },
  in_progress: {
    label: "진행중",
    className: "border-[var(--foreground)] text-[var(--foreground)] bg-white",
  },
  completed: {
    label: "완료",
    className: "border-[var(--foreground)] bg-[var(--foreground)] text-white",
  },
  expired: {
    label: "만료",
    className: "border-[var(--foreground)]/15 text-[var(--foreground)]/35 bg-white",
  },
};

/** 'YYYY.MM.DD HH:mm' (KST) — 서버 타임존 의존을 줄이려 Intl 로 고정. */
function fmtDateTime(iso: string | null): string {
  if (!iso) return "–";
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

export default async function AdminIntakePage() {
  await requireAdmin("/admin/intake");

  const sessions = await listSessions();

  // 토큰 링크를 복사 가능한 전체 URL 로 구성 (프록시 헤더 우선).
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  // 로컬(localhost/127.*)은 http, 그 외 배포 환경은 프록시 헤더 우선 https.
  const isLocal = host.startsWith("localhost") || host.startsWith("127.");
  const proto = h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  const origin = host ? `${proto}://${host}` : "";

  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const crisisCount = sessions.filter((s) => s.crisis_flag).length;

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-6xl mx-auto px-5 py-16">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-xs font-semibold text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
          >
            ← 대시보드
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            내면 아이 상담 진단 세션
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            워크샵 결제자에게 검사 링크를 발급하고, 완료된 검사의 상담사 리포트를
            확인해요. 결과는 유저에게 절대 노출되지 않습니다.
          </p>
        </div>

        {/* 요약 */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "전체 세션", value: sessions.length, unit: "건" },
            { label: "검사 완료", value: completedCount, unit: "건" },
            { label: "위기 플래그", value: crisisCount, unit: "건" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-5 py-4"
            >
              <p className="text-[11px] text-[var(--foreground)]/50">{s.label}</p>
              <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                {s.value}
                <span className="ml-1 text-sm font-medium text-[var(--foreground)]/50">
                  {s.unit}
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* 위기 플래그 경고 배너 — 있을 때만 (안전 신호라 예외적으로 붉은 계열) */}
        {crisisCount > 0 && (
          <div className="mb-6 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            자·타해 위기 신호가 감지된 세션이 {crisisCount}건 있어요. 아래
            목록에서 <span className="font-semibold">위기</span> 뱃지 행을 먼저
            확인하세요.
          </div>
        )}

        {/* 세션 생성 폼 */}
        <div className="mb-8 rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-6 py-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
            새 세션 발급
          </p>
          <form
            action={createSessionAction}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <label className="flex-1">
              <span className="mb-1 block text-xs font-semibold text-[var(--foreground)]/60">
                표시명 (필수)
              </span>
              <input
                type="text"
                name="display_name"
                required
                placeholder="예: 김OO"
                className="w-full rounded-xl border-2 border-[var(--foreground)]/15 bg-white px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </label>
            <label className="flex-1">
              <span className="mb-1 block text-xs font-semibold text-[var(--foreground)]/60">
                메모
              </span>
              <input
                type="text"
                name="memo"
                placeholder="예: 7/15 결제, 카톡 발송"
                className="w-full rounded-xl border-2 border-[var(--foreground)]/15 bg-white px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-[var(--foreground)]/60">
                세션 예정일
              </span>
              <input
                type="date"
                name="session_date"
                className="w-full rounded-xl border-2 border-[var(--foreground)]/15 bg-white px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-85"
            >
              세션 생성
            </button>
          </form>
          <p className="mt-2 text-xs text-[var(--foreground)]/45">
            생성할 때마다 유저마다 <span className="font-semibold">고유한 검사 링크</span>가
            발급돼요. 아래 목록 맨 위에 새 링크가 나타나면 <span className="font-semibold">[복사]</span> 버튼으로
            복사해 카톡/문자로 전달하세요. (링크 하나 = 응시자 한 명, 1회 제출)
          </p>
        </div>

        {/* 세션 목록 */}
        {sessions.length === 0 ? (
          <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-4 py-10 text-center text-sm text-[var(--foreground)]/50">
            아직 발급한 세션이 없어요.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border-2 border-[var(--foreground)]/10 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--foreground)]/10 text-left text-[11px] uppercase tracking-wider text-[var(--foreground)]/40">
                  <th className="px-4 py-3 font-semibold">표시명</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">플래그</th>
                  <th className="px-4 py-3 font-semibold">세션예정일</th>
                  <th className="px-4 py-3 font-semibold">완료일시</th>
                  <th className="px-4 py-3 font-semibold">검사 링크</th>
                  <th className="px-4 py-3 font-semibold">동작</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.issued;
                  const link = `${origin}/intake/${s.token}`;
                  return (
                    <tr
                      key={s.id}
                      className={`border-b border-[var(--foreground)]/5 align-top last:border-0 ${
                        s.crisis_flag ? "bg-red-50/60" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-[var(--foreground)]">
                          {s.display_name}
                        </span>
                        {s.memo && (
                          <p className="mt-0.5 max-w-[180px] truncate text-xs text-[var(--foreground)]/45">
                            {s.memo}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {s.crisis_flag && (
                          <span className="mr-1 inline-block rounded-full border border-red-400 bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700">
                            위기
                          </span>
                        )}
                        {s.quality_flag && (
                          <span className="inline-block rounded-full border border-[var(--foreground)]/20 bg-[var(--foreground)]/5 px-2 py-0.5 text-[11px] font-semibold text-[var(--foreground)]/55">
                            품질
                          </span>
                        )}
                        {!s.crisis_flag && !s.quality_flag && (
                          <span className="text-[var(--foreground)]/25">–</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--foreground)]/70">
                        {s.session_date ?? "–"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--foreground)]/60">
                        {fmtDateTime(s.completed_at)}
                      </td>
                      <td className="px-4 py-3">
                        {/* 유저별 고유 링크 — 원클릭 복사 */}
                        <CopyLinkButton link={link} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/admin/intake/${s.id}`}
                          className="font-semibold text-[var(--foreground)] underline underline-offset-2 hover:opacity-70"
                        >
                          리포트
                        </Link>
                        <span className="mx-2 text-[var(--foreground)]/20">·</span>
                        <form action={reissueTokenAction} className="inline">
                          <input type="hidden" name="id" value={s.id} />
                          <button
                            type="submit"
                            className="text-[var(--foreground)]/60 underline underline-offset-2 hover:text-[var(--foreground)]"
                          >
                            재발급
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
