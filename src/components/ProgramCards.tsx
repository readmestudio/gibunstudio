import Link from "next/link";
import { COUNSELING_TYPES } from "@/lib/counseling/types";

/* ──────────────────────────────────────────────
   셀프 해킹 프로그램 — 홈페이지 전용 표시 데이터
   (registry는 대시보드 전용이므로 건드리지 않음)
   ────────────────────────────────────────────── */
interface SelfHackingProgram {
  id: string;
  title: string;
  description: string;
  href: string;
  comingSoon: boolean;
  cta?: string;
  icon: React.ReactNode;
}

const SELF_HACKING_PROGRAMS: SelfHackingProgram[] = [
  {
    id: "self-report",
    title: "셀프 검사 리포트",
    description:
      "유튜브·인스타 알고리즘, 자가보고 검사 등 셀프 인풋을 분석해 리포트를 제공합니다. 남편상 테스트를 무료로 체험해 보세요.",
    href: "/husband-match/onboarding",
    comingSoon: false,
    cta: "무료로 시작하기 →",
    icon: (
      <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    id: "self-workshop",
    title: "셀프 워크샵",
    description:
      "가치관 월드컵, 연애 유형 검사, 천직 찾기 등 활동지를 통해 스스로 인생의 답을 찾아가요.",
    href: "#",
    comingSoon: true,
    icon: (
      <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "geumjjok",
    title: "금쪽 상담소",
    description:
      "내가 하는 사소한 고민이 내 많은 것을 설명해줘요. 현재 고민을 털어놓고 내면 분석 리포트를 받아 보세요.",
    href: "#",
    comingSoon: true,
    icon: (
      <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} className="w-6 h-6" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

/* ──────────────────────────────────────────────
   1:1 상담 카드용 한 줄 요약 매핑
   (COUNSELING_TYPES.description은 길므로 짧은 요약 사용)
   ────────────────────────────────────────────── */
const COUNSELING_SUMMARY: Record<string, string> = {
  "report-interpret": "리포트 결과를 전문 해석",
  relationship: "커플/부부 관계 패턴 교차 분석",
  "test-package": "심리검사 3종 + 해석 상담 묶음",
  personal: "개인 고민 맞춤 심층 상담",
};

/* ──────────────────────────────────────────────
   셀프 해킹 카드 컴포넌트
   ────────────────────────────────────────────── */
function SelfHackingCard({ program }: { program: SelfHackingProgram }) {
  const content = (
    <div className="flex flex-col h-full p-6 border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]">
      {/* 아이콘 + Coming Soon 뱃지 */}
      <div className="flex items-center justify-between mb-4">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--surface)] text-[var(--foreground)]">
          {program.icon}
        </div>
        {program.comingSoon && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-[var(--foreground)]/30 text-[var(--foreground)]/60">
            Coming Soon
          </span>
        )}
      </div>

      {/* 제목 + 설명 */}
      <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">
        {program.title}
      </h4>
      <p className="text-sm leading-relaxed text-[var(--foreground)]/70 flex-grow">
        {program.description}
      </p>

      {/* CTA */}
      {!program.comingSoon && program.cta && (
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
          {program.cta}
        </span>
      )}
    </div>
  );

  if (program.comingSoon) {
    return <div className="opacity-60 cursor-default">{content}</div>;
  }

  return <Link href={program.href}>{content}</Link>;
}

/* ──────────────────────────────────────────────
   1:1 상담 카드 컴포넌트
   ────────────────────────────────────────────── */
function CounselingCard({
  type,
}: {
  type: (typeof COUNSELING_TYPES)[number];
}) {
  const isBest = type.id === "test-package";
  const summary = COUNSELING_SUMMARY[type.id] ?? type.description;

  return (
    <Link href={`/booking/${type.id}`}>
      <div className="flex flex-col h-full p-5 border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]">
        {/* 제목 + BEST 뱃지 */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="text-base font-semibold text-[var(--foreground)] leading-snug">
            {type.title}
          </h4>
          {isBest && (
            <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--accent)] text-[var(--foreground)]">
              BEST
            </span>
          )}
        </div>

        {/* 한 줄 요약 */}
        <p className="text-sm leading-relaxed text-[var(--foreground)]/70 flex-grow">
          {summary}
        </p>

        {/* CTA */}
        <span className="mt-3 inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
          자세히 →
        </span>
      </div>
    </Link>
  );
}

/* ──────────────────────────────────────────────
   메인 ProgramCards 섹션
   ────────────────────────────────────────────── */
export function ProgramCards() {
  return (
    <section id="features">
      <div className="container px-5 py-24 mx-auto lg:px-24">
        {/* ── 섹션 타이틀 ── */}
        <div className="flex flex-col w-full mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--foreground)] md:text-5xl">
            나를 해킹하면 인생이 쉬워집니다
          </h2>
          <p className="mx-auto text-base leading-relaxed text-[var(--foreground)]/70 lg:w-2/3">
            혼자서 또 전문 심리 상담사와 함께 &lsquo;진짜 나&rsquo;를 만나는
            셀프 해킹 프로그램
          </p>
        </div>

        {/* ── 카테고리 1: 셀프 해킹 ── */}
        <div className="mb-16">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[var(--foreground)]">
              셀프 해킹
            </h3>
            <p className="mt-1 text-sm text-[var(--foreground)]/60">
              나만의 속도로 나를 해독하는 검사 프로그램
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SELF_HACKING_PROGRAMS.map((program) => (
              <SelfHackingCard key={program.id} program={program} />
            ))}
          </div>
        </div>

        {/* ── 카테고리 2: 1:1 상담 ── */}
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[var(--foreground)]">
              1:1 상담
            </h3>
            <p className="mt-1 text-sm text-[var(--foreground)]/60">
              1급 심리 상담사와 Zoom으로 진행하는 전문 상담
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COUNSELING_TYPES.map((type) => (
              <CounselingCard key={type.id} type={type} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
