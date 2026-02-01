import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { DayMissionContent } from "./DayMissionContent";

const DAY_CONFIG: Record<
  number,
  { missions: { title: string; type: string }[] }
> = {
  1: { missions: [{ title: "TCI 검사", type: "tci" }] },
  2: {
    missions: [
      { title: "감정일기", type: "emotion-diary" },
      { title: "어린시절 문장완성", type: "childhood" },
    ],
  },
  3: {
    missions: [
      { title: "감정일기", type: "emotion-diary" },
      { title: "생각과 사고 구분하기", type: "thought-feeling" },
    ],
  },
  4: {
    missions: [
      { title: "감정일기", type: "emotion-diary" },
      { title: "핵심 신념 문장완성", type: "core-belief" },
    ],
  },
  5: {
    missions: [
      { title: "감정일기", type: "emotion-diary" },
      { title: "Habit Mapper", type: "habit-mapper" },
    ],
  },
  6: {
    missions: [
      { title: "감정일기", type: "emotion-diary" },
      { title: "인지적 오류 검사", type: "cognitive-error" },
    ],
  },
  7: { missions: [{ title: "리포트", type: "report" }] },
};

const DAY_STEP_LIMITS: Record<number, number> = {
  2: 9,
  3: 10,
  4: 12,
  5: 13,
  6: 15,
};

export default async function DayMissionPage({
  params,
}: {
  params: Promise<{ day: string }>;
}) {
  const { day } = await params;
  const dayNum = parseInt(day, 10);
  const config = DAY_CONFIG[dayNum];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!config || dayNum < 1 || dayNum > 7) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/dashboard/7day" className="text-sm text-[var(--foreground)]/60 hover:underline">
        ← 7일 내면 아이 찾기
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
        {dayNum}일차
      </h1>

      <DayMissionContent
        day={dayNum}
        missions={config.missions}
        emotionDiaryMaxStep={DAY_STEP_LIMITS[dayNum]}
      />
    </div>
  );
}
