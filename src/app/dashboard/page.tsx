import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  PROGRAMS,
  getDashboardDiscoverPrograms,
  getComingSoonPrograms,
} from "@/lib/programs/registry";
import { DoodleDecoration } from "@/components/DoodleDecoration";

/* ─── 남편상 분석 상태 판별 ─── */

type HusbandMatchStatus =
  | "phase1_done"
  | "payment_pending"
  | "survey_needed"
  | "review_pending"
  | "completed";

interface HusbandMatchState {
  status: HusbandMatchStatus;
  badge: string;
  cta: { label: string; href: string }[];
}

function resolveHusbandMatchState(
  phase1: { id: string; matched_husband_type: string } | null,
  payment: { id: string; status: string } | null,
  survey: { id: string } | null,
  phase2: { id: string; published_at: string | null } | null
): HusbandMatchState | null {
  if (!phase1) return null;

  // Phase 2 완료 (published)
  if (phase2?.published_at) {
    return {
      status: "completed",
      badge: "완료",
      cta: [
        { label: "최종 리포트 보기", href: `/husband-match/deep-report/${phase2.id}` },
        { label: "Phase 1 리포트 보기", href: `/husband-match/report/${phase1.id}` },
      ],
    };
  }

  // Phase 2 리포트 생성됨 (미공개)
  if (phase2) {
    return {
      status: "review_pending",
      badge: "검토 중",
      cta: [
        { label: "Phase 1 리포트 보기", href: `/husband-match/report/${phase1.id}` },
      ],
    };
  }

  // 서베이 미작성
  if (payment?.status === "confirmed" && !survey) {
    return {
      status: "survey_needed",
      badge: "서베이 작성 필요",
      cta: [
        { label: "서베이 작성하기", href: `/husband-match/phase2-survey/${phase1.id}` },
        { label: "Phase 1 리포트 보기", href: `/husband-match/report/${phase1.id}` },
      ],
    };
  }

  // 입금 대기
  if (payment?.status === "pending") {
    return {
      status: "payment_pending",
      badge: "입금 대기",
      cta: [
        { label: "Phase 1 리포트 보기", href: `/husband-match/report/${phase1.id}` },
      ],
    };
  }

  // Phase 1만 완료 (결제 없음)
  return {
    status: "phase1_done",
    badge: "Phase 1 완료",
    cta: [
      { label: "리포트 보기", href: `/husband-match/report/${phase1.id}` },
      { label: "Phase 2 결제", href: `/husband-match/payment/${phase1.id}` },
    ],
  };
}

/* ─── 상담 상태 판별 ─── */

interface CounselingState {
  count: number;
  latestStatus: string;
  badge: string;
}

function resolveCounselingState(
  bookings: { id: string; status: string; confirmed_slot: string | null }[] | null
): CounselingState | null {
  if (!bookings || bookings.length === 0) return null;

  const statusMap: Record<string, string> = {
    pending: "대기 중",
    confirmed: "확정됨",
    completed: "완료",
    rejected: "거절됨",
  };

  return {
    count: bookings.length,
    latestStatus: statusMap[bookings[0].status] ?? bookings[0].status,
    badge: `예약 ${bookings.length}건`,
  };
}

/* ─── 상태 배지 컴포넌트 ─── */

function StatusBadge({ text }: { text: string }) {
  return (
    <span className="inline-block rounded-full border border-[var(--foreground)]/30 px-2.5 py-0.5 text-xs font-medium text-[var(--foreground)]/80">
      {text}
    </span>
  );
}

/* ─── 프로그램 배경 이미지 ─── */

const PROGRAM_BG = [
  "/program-bg/program-bg-1.png",
  "/program-bg/program-bg-2.png",
  "/program-bg/program-bg-3.png",
  "/program-bg/program-bg-4.png",
  "/program-bg/program-bg-5.png",
  "/program-bg/program-bg-6.png",
];

/* ─── 메인 페이지 ─── */

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1차 병렬 쿼리: 독립적 테이블
  const [phase1Res, counselingRes, phase2Res] = await Promise.all([
    supabase
      .from("phase1_results")
      .select("id, matched_husband_type, created_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("counseling_bookings")
      .select("id, status, confirmed_slot")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("phase2_results")
      .select("id, published_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const phase1Result = phase1Res.data;
  const counselingBookings = counselingRes.data;
  const phase2Result = phase2Res.data;

  // 2차 병렬 쿼리: phase1 의존
  let paymentData: { id: string; status: string } | null = null;
  let surveyData: { id: string } | null = null;

  if (phase1Result) {
    const [paymentRes, surveyRes] = await Promise.all([
      supabase
        .from("husband_match_payments")
        .select("id, status")
        .eq("phase1_id", phase1Result.id)
        .maybeSingle(),
      supabase
        .from("phase2_surveys")
        .select("id")
        .eq("phase1_id", phase1Result.id)
        .maybeSingle(),
    ]);
    paymentData = paymentRes.data;
    surveyData = surveyRes.data;
  }

  // 상태 해석
  const husbandMatch = resolveHusbandMatchState(
    phase1Result,
    paymentData,
    surveyData,
    phase2Result
  );
  const counseling = resolveCounselingState(counselingBookings);

  // 참여 중인 프로그램 ID
  const participatedIds = new Set<string>();
  if (husbandMatch) participatedIds.add("husband-match");
  if (counseling) participatedIds.add("counseling");

  const hasMyPrograms = participatedIds.size > 0;

  // 둘러보기: 미참여 활성 프로그램 + Coming Soon
  const discoverActive = getDashboardDiscoverPrograms().filter(
    (p) => !participatedIds.has(p.id)
  );
  const comingSoon = getComingSoonPrograms();
  const discoverAll = [...discoverActive, ...comingSoon];

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-12">
      <DoodleDecoration
        name="star-sparkle"
        sizeClass="w-12 h-12"
        positionClass="top-10 right-8"
        opacity={0.07}
        rotate="12deg"
      />
      <h1 className="text-2xl font-bold text-[var(--foreground)]">대시보드</h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        환영합니다, {user.email}
      </p>

      {/* ─── 내 프로그램 ─── */}
      {hasMyPrograms && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            내 프로그램
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* 남편상 분석 */}
            {husbandMatch && (
              <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    남편상 분석
                  </h3>
                  <StatusBadge text={husbandMatch.badge} />
                </div>
                <p className="text-sm text-[var(--foreground)]/60 mb-4">
                  {husbandMatch.status === "phase1_done" && "무료 분석 완료! Phase 2로 더 깊이 알아보세요."}
                  {husbandMatch.status === "payment_pending" && "입금 확인 후 서베이를 진행할 수 있습니다."}
                  {husbandMatch.status === "survey_needed" && "서베이를 작성하면 심층 분석이 시작됩니다."}
                  {husbandMatch.status === "review_pending" && "전문가가 리포트를 검토하고 있습니다."}
                  {husbandMatch.status === "completed" && "심층 분석 리포트가 준비되었습니다."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {husbandMatch.cta.map((action) => (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="inline-flex items-center rounded-lg border-2 border-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 1:1 상담 */}
            {counseling && (
              <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    1:1 심리 상담
                  </h3>
                  <StatusBadge text={counseling.badge} />
                </div>
                <p className="text-sm text-[var(--foreground)]/60 mb-4">
                  최근 예약: {counseling.latestStatus}
                </p>
                <Link
                  href="/dashboard/counseling"
                  className="inline-flex items-center rounded-lg border-2 border-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                >
                  예약 관리
                </Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── 다른 프로그램 둘러보기 ─── */}
      {discoverAll.length > 0 && (
        <section className={`relative ${hasMyPrograms ? "mt-16" : "mt-12"}`}>
          <DoodleDecoration
            name="plant-doodle"
            sizeClass="w-20 h-20"
            positionClass="bottom-0 right-4"
            opacity={0.06}
            rotate="-8deg"
          />
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
            {hasMyPrograms ? "다른 프로그램 둘러보기" : "프로그램 둘러보기"}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {discoverAll.map((program, index) => {
              const bg = PROGRAM_BG[index % PROGRAM_BG.length];
              const isComingSoon = program.comingSoon;

              return (
                <div
                  key={program.id}
                  className={`relative aspect-[4/5] overflow-hidden rounded-xl border-2 border-[var(--foreground)] ${
                    isComingSoon ? "opacity-70" : ""
                  }`}
                >
                  {/* 수채화 배경 */}
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url('${bg}')` }}
                  />
                  {/* 콘텐츠 (하단 정렬) */}
                  <div className="relative z-10 flex flex-col justify-end h-full p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-base font-semibold text-[var(--foreground)]">
                        {program.title}
                      </h3>
                      {isComingSoon && <StatusBadge text="Coming Soon" />}
                    </div>
                    <p className="text-sm text-[var(--foreground)]/60 mb-4">
                      {program.description}
                    </p>
                    {!isComingSoon && (
                      <Link
                        href={program.href}
                        className="inline-flex items-center rounded-lg border-2 border-[var(--foreground)] bg-white/80 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-white transition-colors"
                      >
                        시작하기
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
