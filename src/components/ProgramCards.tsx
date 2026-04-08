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
    title: "내면 분석 리포트",
    description:
      "가치관, 사고 패턴, 감정 반응을 분석해 리포트를 만들어요. 셀프 해킹 테스트는 무료예요.",
    href: "/self-hacking",
    comingSoon: false,
    cta: "검사 선택하기 →",
  },
  {
    id: "self-workshop",
    title: "내면 탐색 워크샵",
    description:
      "가치관 월드컵, 삶의 의미 탐색 같은 활동지로 직접 답을 찾아가요. 내 속도대로.",
    href: "/payment/self-workshop",
    comingSoon: false,
    cta: "구매하기 →",
  },
  {
    id: "geumjjok",
    title: "금쪽 상담소",
    description:
      "사소한 고민이 많은 걸 설명해줘요. 고민을 털어놓으면 내면 분석 리포트가 나와요.",
    href: "/payment/geumjjok",
    comingSoon: false,
    cta: "구매하기 →",
  },
];

/** 관계 해석 상담 제외 (셀프 해킹 3 + 상담 3 정렬) */
const COUNSELING_PROGRAMS: ProgramCardData[] = COUNSELING_TYPES.filter(
  (t) => t.id !== "relationship"
).map((t) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  href: `/payment/counseling/${t.id}`,
  comingSoon: t.notifyOnly,
  cta: t.notifyOnly ? "" : "구매하기 →",
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
      className={`relative flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)] aspect-[1080/1350] ${
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
            나를 해킹하는 프로그램
          </h2>
          <p className="mx-auto text-base leading-relaxed text-[var(--foreground)]/70 lg:w-2/3">
            혼자서, 또는 상담사와 함께. 진짜 나를 이해해 가는 과정이에요.
          </p>
        </div>

        {/* ── 카테고리 1: 셀프 해킹 ── */}
        <div className="mb-16">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[var(--foreground)]">
              셀프 해킹 리포트
            </h3>
            <p className="mt-1 text-sm text-[var(--foreground)]/60">
              내 속도로 나를 이해하는 검사
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
