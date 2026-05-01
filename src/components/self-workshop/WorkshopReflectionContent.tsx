"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Body,
  COL,
  D,
  EditorialInput,
  Headline,
  Mono,
  SectionHeader,
} from "@/components/self-workshop/clinical-report/v3-shared";

interface Reflections {
  reflection: string;
  self_message: string;
}

// 기존 3필드(new_insight/action_plan/self_message) 저장본을 2필드 모델로 합친다.
// 기존 사용자가 step 10 을 다시 열 때 데이터 손실이 없도록.
function migrateLegacyReflections(saved?: Record<string, unknown>): Reflections {
  if (!saved) return { reflection: "", self_message: "" };

  const reflection =
    typeof saved.reflection === "string" && saved.reflection.length > 0
      ? saved.reflection
      : [saved.new_insight, saved.action_plan]
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
          .join("\n\n");

  const self_message =
    typeof saved.self_message === "string" ? saved.self_message : "";

  return { reflection, self_message };
}

interface Props {
  workshopId: string;
  savedData?: Record<string, unknown>;
}

export function WorkshopReflectionContent({ workshopId, savedData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<Reflections>(() =>
    migrateLegacyReflections(savedData)
  );
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const autoSave = useCallback(
    (updated: Reflections) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "reflections",
            data: updated,
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function updateField(key: keyof Reflections, value: string) {
    const updated = { ...data, [key]: value };
    setData(updated);
    autoSave(updated);
  }

  async function handleComplete() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "reflections",
          data,
          complete: true,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      setCompleted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div
        className="space-y-6 text-center"
        style={{ maxWidth: COL + 96, margin: "0 auto", padding: "64px 48px" }}
      >
        <SectionHeader
          kicker="● COMPLETE · 워크북 종료"
          rightLabel="THANK YOU"
        />
        <Headline size="h1">워크북을 완료했습니다</Headline>
        <Body muted style={{ textAlign: "center", marginTop: 12 }}>
          용기 있게 자신의 내면을 들여다본 당신, 정말 대단합니다.
        </Body>
        <Body small muted style={{ textAlign: "center" }}>
          오늘 발견한 것들이 내일의 작은 변화가 되기를 바랍니다.
        </Body>
        <div className="pt-2">
          <button
            onClick={() => router.push("/dashboard/self-workshop")}
            className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
          >
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const FIELDS = [
    {
      key: "reflection" as const,
      label: "워크북을 하는 동안 느낀 점",
      engCode: "REFLECTION",
      placeholder:
        "이 여정을 지나오는 동안 떠올랐던 생각·감정·발견을 자유롭게 적어보세요.",
      rows: 6,
    },
    {
      key: "self_message" as const,
      label: "나에게 한 마디",
      engCode: "MESSAGE TO SELF",
      placeholder: "지금의 나에게 건네고 싶은 한마디...",
      rows: 4,
    },
  ];

  return (
    <div
      className="space-y-10 pb-20"
      style={{ maxWidth: COL + 96, margin: "0 auto", padding: "0 48px" }}
    >
      {/* 인트로 — 박스 없이 메타 헤더 + 본문 */}
      <section className="space-y-5">
        <SectionHeader kicker="● PART A · STEP 10" rightLabel="CLOSING" />
        <Headline>긴 여정의 마지막</Headline>
        <Body muted style={{ marginTop: 12 }}>
          여기까지 함께해 주셔서 감사해요. 마지막으로, 이 워크북을 통해
          느낀 점과 지금의 나에게 건네고 싶은 한마디를 자유롭게 적어 보세요.
        </Body>
      </section>

      {FIELDS.map((f, i) => (
        <section key={f.key} className="space-y-3">
          <SectionHeader
            kicker={`● ${String(i + 1).padStart(2, "0")} · ${f.label}`}
            rightLabel={f.engCode}
            accent
          />
          <EditorialInput
            multiline
            rows={f.rows}
            value={data[f.key]}
            onChange={(next) => updateField(f.key, next)}
            placeholder={f.placeholder}
            ariaLabel={f.label}
          />
        </section>
      ))}

      <div className="text-center">
        <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
          작성 내용은 자동으로 저장됩니다
        </Mono>
      </div>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <div className="text-center">
        <button
          onClick={handleComplete}
          disabled={submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {submitting ? "저장 중..." : "워크북 완료하기"}
        </button>
      </div>
    </div>
  );
}
