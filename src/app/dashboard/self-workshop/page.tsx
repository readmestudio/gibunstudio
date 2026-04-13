import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkshopStepList } from "@/components/self-workshop/WorkshopStepList";

export default async function SelfWorkshopDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/self-workshop");

  // 테스트 계정: 결제 없이 워크북 접근 허용
  const TEST_EMAILS = ["mingle22@hanmail.net"];
  const isTestUser = TEST_EMAILS.includes(user.email ?? "");

  // 결제 확인: NicePay 결제 완료된 self-workshop 구매 확인
  // TODO: purchases 테이블에서 program_type='self-workshop' AND status='confirmed' 확인
  // 현재는 workshop_progress 레코드 유무로 대체
  let { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .maybeSingle();

  // 테스트 유저: workshop_progress 레코드가 없으면 admin 클라이언트로 자동 생성
  if (!progress && isTestUser) {
    const admin = createAdminClient();
    const { data: created } = await admin
      .from("workshop_progress")
      .insert({
        user_id: user.id,
        workshop_type: "achievement-addiction",
        current_step: 1,
        status: "in_progress",
      })
      .select()
      .single();
    progress = created;
  }

  const hasPurchase = !!progress;
  const currentStep = progress?.current_step ?? 1;

  // 완료된 step 계산: current_step 이전까지 모두 완료 + completed면 전부
  const completedSteps: number[] = [];
  if (progress) {
    if (progress.status === "completed") {
      for (let i = 1; i <= 8; i++) completedSteps.push(i);
    } else {
      for (let i = 1; i < currentStep; i++) completedSteps.push(i);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--foreground)]/60 hover:underline"
        >
          ← 대시보드
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
          성취 중독을 위한 마음챙김 워크북
        </h1>
        <p className="mt-1 text-sm text-[var(--foreground)]/60">
          CBT 기반 셀프 마음 챙김 워크북
        </p>
      </div>

      {!hasPurchase && (
        <div className="mb-8 rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            워크북을 시작하세요
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            마음 챙김 워크북을 구매하면 워크북을 진행할 수 있습니다.
          </p>
          <Link
            href="/payment/self-workshop"
            className="mt-4 inline-flex rounded-lg border-2 border-[var(--foreground)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            구매하기
          </Link>
        </div>
      )}

      <WorkshopStepList
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
    </div>
  );
}
