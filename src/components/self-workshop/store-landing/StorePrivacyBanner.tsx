"use client";

import { motion } from "framer-motion";

/**
 * [06.7] 보안 배너 — 가격 섹션 다음에 배치되는 단일 배너.
 *
 * 검정 fill 카드 + 자물쇠 아이콘으로 "100% 보안 보장" 신뢰감을 시각적으로 강조.
 */
export function StorePrivacyBanner() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-[var(--foreground)] text-white px-6 sm:px-10 md:px-14 py-12 sm:py-14 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        {/* 자물쇠 아이콘 */}
        <div className="flex justify-center">
          <span
            aria-hidden
            className="inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-white/30 text-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 sm:h-8 sm:w-8"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        </div>

        {/* 헤드라인 — 3줄 */}
        <h3 className="mt-6 sm:mt-7 text-xl sm:text-2xl md:text-[28px] font-bold leading-[1.5] break-keep">
          속 깊은 이야기를 모두 토해내도
          <br />
          누군가 나를 판단하거나
          <br />
          유출될 걱정은 하지 마세요
        </h3>

        {/* 보안 강조 칩 */}
        <p className="mt-7 sm:mt-8 inline-block rounded-full border border-white/30 px-4 py-1.5 text-xs sm:text-sm font-semibold tracking-wide">
          본인 외 누구도 열람할 수 없도록 설계
        </p>

        {/* 기술적 근거 — 정직한 보안 장치 명시 */}
        <div className="mt-8 sm:mt-10 mx-auto max-w-md pt-6 border-t border-white/15">
          <ul className="text-left space-y-2.5 text-[12px] sm:text-[13px] leading-snug text-white/70">
            {[
              {
                title: "Row Level Security",
                body: "DB 권한 분리 — 본인 계정만 자기 데이터 read/write",
              },
              {
                title: "HTTPS 전송 암호화",
                body: "클라이언트 ↔ 서버 모든 통신 TLS 암호화",
              },
              {
                title: "Authenticated Session",
                body: "인증된 본인 세션만 워크북 데이터 접근 가능",
              },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border border-white/40 text-white/80"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-2 w-2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span className="break-keep">
                  <span className="font-semibold text-white">{item.title}</span>
                  <span className="text-white/55"> · {item.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
