import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Dashboard7DayContent } from "./Dashboard7DayContent";

const DAY_MISSIONS = [
  { day: 1, missions: [{ title: "TCI 검사", description: "외부 링크로 검사 후 결과 PDF 제출 (코치 업로드)" }] },
  { day: 2, missions: [{ title: "감정일기", description: "대화형 감정 탐색 (9단계)" }, { title: "어린시절 문장완성", description: "12문항 문장 완성 검사" }] },
  { day: 3, missions: [{ title: "감정일기", description: "대화형 감정 탐색 (10단계)" }, { title: "생각과 사고 구분하기", description: "25문항 사고/기분/상황 선택" }] },
  { day: 4, missions: [{ title: "감정일기", description: "대화형 감정 탐색 (12단계)" }, { title: "핵심 신념 문장완성", description: "23문항 문장 완성 검사" }] },
  { day: 5, missions: [{ title: "감정일기", description: "대화형 감정 탐색 (13단계)" }, { title: "Habit Mapper", description: "트리거/행동/결과 탐색" }] },
  { day: 6, missions: [{ title: "감정일기", description: "대화형 감정 탐색 (15단계)" }, { title: "인지적 오류 검사", description: "14문항 체크박스" }] },
  { day: 7, missions: [{ title: "리포트", description: "1~6일차 미션 완료 시 요청 가능" }] },
];

export default async function Dashboard7DayPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // TODO: 구매 여부 확인 (Supabase purchases 테이블)
  const hasPurchase = false; // mock

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-[var(--foreground)]/60 hover:underline">
            ← 대시보드
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
            7일 내면 아이 찾기
          </h1>
        </div>
      </div>

      {!hasPurchase && (
        <div className="mb-8 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            프로그램을 구매해 주세요
          </h2>
          <p className="mt-2 text-[var(--foreground)]/70">
            7일 내면 아이 찾기 프로그램을 구매하면 미션을 진행할 수 있습니다.
          </p>
          <Link
            href="/payment/7day"
            className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
          >
            구매하기
          </Link>
        </div>
      )}

      <Dashboard7DayContent dayMissions={DAY_MISSIONS} hasPurchase={hasPurchase} />
    </div>
  );
}
