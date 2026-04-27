import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { WorkbookIndex } from "@/components/self-workshop/workbook-redesign/WorkbookIndex";
import { WORKSHOP_STEPS } from "@/lib/self-workshop/diagnosis";

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
    .order("updated_at", { ascending: false })
    .limit(1)
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
      for (let i = 1; i <= WORKSHOP_STEPS.length; i++) completedSteps.push(i);
    } else {
      for (let i = 1; i < currentStep; i++) completedSteps.push(i);
    }
  }

  // 미구매: 결제 안내 + 잠긴 목록
  // 구매 / 테스트 유저: EDITORIAL 톤 워크북 인덱스
  return (
    <>
      {!hasPurchase && (
        <div className="mx-auto" style={{ maxWidth: 1024, padding: "56px 64px 0" }}>
          <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
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
        </div>
      )}

      <WorkbookIndex
        currentStep={currentStep}
        completedSteps={completedSteps}
      />
    </>
  );
}
