import Image from "next/image";
import Link from "next/link";
import { NotifyButton } from "@/components/NotifyButton";

/* ──────────────────────────────────────────────
   프로그램 카드 데이터
   ────────────────────────────────────────────── */
interface ProgramCardData {
  id: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  illustration: string; // /public/doodles/ 내 파일명 (확장자 제외)
  /** true 면 카드 클릭 비활성, CTA 자리에 "알림 신청" 라벨이 노출됩니다. */
  notifyOnly?: boolean;
}

const PROGRAMS: ProgramCardData[] = [
  {
    id: "self-report",
    title: "내면 분석 리포트",
    description:
      "가치관, 사고 패턴, 감정 반응을 분석해 리포트를 만들어요. 셀프 해킹 테스트는 무료예요.",
    href: "/self-hacking",
    cta: "검사 선택하기 →",
    illustration: "brain-mind",
    notifyOnly: true,
  },
  {
    id: "self-workshop",
    title: "직장인을 위한 마음 챙김 워크북",
    description:
      "재능은 충분한데 마음 때문에 성과가 안 나는 직장인을 위한 CBT 기반 셀프 워크북",
    href: "/payment/self-workshop",
    cta: "구매하기 →",
    illustration: "journal-book",
  },
  {
    id: "counseling",
    title: "1:1 심리 상담",
    description:
      "1급 심리상담사와 만나 깊이 있는 대화로 내 마음을 이해해 보세요.",
    href: "/#pricing",
    cta: "자세히 보기 →",
    illustration: "chat-bubble",
    notifyOnly: true,
  },
];

/* ──────────────────────────────────────────────
   일러스트 카드 컴포넌트
   ────────────────────────────────────────────── */
function ProgramCard({ program }: { program: ProgramCardData }) {
  const cardBody = (
    <div
      className={`flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow ${
        program.notifyOnly
          ? "opacity-70"
          : "hover:shadow-[4px_4px_0_var(--foreground)]"
      }`}
    >
      {/* 일러스트 영역 */}
      <div className="flex items-center justify-center py-10 px-6">
        <Image
          src={`/doodles/${program.illustration}.svg`}
          alt={program.title}
          width={96}
          height={96}
          className="w-24 h-24 opacity-80"
        />
      </div>

      {/* 텍스트 영역 */}
      <div className="flex flex-col flex-grow p-5 border-t border-[var(--foreground)]/10">
        <h4 className="text-lg font-semibold text-[var(--foreground)] mb-1">
          {program.title}
        </h4>
        <p className="text-sm leading-relaxed text-[var(--foreground)]/60 flex-grow line-clamp-2">
          {program.description}
        </p>

        {/* CTA */}
        {program.notifyOnly ? (
          <NotifyButton
            programId={program.id}
            programTitle={program.title}
            label="알림 신청 →"
            triggerClassName="mt-4 inline-flex w-fit items-center rounded-md border border-[var(--foreground)]/30 bg-[var(--foreground)]/5 px-2.5 py-1 text-xs font-semibold text-[var(--foreground)]/60 hover:bg-[var(--foreground)]/10 transition-colors"
            doneLabel="알림 신청 완료"
          />
        ) : (
          <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
            {program.cta}
          </span>
        )}
      </div>
    </div>
  );

  if (program.notifyOnly) {
    return <div className="cursor-default">{cardBody}</div>;
  }

  return <Link href={program.href}>{cardBody}</Link>;
}

/* ──────────────────────────────────────────────
   메인 ProgramCards 섹션
   ────────────────────────────────────────────── */
export function ProgramCards() {
  return (
    <section id="features">
      <div className="container px-5 py-24 mx-auto lg:px-24">
        {/* 섹션 타이틀 */}
        <div className="flex flex-col w-full mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[var(--foreground)] md:text-5xl">
            나를 해킹하는 프로그램
          </h2>
          <p className="mx-auto text-base leading-relaxed text-[var(--foreground)]/70 lg:w-2/3">
            혼자서, 또는 상담사와 함께. 진짜 나를 이해해 가는 과정이에요.
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {PROGRAMS.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </div>
    </section>
  );
}
