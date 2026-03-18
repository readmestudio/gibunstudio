import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CategoryTabs from "@/components/self-hacking/CategoryTabs";

export default async function SelfHackingPage() {
  /* 로그인 사용자: 이미 완료한 검사 확인 */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const completedTests: string[] = [];

  if (user) {
    const [husbandRes, coreBeliefRes, attachmentRes] = await Promise.all([
      supabase
        .from("phase1_results")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("core_belief_submissions")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("attachment_submissions")
        .select("id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (husbandRes.data) completedTests.push("husband-match");
    if (coreBeliefRes.data) completedTests.push("core-belief");
    if (attachmentRes.data) completedTests.push("attachment");
  }

  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
            내면 분석 리포트
          </h1>
          <p className="mt-3 text-base text-[var(--foreground)]/70">
            나를 읽는 검사를 골라보세요.
          </p>
        </div>

        {/* 카테고리 탭 + 검사 카드 */}
        <CategoryTabs completedTests={completedTests} />

        {/* 홈 링크 */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
