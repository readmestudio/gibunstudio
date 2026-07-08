import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllEssays } from "@/lib/essays/data";

export const metadata: Metadata = {
  title: "관리자 대시보드 | 기분 스튜디오",
  robots: { index: false },
};

// 허브 페이지도 매 진입마다 최신 카운트를 보여준다.
export const dynamic = "force-dynamic";

// 대시보드 카드 하나의 메타 정의. stats 는 진입 전 미리 보는 핵심 숫자.
interface DashboardCard {
  href: string;
  eyebrow: string; // 상단 라벨 (essays 의 "CMS" 와 동일한 역할)
  title: string;
  description: string;
  stats: { label: string; value: number; unit: string }[];
  subLinks?: { href: string; label: string }[];
}

export default async function AdminHomePage() {
  // 어느 대시보드로든 못 들어가면 의미가 없으니, 허브에서 한 번 인증한다.
  await requireAdmin("/admin");

  const admin = createAdminClient();

  // ── 각 대시보드의 요약 숫자를 한 번에 모아온다 ──
  // 에세이: 전체 개수 + 발송 완료된 slug 수
  const essays = await getAllEssays({ includeScheduled: true });
  const essayTotal = essays.length;

  let sentCount = 0;
  if (essays.length > 0) {
    const { data: sends } = await admin
      .from("newsletter_sends")
      .select("essay_slug")
      .in(
        "essay_slug",
        essays.map((e) => e.slug)
      );
    sentCount = new Set((sends ?? []).map((r) => r.essay_slug).filter(Boolean))
      .size;
  }

  // 대기신청: 전체 건수 / 알림신청 버튼 누적 건수 / 워크북 제작 설문 건수
  // 내면 아이: 시작 리드 전체 / 완주(parts_map 있음) 건수
  const [
    { count: waitlistCount },
    { count: notifyCount },
    { count: surveyCount },
    { count: reviewCount },
    { count: innerChildTotal },
    { count: innerChildDone },
  ] = await Promise.all([
    admin
      .from("workbook_waitlist")
      .select("*", { count: "exact", head: true }),
    admin
      .from("open_notifications")
      .select("*", { count: "exact", head: true }),
    admin
      .from("workshop_survey_responses")
      .select("*", { count: "exact", head: true }),
    admin
      .from("test_reviews")
      .select("*", { count: "exact", head: true }),
    admin
      .from("minds_leads")
      .select("*", { count: "exact", head: true })
      .eq("channel", "inner_child"),
    admin
      .from("minds_leads")
      .select("*", { count: "exact", head: true })
      .eq("channel", "inner_child")
      .not("parts_map", "is", null),
  ]);

  // 결제완료(confirmed) 금액 합계 — 4개 결제 테이블을 합산해 환불 카드에 보여준다.
  const PAYMENT_TABLES = [
    "husband_match_payments",
    "counseling_purchases",
    "workshop_purchases",
    "minds_relationship_purchases",
  ];
  const paymentSums = await Promise.all(
    PAYMENT_TABLES.map((t) =>
      admin.from(t).select("amount").eq("status", "confirmed")
    )
  );
  const confirmedTotal = paymentSums.reduce(
    (sum, res) =>
      sum +
      (res.data ?? []).reduce(
        (s, r) => s + ((r as { amount: number }).amount ?? 0),
        0
      ),
    0
  );

  const cards: DashboardCard[] = [
    {
      href: "/admin/essays",
      eyebrow: "CMS · 기분레터",
      title: "에세이 관리",
      description:
        "마음 구독 에세이(기분레터)를 직접 쓰고, 예약 공개·발송 상태를 확인해요.",
      stats: [
        { label: "전체 에세이", value: essayTotal, unit: "편" },
        { label: "발송 완료", value: sentCount, unit: "편" },
      ],
      subLinks: [
        { href: "/admin/essays/new", label: "+ 새 에세이 작성" },
        { href: "/essays", label: "공개 목록 보기 ↗" },
      ],
    },
    {
      href: "/admin/waitlist",
      eyebrow: "LEAD · 신청 현황",
      title: "워크북 대기신청",
      description:
        "워크북 대기신청·알림신청 내역과 광고 유입(크리에이티브)별 성과를 분석해요.",
      stats: [
        { label: "대기신청", value: waitlistCount ?? 0, unit: "명" },
        { label: "알림신청", value: notifyCount ?? 0, unit: "건" },
      ],
    },
    {
      href: "/admin/workshop-surveys",
      eyebrow: "WORKBOOK · 설문 응답",
      title: "워크북 제작 설문",
      description:
        "결제 후 회원이 제출한 맞춤 제작 설문(이름·연락처·고민·해결하고 싶은 부분)을 확인해요.",
      stats: [{ label: "제출", value: surveyCount ?? 0, unit: "건" }],
    },
    {
      href: "/admin/reviews",
      eyebrow: "REVIEW · 테스트 후기",
      title: "테스트 후기",
      description:
        "성취중독·minds 테스트 후 페이월에서 이탈하려던 방문자가 남긴 후기를 테스트별로 보고, 추첨 연락처를 확인해요.",
      stats: [{ label: "후기", value: reviewCount ?? 0, unit: "건" }],
    },
    {
      href: "/admin/inner-child",
      eyebrow: "LEAD · 내면 아이",
      title: "내면 아이 리드",
      description:
        "내면 아이 찾기 테스트를 완료한 방문자의 유형 분포·완주율과, 각자가 고른 답변·채점 결과를 확인해요.",
      stats: [
        { label: "완주", value: innerChildDone ?? 0, unit: "명" },
        { label: "전체 시작", value: innerChildTotal ?? 0, unit: "명" },
      ],
    },
    {
      href: "/admin/payments",
      eyebrow: "PAYMENT · 결제 · 환불",
      title: "결제 · 환불 관리",
      description:
        "이메일로 유저의 결제 내역(남편상·상담·워크북·관계 리포트)을 조회하고, 결제완료 건을 바로 환불해요.",
      stats: [{ label: "결제완료 합계", value: confirmedTotal ?? 0, unit: "원" }],
    },
  ];

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-5xl mx-auto px-5 py-16">
        {/* 헤더 */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-2">
            ADMIN
          </p>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            관리자 대시보드
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            기분 스튜디오의 모든 관리 화면을 여기서 한눈에 보고 바로 들어갈 수
            있어요.
          </p>
        </div>

        {/* 대시보드 트리 — 카드 클릭 시 해당 대시보드로 진입 */}
        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <div
              key={card.href}
              className="group relative flex flex-col rounded-2xl border-2 border-[var(--foreground)]/10 bg-white p-6 transition-colors hover:border-[var(--foreground)]"
            >
              {/* 카드 전체를 클릭 영역으로 (sub 링크보다 아래 레이어) */}
              <Link
                href={card.href}
                className="absolute inset-0 z-0 rounded-2xl"
                aria-label={`${card.title} 대시보드로 이동`}
              />

              <div className="relative z-10 pointer-events-none">
                <p className="text-[11px] font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-2">
                  {card.eyebrow}
                </p>
                <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                  {card.title}
                  <span className="text-[var(--foreground)]/30 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </h2>
                <p className="mt-2 text-sm text-[var(--foreground)]/60 leading-relaxed">
                  {card.description}
                </p>

                {/* 요약 숫자 */}
                <div className="mt-5 flex gap-6">
                  {card.stats.map((s) => (
                    <div key={s.label}>
                      <p className="text-[11px] text-[var(--foreground)]/50 mb-0.5">
                        {s.label}
                      </p>
                      <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                        {s.value}
                        <span className="text-sm font-medium text-[var(--foreground)]/50 ml-1">
                          {s.unit}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 바로가기 서브 링크 — 카드 클릭과 별개로 동작하도록 위 레이어 */}
              {card.subLinks && card.subLinks.length > 0 && (
                <div className="relative z-10 mt-5 flex flex-wrap gap-3 border-t border-[var(--foreground)]/10 pt-4">
                  {card.subLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-xs font-semibold text-[var(--foreground)]/60 hover:text-[var(--foreground)] underline underline-offset-2"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
