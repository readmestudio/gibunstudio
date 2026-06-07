"use client";

/**
 * 명상 호흡 안내용 음파 모션.
 * 들숨 4초 → 멈춤 1초 → 날숨 4초 → 멈춤 1초 = 10초 한 사이클.
 * 동심원 3개가 호흡 리듬에 맞춰 확장·축소하며 음파 같은 인상.
 */

import { motion } from "framer-motion";
import { D } from "@/components/self-workshop/clinical-report/v3-shared";

export function WaveBreathingAnimation({ size = 200 }: { size?: number }) {
  // 호흡 사이클: 4초 들숨(확장) + 1초 멈춤 + 4초 날숨(축소) + 1초 멈춤
  const cycle = {
    duration: 10,
    repeat: Infinity,
    ease: "easeInOut" as const,
  };

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0 auto",
      }}
      aria-hidden
    >
      {/* 가장 바깥 음파 */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `1px solid ${D.accent}`,
        }}
        animate={{
          scale: [0.85, 1.05, 1.05, 0.85, 0.85],
          opacity: [0.15, 0.35, 0.35, 0.15, 0.15],
        }}
        transition={cycle}
      />
      {/* 중간 음파 */}
      <motion.div
        style={{
          position: "absolute",
          inset: "12%",
          borderRadius: "50%",
          border: `1px solid ${D.accent}`,
        }}
        animate={{
          scale: [0.8, 1.1, 1.1, 0.8, 0.8],
          opacity: [0.3, 0.55, 0.55, 0.3, 0.3],
        }}
        transition={cycle}
      />
      {/* 안쪽 코어 */}
      <motion.div
        style={{
          position: "absolute",
          inset: "32%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${D.accent}55, ${D.accent}10 60%, transparent 75%)`,
        }}
        animate={{
          scale: [0.7, 1.2, 1.2, 0.7, 0.7],
        }}
        transition={cycle}
      />
      {/* 호흡 텍스트 — 들숨·날숨 라벨 */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: D.mono,
          fontSize: 11,
          letterSpacing: "0.2em",
          color: D.text3,
          textTransform: "uppercase",
        }}
        animate={{
          opacity: [0.6, 1, 0.6, 1, 0.6],
        }}
        transition={cycle}
      >
        <BreathLabel />
      </motion.div>
    </div>
  );
}

/** "INHALE" → 멈춤 → "EXHALE" → 멈춤 사이클에 맞춰 텍스트 교체. */
function BreathLabel() {
  return (
    <span style={{ position: "relative", width: 60, textAlign: "center" }}>
      <motion.span
        style={{ position: "absolute", inset: 0 }}
        animate={{ opacity: [1, 1, 0, 0, 1] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.4, 0.5, 0.9, 1],
        }}
      >
        들숨
      </motion.span>
      <motion.span
        style={{ position: "absolute", inset: 0 }}
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
          times: [0, 0.4, 0.5, 0.9, 1],
        }}
      >
        날숨
      </motion.span>
    </span>
  );
}
