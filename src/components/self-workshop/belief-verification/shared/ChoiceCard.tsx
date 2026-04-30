"use client";

import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";

/**
 * Stage 01 OX 카드 게임용 OPTION 카드.
 *
 * - 비선택: 얇은 회색 보더 + 화이트 배경
 * - 선택: 두꺼운 검정 보더 + 우상단 `• SELECTED` 인디케이터 (Image #2 기반)
 * - 호버: 살짝 부풀음 (transform translateY)
 */
export function ChoiceCard({
  optionLabel,
  title,
  description,
  selected,
  onClick,
}: {
  optionLabel: string;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="group relative w-full text-left transition-transform duration-200 hover:-translate-y-[2px] focus:outline-none"
      style={{
        padding: "20px 22px 22px",
        borderRadius: 14,
        background: "var(--v2-paper)",
        border: selected
          ? "2px solid var(--v2-ink)"
          : "1px solid var(--v2-line)",
        boxShadow: selected
          ? "0 4px 16px rgba(0,0,0,0.06)"
          : "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.06}>
          {optionLabel}
        </Mono>

        {selected && (
          <span
            className="inline-flex items-center gap-1.5"
            aria-hidden="true"
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: "var(--v2-accent)",
              }}
            />
            <Mono
              size={10}
              weight={700}
              color="var(--v2-accent)"
              tracked={0.12}
            >
              SELECTED
            </Mono>
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: 14,
          fontSize: 17,
          fontWeight: 700,
          lineHeight: 1.45,
          color: "var(--v2-ink)",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 13,
          lineHeight: 1.65,
          color: "var(--v2-body2)",
          letterSpacing: "-0.005em",
        }}
      >
        {description}
      </div>
    </button>
  );
}
