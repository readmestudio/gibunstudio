"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { COUNSELING_TYPES } from "@/lib/counseling/types";
import { NotifyButton } from "./NotifyButton";

/* ──────────────────────────────────────────────
   프로그램 카드 데이터
   ────────────────────────────────────────────── */
interface ProgramCardData {
  id: string;
  title: string;
  description: string;
  href: string;
  comingSoon: boolean;
  cta: string;
  illustration: string; // /public/doodles/ 내 파일명 (확장자 제외)
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
    illustration: "brain-mind",
  },
  {
    id: "self-workshop",
    title: "마음 챙김 워크북",
    description:
      "나의 마음 패턴을 이해하고, 스스로 대처법을 찾아가는 CBT 기반 셀프 워크북",
    href: "/payment/self-workshop",
    comingSoon: false,
    cta: "구매하기 →",
    illustration: "journal-book",
  },
  {
    id: "geumjjok",
    title: "금쪽 상담소",
    description:
      "사소한 고민이 많은 걸 설명해줘요. 고민을 털어놓으면 내면 분석 리포트가 나와요.",
    href: "/payment/geumjjok",
    comingSoon: false,
    cta: "구매하기 →",
    illustration: "chat-bubble",
  },
];

const COUNSELING_PROGRAMS: ProgramCardData[] = COUNSELING_TYPES.filter(
  (t) => t.id !== "relationship"
).map((t, i) => ({
  id: t.id,
  title: t.title,
  description: t.description,
  href: `/payment/counseling/${t.id}`,
  comingSoon: t.notifyOnly,
  cta: t.notifyOnly ? "" : "구매하기 →",
  illustration: ["mystic-eye", "star-sparkle", "face-smile"][i] || "star-sparkle",
}));

/* ──────────────────────────────────────────────
   일러스트 카드 컴포넌트
   ────────────────────────────────────────────── */
function ProgramCard({ program }: { program: ProgramCardData }) {
  const cardInner = (
    <div
      className={`flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)] ${
        program.comingSoon ? "opacity-60" : ""
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
        {program.comingSoon ? (
          <div className="mt-4">
            <NotifyButton programId={program.id} programTitle={program.title} />
          </div>
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
   탭 타입
   ────────────────────────────────────────────── */
type TabKey = "self" | "counseling";

const TABS: { key: TabKey; label: string }[] = [
  { key: "self", label: "셀프 해킹 리포트" },
  { key: "counseling", label: "심리상담" },
];

/* ──────────────────────────────────────────────
   메인 ProgramCards 섹션
   ────────────────────────────────────────────── */
export function ProgramCards() {
  const [activeTab, setActiveTab] = useState<TabKey>("self");

  const programs =
    activeTab === "self" ? SELF_HACKING_PROGRAMS : COUNSELING_PROGRAMS;

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

        {/* 탭 버튼 */}
        <div className="flex justify-center gap-2 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? "bg-[var(--foreground)] text-white"
                  : "border-2 border-[var(--foreground)] text-[var(--foreground)] bg-white hover:bg-[var(--foreground)]/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 카드 그리드 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      </div>
    </section>
  );
}
