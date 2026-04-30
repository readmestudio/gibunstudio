"use client";

import { useEffect } from "react";
import { SHARED_COPY } from "@/lib/self-workshop/belief-verification-copy";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";

/**
 * 스테이지 사이 호흡 모달. 2.5–3.0s 후 자동 dismiss, 탭 시 즉시 dismiss.
 * 페이드 인/아웃은 키프레임 인라인.
 */
export function PauseInterstitial({
  durationMs = 2700,
  onDone,
}: {
  durationMs?: number;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDone]);

  return (
    <button
      type="button"
      onClick={onDone}
      aria-label="다음으로"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: "rgba(255,255,255,0.96)",
        backdropFilter: "blur(6px)",
        animation: "bvFadeIn 0.4s ease-out",
      }}
    >
      <p
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--v2-ink)",
          letterSpacing: "-0.02em",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        {SHARED_COPY.pauseText}
      </p>
      <div style={{ marginTop: 10 }}>
        <Mono size={11} weight={500} color="var(--v2-mute)" tracked={0.12}>
          {SHARED_COPY.pauseTextEn.toUpperCase()}
        </Mono>
      </div>

      <style jsx>{`
        @keyframes bvFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </button>
  );
}
