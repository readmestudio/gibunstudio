"use client";

import Link from "next/link";
import { WORKBOOK_CATALOG, type WorkbookInfo } from "@/lib/self-workshop/workbook-catalog";
import { NotifyButton } from "@/components/NotifyButton";
import { PROGRAM_BG } from "@/lib/self-hacking/test-catalog";

/**
 * [04] 워크북 종류 소개
 *
 * 스티키 CTA "워크북 시작하기"의 스크롤 타겟 섹션. id="workbooks".
 * 각 카드: 추천 대상 / 다루는 내용 / 완료 후 효과 / 소요 시간 / 페이지 수 / CTA.
 * 실제 구현된 워크북 콘텐츠(catalog + 8단계)를 기반으로 구성.
 */

type WorkbookMeta = {
  recommendedFor: string[];
  topics: string[];
  outcomes: string[];
  pageInfo: string;
};

const WORKBOOK_META: Record<string, WorkbookMeta> = {
  "achievement-addiction": {
    recommendedFor: [
      "성과가 있어야만 내가 괜찮다고 느껴지는 분",
      "쉬면 죄책감, 달리면 불안 — 둘 사이를 오가는 분",
      "번아웃 · 퇴사 충동이 반복되는 3~15년차 직장인",
    ],
    topics: [
      "자기 가치의 조건화 · 과잉 추동 · 실패 공포 · 정서적 회피 4영역 진단",
      "CBT 5영역 모델로 나만의 순환 패턴 추적",
      "핵심 믿음 문답 + 인지 재구조화 + 행동 실험 설계",
    ],
    outcomes: [
      "나를 몰아치는 자동적 사고와 인지 오류가 객관적으로 보입니다",
      "직장에서 바로 쓸 수 있는 DO & DON'T 체크리스트가 남습니다",
      "마음에 쓰던 에너지가 일로 돌아와 원래 실력이 회복됩니다",
    ],
    pageInfo: "8단계 · 약 75페이지 분량",
  },
  "anxiety-loop": {
    recommendedFor: [
      "같은 걱정이 끝없이 반복되는 분",
      "작은 신호에도 최악의 시나리오가 먼저 그려지는 분",
      "잠들기 전, 하지 않아도 될 걱정에 긴 시간을 쓰는 분",
    ],
    topics: [
      "불안 패턴 자가 진단 (회피 · 확증 · 반추)",
      "걱정 사이클 · 신체 반응 · 회피 행동 분석 실습",
      "노출 기반 행동 실험 · 이완 훈련 가이드",
    ],
    outcomes: [
      "걱정이 '사실'이 아닌 '패턴'이라는 것이 눈에 보입니다",
      "나만의 불안 대처 루틴과 이완 도구가 손에 남습니다",
      "같은 상황이 와도 이전만큼 오래 흔들리지 않게 됩니다",
    ],
    pageInfo: "8단계 · 약 70페이지 분량 (준비 중)",
  },
};

export function StoreWorkbookGridSection() {
  return (
    <section
      id="workbooks"
      className="scroll-mt-24 mx-auto max-w-5xl px-4 py-20"
    >
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        WORKBOOKS
      </p>
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep">
        지금 당신의 주제를 골라주세요
      </h2>
      <p className="mt-4 text-center text-sm sm:text-base text-[var(--foreground)]/60 max-w-xl mx-auto break-keep">
        주제별로 다른 질문, 다른 실습이 준비되어 있어요. 가장 자주 흔들리는 지점부터 시작합니다.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {WORKBOOK_CATALOG.map((wb, idx) => (
          <WorkbookDetailCard key={wb.id} workbook={wb} bgIndex={idx} />
        ))}
      </div>
    </section>
  );
}

/* ── 상세 카드 ── */

function WorkbookDetailCard({
  workbook,
  bgIndex,
}: {
  workbook: WorkbookInfo;
  bgIndex: number;
}) {
  const bg = PROGRAM_BG[bgIndex % PROGRAM_BG.length];
  const meta = WORKBOOK_META[workbook.id];
  const priceLabel =
    workbook.originalPrice && workbook.originalPrice > workbook.price
      ? `${workbook.originalPrice.toLocaleString()}원 → ${workbook.price.toLocaleString()}원`
      : `${workbook.price.toLocaleString()}원`;

  const cardInner = (
    <div className="relative flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]">
      {/* 썸네일 영역 */}
      <div
        className="relative h-32 bg-cover bg-center border-b-2 border-[var(--foreground)]"
        style={{ backgroundImage: `url('${bg}')` }}
      >
        <div className="absolute inset-0 bg-white/30" />
        {workbook.comingSoon && (
          <span className="absolute top-3 left-3 px-2 py-0.5 text-xs font-semibold rounded border border-[var(--foreground)] bg-white text-[var(--foreground)]">
            Coming Soon
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-6">
        {/* 타이틀 */}
        <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">
          {workbook.title} 워크북
        </h3>
        <p className="text-xs text-[var(--foreground)]/60 mb-5">
          {workbook.subtitle}
        </p>

        {/* 이런 분께 추천 */}
        {meta && (
          <>
            <MetaBlock label="이런 분께 추천">
              {meta.recommendedFor.map((t) => (
                <MetaListItem key={t}>{t}</MetaListItem>
              ))}
            </MetaBlock>

            <MetaBlock label="다루는 내용">
              {meta.topics.map((t) => (
                <MetaListItem key={t}>{t}</MetaListItem>
              ))}
            </MetaBlock>

            <MetaBlock label="완료 후 달라지는 것">
              {meta.outcomes.map((t) => (
                <MetaListItem key={t}>{t}</MetaListItem>
              ))}
            </MetaBlock>
          </>
        )}

        {/* 분량 / 소요 시간 */}
        <div className="mt-auto pt-5 border-t border-[var(--foreground)]/10 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--foreground)]/60">
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>📘</span>
            {meta?.pageInfo ?? "8단계 구조"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden>⏱</span>
            {workbook.estimatedMinutes}
          </span>
        </div>

        {/* 가격 + CTA */}
        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            {priceLabel}
          </p>

          {workbook.comingSoon ? (
            <NotifyButton
              programId={workbook.id}
              programTitle={`마음 챙김 워크북 - ${workbook.title}`}
            />
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg border-2 border-[var(--foreground)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] bg-white hover:bg-[var(--foreground)] hover:text-white transition-colors">
              자세히 보기 →
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (workbook.comingSoon) {
    return cardInner;
  }

  return (
    <Link href={`/payment/self-workshop/${workbook.id}`} className="block h-full">
      {cardInner}
    </Link>
  );
}

function MetaBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  );
}

function MetaListItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-[var(--foreground)]/75 break-keep leading-relaxed">
      <span
        aria-hidden
        className="mt-[7px] h-1 w-1 rounded-full bg-[var(--foreground)]/40 flex-shrink-0"
      />
      <span>{children}</span>
    </li>
  );
}
