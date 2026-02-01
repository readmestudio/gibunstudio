"use client";

import Link from "next/link";

type DayMission = {
  day: number;
  missions: { title: string; description: string }[];
};

type Props = { dayMissions: DayMission[]; hasPurchase?: boolean };

export function Dashboard7DayContent({ dayMissions, hasPurchase = false }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm text-[var(--foreground)]/70">
          입금 확인 시점이 1일차(D1) 시작일입니다. 12시 자정 기준으로 일자가 업데이트되며,
          구매 후 14일 동안 미션을 수행할 수 있습니다.
        </p>
      </div>

      <div className="space-y-8">
        {dayMissions.map((dm) => (
          <div key={dm.day}>
            <p className="mb-4 text-sm font-medium text-[var(--foreground)]/60">
              {dm.day}일차
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {dm.missions.map((m) => (
                <Link
                  key={m.title}
                  href={hasPurchase ? `/dashboard/7day/day/${dm.day}` : "/payment/7day"}
                  className={`block rounded-xl border p-6 transition-colors ${
                    hasPurchase
                      ? "border-[var(--border)] bg-white hover:border-[var(--accent)]"
                      : "cursor-pointer border-[var(--border)] bg-[var(--surface)] opacity-75 hover:border-[var(--accent)]/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">
                        {m.title}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--foreground)]/70">
                        {m.description}
                      </p>
                      {!hasPurchase && (
                        <p className="mt-2 text-xs text-[var(--foreground)]/50">
                          구매 후 이용 가능
                        </p>
                      )}
                    </div>
                    <span className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)]">
                      시작하기
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
