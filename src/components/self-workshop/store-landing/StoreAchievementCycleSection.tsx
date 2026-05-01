"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StoreHeroWorkbookSlideshow } from "./StoreHeroWorkbookSlideshow";
import type { DemoWorkshopResult } from "@/lib/self-workshop/getDemoWorkshopResult";

/**
 * [04.5] 성취 중독의 정의 + 6단계 순환 패턴 다이어그램
 *
 * 진단 미리보기 다음에 배치되어 "당신이 빠진 패턴은 이런 구조"라는 메타 인지를 형성.
 * 데스크톱: 원형 다이어그램 (스크롤 인 시 노드들이 시계 방향 stagger 페이드인).
 * 모바일: 세로 리스트.
 */

const CYCLE_STEPS: { number: string; title: string; description: string }[] = [
  { number: "01", title: "성취 압박", description: "더 잘해야 한다는 불안" },
  { number: "02", title: "과잉 몰입", description: "일에 과도하게 집중" },
  { number: "03", title: "일시적 안도", description: "성과 달성 순간의 만족" },
  { number: "04", title: "공허감", description: "금세 찾아오는 허무함" },
  { number: "05", title: "자기 의심", description: "아직 부족하다는 생각" },
  { number: "06", title: "더 큰 목표", description: "다시 시작되는 압박감" },
];

interface Props {
  /** 데모 유저(mingle22) 워크북 결과 — 슬라이드쇼 카드 콘텐츠로 사용. null 이면 placeholder. */
  demoResult: DemoWorkshopResult | null;
}

export function StoreAchievementCycleSection({ demoResult }: Props) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24">
      {/* 인용구 헤드라인 */}
      <div className="text-center">
        <span
          aria-hidden
          className="block text-5xl sm:text-6xl font-bold text-[var(--foreground)]/25 leading-none"
        >
          &ldquo;
        </span>
        <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.4] text-[var(--foreground)] break-keep">
          열심히 사는 것과
          <br />
          멈추지 못하는 것은 다릅니다.
        </h2>
      </div>

      {/* 구분선 */}
      <div className="my-12 sm:my-14 h-px bg-[var(--foreground)]/15" />

      {/* 공감 케이스 — 일상 스토리 3줄 */}
      <p className="text-center text-base sm:text-lg leading-[1.85] text-[var(--foreground)]/85 break-keep max-w-xl mx-auto">
        프로젝트를 성공시켜도 기쁨은 하루를 넘기지 못합니다.
        <br />
        칭찬을 들어도 &lsquo;이번엔 운이 좋았을 뿐&rsquo;이라는 생각이 먼저 듭니다.
        <br />
        쉬려고 하면 뒤처질 것 같은 불안이 밀려옵니다.
      </p>

      {/* 6단계 순환 패턴 — 데스크톱 원형 다이어그램 */}
      <div className="hidden md:block mt-20">
        <CycleDiagram />
      </div>

      {/* 6단계 순환 패턴 — 모바일 세로 리스트 */}
      <div className="md:hidden mt-12">
        <CycleList />
      </div>

      {/* 성취 중독 정의 본문 — 다이어그램 직후 명명 */}
      <p className="mt-14 sm:mt-16 text-center text-base sm:text-lg leading-[1.85] text-[var(--foreground)]/80 break-keep max-w-xl mx-auto">
        심리학에서는 성과로 자기 가치를 증명하려는 강박적 패턴을{" "}
        <strong className="font-semibold text-[var(--foreground)]">
          &lsquo;성취 중독(Achievement Addiction)&rsquo;
        </strong>
        이라 부릅니다.
      </p>

      {/* 워크북 핵심 메시지 */}
      <motion.div
        className="mt-10 sm:mt-12 text-center"
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.3] text-[var(--foreground)] break-keep">
          성취해도 불안하고, 멈추면 더 불안한 당신을 위한
          <br />
          10단계의 워크북 커리큘럼
        </p>
      </motion.div>

      {/* 실제 워크북 페이지 슬라이드쇼 — mingle22 데모 결과 기반 */}
      <StoreHeroWorkbookSlideshow demoResult={demoResult} />
    </section>
  );
}

/* ── 데스크톱 원형 다이어그램 ── */
function CycleDiagram() {
  // 활성 단계 인덱스 — 등장 모션 끝난 후 1.3초마다 다음으로 무한 순환
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  useEffect(() => {
    // 등장 stagger 완료(약 1.5초) 직후 첫 강조 시작
    const startTimeout = setTimeout(() => {
      setActiveIdx(0);
    }, 1500);

    // 그 후 1.3초마다 다음 단계로 회전
    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        if (prev === null) return 0;
        return (prev + 1) % CYCLE_STEPS.length;
      });
    }, 1300);

    return () => {
      clearTimeout(startTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative mx-auto aspect-square max-w-lg">
      {/* 점선 원 — 등장 후 무한 회전 (dashes가 흐르는 효과) */}
      <motion.div
        className="absolute top-1/2 left-1/2 rounded-full border-2 border-dashed border-[var(--foreground)]/20"
        style={{ width: "76%", height: "76%", x: "-50%", y: "-50%" }}
        initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 360 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{
          opacity: { duration: 0.6, ease: "easeOut" },
          scale: { duration: 0.6, ease: "easeOut" },
          rotate: { duration: 45, repeat: Infinity, ease: "linear" },
        }}
      />

      {/* 중앙 라벨 */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <p className="text-sm sm:text-base text-[var(--foreground)]/55 leading-tight break-keep">
          성취 중독
          <br />
          순환 패턴
        </p>
      </motion.div>

      {/* 6개 노드 (시계방향 12시 → 2시 → 4시 → 6시 → 8시 → 10시) */}
      {CYCLE_STEPS.map((step, idx) => {
        const angle = (idx * 60 - 90) * (Math.PI / 180);
        const radiusPct = 38;
        const cx = 50 + radiusPct * Math.cos(angle);
        const cy = 50 + radiusPct * Math.sin(angle);
        const isActive = activeIdx === idx;
        return (
          <motion.div
            key={step.number}
            className="absolute -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ left: `${cx}%`, top: `${cy}%`, width: "130px" }}
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{
              duration: 0.45,
              delay: 0.2 + idx * 0.15,
              ease: "easeOut",
            }}
          >
            {/* 번호 원 — 활성 시 검정 fill + scale 펄스 */}
            <motion.span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-sm font-bold"
              animate={{
                backgroundColor: isActive ? "#191919" : "#ffffff",
                color: isActive ? "#ffffff" : "#191919",
                scale: isActive ? 1.2 : 1,
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {step.number}
            </motion.span>
            <motion.p
              className="mt-2 text-sm font-bold text-[var(--foreground)] break-keep"
              animate={{ opacity: isActive ? 1 : 0.7 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {step.title}
            </motion.p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--foreground)]/55 break-keep">
              {step.description}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── 모바일 세로 리스트 ── */
function CycleList() {
  return (
    <ul className="space-y-3">
      {CYCLE_STEPS.map((step, idx) => (
        <motion.li
          key={step.number}
          className="flex items-start gap-4 rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-4"
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, delay: idx * 0.1, ease: "easeOut" }}
        >
          <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] bg-white text-xs font-bold text-[var(--foreground)]">
            {step.number}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-[var(--foreground)] break-keep">
              {step.title}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-[var(--foreground)]/60 break-keep">
              {step.description}
            </p>
          </div>
        </motion.li>
      ))}
    </ul>
  );
}
