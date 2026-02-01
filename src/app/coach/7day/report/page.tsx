import { createClient } from "@/lib/supabase/server";
import { isCoachEmail } from "@/lib/auth/coach";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReportEditor } from "./ReportEditor";

export default async function CoachReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login/coach");
  if (!isCoachEmail(user.email)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/coach/7day" className="text-sm text-[var(--foreground)]/60 hover:underline">
        ← 7일 내면 아이 찾기
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
        리포트 작성
      </h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        6일차 미션을 완료한 회원의 로우데이터를 기반으로 ChatGPT가 리포트를 생성합니다.
        상담사 총평은 직접 작성해 주세요.
      </p>

      <ReportEditor />
    </div>
  );
}
