"use client";

import { useState } from "react";
import type { Stage05Spectrum as Stage05Data } from "@/lib/self-workshop/belief-verification";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";
import { ReceiptLine } from "./shared/ReceiptLine";

/**
 * Stage 05 — SPECTRUM: 흑백 → 그라데이션.
 *
 * 두 슬라이더 모두 한 번 이상 조작해야 다음 활성화.
 * 미조작 시 핸들에 미세 흔들림 (가드 시그널).
 */
export function Stage05Spectrum({
  data,
  onUpdate,
}: {
  data: Stage05Data | undefined;
  onUpdate: (next: Stage05Data) => void;
}) {
  const value: Stage05Data = data ?? {};
  const [shake, setShake] = useState<"self" | "loved" | null>(null);

  function patch(p: Partial<Stage05Data>) {
    onUpdate({ ...value, ...p });
  }

  function bumpShake(which: "self" | "loved") {
    setShake(which);
    setTimeout(() => setShake(null), 600);
  }

  const bothSet =
    typeof value.self_value === "number" &&
    typeof value.loved_value === "number";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
          DEFINE BOUNDS
        </Mono>
        <div
          className="grid gap-3"
          style={{ marginTop: 10, gridTemplateColumns: "1fr" }}
        >
          <BoundField
            label="0점 — 가치가 전혀 없는 사람은 어떤 사람일까?"
            value={value.bound_left ?? ""}
            onChange={(s) => patch({ bound_left: s })}
            placeholder="예: 누구의 시간도 진심으로 듣지 않는 사람"
          />
          <BoundField
            label="100점 — 가치가 완벽한 사람은 어떤 사람일까?"
            value={value.bound_right ?? ""}
            onChange={(s) => patch({ bound_right: s })}
            placeholder="예: 모든 면에서 흠 잡을 곳이 없는 사람"
          />
        </div>
      </div>

      <SpectrumSlider
        label="지금 *나*는 어디에 있나요?"
        value={value.self_value}
        onChange={(v) => patch({ self_value: v })}
        shake={shake === "self"}
        onTryWithoutTouch={() => bumpShake("self")}
      />

      <SpectrumSlider
        label="내가 *사랑하는 사람들*은 어디에 있나요?"
        value={value.loved_value}
        onChange={(v) => patch({ loved_value: v })}
        shake={shake === "loved"}
        onTryWithoutTouch={() => bumpShake("loved")}
      />

      {bothSet && (
        <DynamicReceipt
          selfV={value.self_value as number}
          lovedV={value.loved_value as number}
        />
      )}
    </div>
  );
}

function BoundField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span
        style={{
          fontSize: 12.5,
          color: "var(--v2-body)",
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid var(--v2-line)",
          background: "var(--v2-paper)",
          fontSize: 13.5,
          color: "var(--v2-ink)",
          fontFamily: "var(--font-clinical-body)",
          outline: "none",
        }}
      />
    </label>
  );
}

function SpectrumSlider({
  label,
  value,
  onChange,
  shake,
  onTryWithoutTouch,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
  shake?: boolean;
  onTryWithoutTouch?: () => void;
}) {
  const display = typeof value === "number" ? value : 50;

  return (
    <div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--v2-ink)",
          marginBottom: 10,
          letterSpacing: "-0.005em",
        }}
      >
        {label}
      </p>
      <div
        style={{
          padding: "18px 6px 8px",
          animation: shake ? "bvShake 0.45s ease-in-out" : undefined,
        }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
          <Mono size={10} color="var(--v2-mute)">
            0
          </Mono>
          <Mono
            size={12}
            weight={700}
            color={typeof value === "number" ? "var(--v2-ink)" : "var(--v2-mute)"}
          >
            {typeof value === "number" ? value : "—"}
          </Mono>
          <Mono size={10} color="var(--v2-mute)">
            100
          </Mono>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={display}
          onChange={(e) => onChange(Number(e.target.value))}
          onClick={() => {
            if (typeof value !== "number") {
              onChange(display);
            }
          }}
          onTouchStart={() => {
            if (typeof value !== "number" && onTryWithoutTouch) {
              // 첫 터치 시 흔들림은 부모에서 강제하지 않고, 사용자가 슬라이드를 시작하면 자동으로 onChange
            }
          }}
          className="bv-slider"
          style={{
            width: "100%",
            accentColor: "var(--v2-ink)",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes bvShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}

function DynamicReceipt({ selfV, lovedV }: { selfV: number; lovedV: number }) {
  const diff = lovedV - selfV;
  const tail =
    diff >= 20
      ? "같은 잣대였다면 이 차이는 어디서 올까요?"
      : "두 점수가 비슷한 사람은 흔치 않아요. 자신에게 비교적 공정한 분이세요.";
  return (
    <ReceiptLine>
      자신에게는 <strong style={{ color: "var(--v2-ink)" }}>{selfV}</strong>를,
      사랑하는 사람들에게는{" "}
      <strong style={{ color: "var(--v2-ink)" }}>{lovedV}</strong>를 주셨네요.{" "}
      {tail}
    </ReceiptLine>
  );
}
