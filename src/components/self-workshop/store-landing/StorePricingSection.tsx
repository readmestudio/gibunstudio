"use client";

import { motion } from "framer-motion";

/**
 * [07] 가격 — 좌(포함 항목) / 우(가격 + CTA) 좌우 split.
 *
 * 알림 신청 특가 ₩39,000 — 소프트 런칭 단계라 정식 결제 미오픈.
 * 우측 CTA 는 placeholder anchor (`#waitlist`). 추후 알림 폼/카카오 채널로 hook-up.
 */

const INCLUDED_ITEMS = [
  "진단 테스트 (Likert 5점 척도 20문항)",
  "진단 결과 리포트 (4영역 위험군 분석)",
  "실습 (CBT 5영역 · 하향 화살표 · 대안 사고 · 근거 모으기)",
  "자동사고 / 핵심 신념 분석 리포트 (인지 Cascade)",
  "종합 가이드 리포트 + 자기 확언 카드",
];

export function StorePricingSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-24">
      {/* eyebrow + 헤드라인 */}
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        PRICING
      </p>
      <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.3] text-[var(--foreground)] break-keep">
        단 한 번의 결제,
        <br />
        심리 상담의 절반 가격으로
      </h2>
      <p className="mt-5 text-center text-sm sm:text-base text-[var(--foreground)]/65 max-w-xl mx-auto break-keep leading-relaxed">
        1:1 심리 상담 1회의 절반 비용으로 10단계 워크북 전 과정과 3가지 리포트를
        모두 받아갑니다.
      </p>

      {/* 좌우 카드 */}
      <div className="mt-14 sm:mt-16 grid lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
        {/* 좌측 — 포함 항목 (흰 카드) */}
        <motion.div
          className="rounded-2xl border-2 border-[var(--foreground)]/12 bg-white p-7 sm:p-8 md:p-10 flex flex-col"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-[10px] tracking-widest uppercase font-semibold text-[var(--foreground)]/45">
            INCLUDED
          </p>
          <h3 className="mt-3 text-xl sm:text-2xl font-bold text-[var(--foreground)] break-keep leading-[1.35]">
            한 번 결제에 포함되는 것
          </h3>
          <p className="mt-3 text-sm text-[var(--foreground)]/60 break-keep leading-relaxed">
            10단계 워크북 전 과정과 3가지 분석 리포트, 자기 확언 카드까지 모두
            포함됩니다.
          </p>

          <ul className="mt-7 space-y-3 sm:space-y-3.5 flex-1">
            {INCLUDED_ITEMS.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm sm:text-[15px] text-[var(--foreground)]/85"
              >
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-2.5 w-2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="break-keep leading-[1.55]">{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* 우측 — 가격 (검정 fill) */}
        <motion.div
          className="rounded-2xl bg-[var(--foreground)] text-white p-7 sm:p-8 md:p-10 flex flex-col"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <p className="text-[10px] tracking-widest uppercase font-semibold text-white/55">
            EARLY ACCESS
          </p>
          <h3 className="mt-3 text-xl sm:text-2xl font-bold break-keep leading-[1.35]">
            알림 신청 특가
          </h3>

          {/* 가격 */}
          <div className="mt-8">
            <p className="text-sm text-white/45 line-through tabular-nums">
              심리 상담 1회 평균 ₩80,000
            </p>
            <p className="mt-2 text-5xl sm:text-6xl font-bold tracking-tight text-white tabular-nums leading-none">
              ₩49,000
            </p>
            <p className="mt-3 text-sm text-white/65 break-keep leading-relaxed">
              한 번 결제로 워크북 + 3가지 리포트 영구 보관
            </p>
          </div>

          {/* CTA 버튼 */}
          <div className="mt-auto pt-8">
            <a
              href="#waitlist"
              className="inline-flex w-full items-center justify-center rounded-full bg-white text-[var(--foreground)] px-6 py-4 text-sm sm:text-base font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              출시 알림신청하고 할인받기
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-2 h-4 w-4"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </motion.div>
      </div>

      {/* 하단 안내문 */}
      <motion.p
        className="mt-10 text-center text-xs sm:text-sm text-[var(--foreground)]/55 max-w-xl mx-auto break-keep leading-[1.7]"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6 }}
      >
        현재 소수의 인원으로 소프트 런칭 후 고도화하고 있어요.
        <br className="hidden sm:block" />
        추후 판매가 오픈되면 알림을 보내드릴게요.
      </motion.p>
    </section>
  );
}
