"use client";

import { useEffect, useState } from "react";
import {
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  type DiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";
import { getSignalLevel } from "@/lib/self-workshop/signal";
import {
  isDiagnosisProfile,
  type DiagnosisProfile,
} from "@/lib/self-workshop/diagnosis-profile";

interface Props {
  workshopId: string;
  scores: DiagnosisScores;
  cachedProfile: DiagnosisProfile | null;
}

const LIFE_IMPACT_AREAS: Array<{
  key: keyof DiagnosisProfile["life_impact"];
  label: string;
}> = [
  { key: "work", label: "일" },
  { key: "relationship", label: "관계" },
  { key: "rest", label: "쉼" },
  { key: "body", label: "몸" },
];

export function DiagnosisProfileCard({
  workshopId,
  scores,
  cachedProfile,
}: Props) {
  const initialProfile = isDiagnosisProfile(cachedProfile)
    ? cachedProfile
    : null;
  const [profile, setProfile] = useState<DiagnosisProfile | null>(
    initialProfile
  );
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialProfile) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/self-workshop/personalize-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workshopId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "프로필 생성에 실패했습니다");
        if (cancelled) return;
        if (isDiagnosisProfile(data.profile)) {
          setProfile(data.profile);
        } else {
          throw new Error("프로필 형식이 올바르지 않습니다");
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [workshopId, initialProfile]);

  const levelMeta =
    DIAGNOSIS_LEVELS.find((l) => l.level === scores.level) ?? null;

  return (
    <div className="space-y-4">
      {/* 총점·레벨 카드 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">
              총점
            </p>
            <p className="text-4xl font-bold text-[var(--foreground)]">
              {scores.total}
              <span className="text-base font-normal text-[var(--foreground)]/40">
                {" "}/100
              </span>
            </p>
          </div>
          {levelMeta && (
            <span className="rounded-full border-2 border-[var(--foreground)] px-3 py-1 text-xs font-semibold">
              Level {scores.level} · {levelMeta.name}
            </span>
          )}
        </div>
      </div>

      {/* 통합 프로필: 캐릭터 + 차원 바 + 일상 영향 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50 text-center">
          Your Final Profile
        </p>

        {loading ? (
          <ProfileSkeleton />
        ) : error || !profile ? (
          <ProfileError message={error || "프로필을 불러오지 못했어요"} />
        ) : (
          <>
            <p className="mt-3 text-center text-xl font-bold leading-snug text-[var(--foreground)]">
              {profile.character_line}
            </p>

            {/* 4차원 콤팩트 바 모음 */}
            <div className="mt-6 space-y-4">
              {DIMENSIONS.map((dim) => {
                const score = scores.dimensions[dim.key as DimensionKey];
                const percent = (score / 25) * 100;
                const signal = getSignalLevel(score);
                return (
                  <div key={dim.key}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-semibold text-[var(--foreground)]">
                        {dim.jargonLabel}
                        <span className="ml-1 text-xs font-normal text-[var(--foreground)]/55">
                          ({dim.label})
                        </span>
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${signal.className}`}
                        >
                          <span>{signal.emoji}</span>
                          {signal.label}
                        </span>
                        <span className="text-sm font-bold tabular-nums text-[var(--foreground)]">
                          {score}/25
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--foreground)]/10">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 캐릭터 설명 */}
            <p className="mt-6 text-sm leading-relaxed text-[var(--foreground)]/75">
              {profile.character_description}
            </p>

            {/* 일상 영향 4영역 */}
            <div className="mt-6 grid grid-cols-1 gap-3">
              {LIFE_IMPACT_AREAS.map((area) => (
                <div
                  key={area.key}
                  className="rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/40 p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]/50">
                    {area.label}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground)]/80">
                    {profile.life_impact[area.key]}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mt-4 space-y-4" aria-label="프로필 생성 중">
      <div className="mx-auto h-5 w-2/3 animate-pulse rounded bg-[var(--foreground)]/10" />
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i}>
            <div className="mb-2 flex justify-between">
              <div className="h-3 w-24 animate-pulse rounded bg-[var(--foreground)]/10" />
              <div className="h-3 w-12 animate-pulse rounded bg-[var(--foreground)]/10" />
            </div>
            <div className="h-2 w-full animate-pulse rounded bg-[var(--foreground)]/10" />
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-3">
        <div className="h-3 w-full animate-pulse rounded bg-[var(--foreground)]/10" />
        <div className="h-3 w-10/12 animate-pulse rounded bg-[var(--foreground)]/10" />
      </div>
      <p className="pt-2 text-center text-xs text-[var(--foreground)]/40">
        프로필을 작성하고 있어요… (약 5~10초)
      </p>
    </div>
  );
}

function ProfileError({ message }: { message: string }) {
  return (
    <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
      <p className="text-sm text-red-700">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-3 rounded-lg border-2 border-[var(--foreground)] px-4 py-2 text-xs font-medium"
      >
        다시 시도
      </button>
    </div>
  );
}
