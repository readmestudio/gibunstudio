import Link from "next/link";
import { COUNSELING_TYPES } from "@/lib/counseling/types";
import { NotifyButton } from "./NotifyButton";

/* ──────────────────────────────────────────────
   프로그램 배경 이미지 (수채화 패턴 6장)
   ────────────────────────────────────────────── */
const PROGRAM_BG = [
  "/program-bg/program-bg-1.png",
  "/program-bg/program-bg-2.png",
  "/program-bg/program-bg-3.png",
  "/program-bg/program-bg-4.png",
  "/program-bg/program-bg-5.png",
  "/program-bg/program-bg-6.png",
];

/* ──────────────────────────────────────────────
   통합 프로그램 카드 데이터
   ────────────────────────────────────────────── */
interface ProgramCardData {
  id: string;
  title: string;
  description: string;
  href: string;
  comingSoon: boolean;
  cta: string;
}

const SELF_HACKING_PROGRAMS: ProgramCardData[] = [
  {
    id: "self-report",
    title: "셀프 검사 리포트",
    description:
      "유튜브·인스타 알고리즘, 자가보고 검사 등 셀프 인풋을 분석해 리포트를 제공합니다. 남편상 테스트를 무료로 체험해 보세요.",
    href: "/husband-match/onboarding",
    comingSoon: false,
    cta: "무료로 시작하기 →",
  },
  {
    id: "self-workshop",
    title: "셀프 워크샵",
    description:
      "가치관 월드컵, 연애 유형 검사, 천직 찾기 등 활동지를 통해 스스로 인생의 답을 찾아가요.",
    href: "#",
    comingSoon: true,
    cta: "",
  },
  {
    id: "geumjjok",
    title: "금쪽 상담소",
    description:
      "내가 하는 사소한 고민이 내 많은 것을 설명해줘요. 현재 고민을 털어놓고 내면 분석 리포트를 받아 보세요.",
    href: "#",
    comingSoon: true,
    cta: "",
  },
];

/** 관계 해석 상담 제외 (셀프 해킹 3 + 상담 3 정렬) */
const COUNSELING_PROGRAMS: ProgramCardData[] = COUNSELING_TYPES.filter(
  (t) => t.id !== "relationship"
).map((t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  href: `/booking/${t.id}`,
  comingSoon: false,
  cta: "자세히 →",
}));

/* ──────────────────────────────────────────────
   통합 프로그램 카드 컴포넌트
   — 셀프해킹/상담 모두 동일한 크기와 레이아웃
   ────────────────────────────────────────────── */
function ProgramCard({
  program,
  bgIndex,
}: {
  program: ProgramCardData;
  bgIndex: number;
}) {
  const bg = PROGRAM_BG[bgIndex % PROGRAM_BG.length];

  const cardInner = (
    <div
      className={`relative flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)] ${
        program.comingSoon ? "opacity-75" : ""
      }`}
    >
      {/* 수채화 배경 */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: `url('${bg}')` }}
      />
      <div className="relative z-10 flex flex-col h-full p-6">
        {/* 제목 */}
        <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">
          {program.title}
        </h4>

        {/* 설명 */}
        <p className="text-sm leading-relaxed text-[var(--foreground)]/70 flex-grow">
          {program.description}
        </p>

        {/* CTA */}
        {program.comingSoon ? (
          <NotifyButton programId={program.id} programTitle={program.title} />
        ) : (
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
            {program.cta}
          </span>
        )}
      </div>
    </div>
  );

  if (program.comingSoon) {
    return cardInner;
  }

  return <Link href={program.href}>{cardInner}</Link>;
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
            셀프 해킹 프로그램을 통해 내 안에 숨겨진 진짜 나를 만나세요
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
              셀프 해킹 리포트
            </h3>
            <p className="mt-1 text-sm text-[var(--foreground)]/60">
              나만의 속도로 나를 해독하는 검사 프로그램
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SELF_HACKING_PROGRAMS.map((program, index) => (
              <ProgramCard key={program.id} program={program} bgIndex={index} />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COUNSELING_PROGRAMS.map((program, index) => (
              <ProgramCard key={program.id} program={program} bgIndex={index + 3} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
