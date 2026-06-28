import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isWorkshopTestUser } from "@/lib/self-workshop/test-users";
import { WorkshopSurveyForm } from "@/components/self-workshop/WorkshopSurveyForm";

export const dynamic = "force-dynamic";

export default async function WorkshopSurveyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/self-workshop/survey");

  const isTestUser = isWorkshopTestUser(user.email);

  // 결제(confirmed) 회원만 설문 작성 가능.
  const { data: purchase } = await supabase
    .from("workshop_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .eq("status", "confirmed")
    .maybeSingle();

  if (!purchase && !isTestUser) {
    redirect("/dashboard/self-workshop");
  }

  // 이미 제출했으면 제작 안내로 보낸다(중복 작성 방지).
  const { data: existing } = await supabase
    .from("workshop_survey_responses")
    .select("id")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .maybeSingle();

  if (existing) {
    redirect("/dashboard/self-workshop/generating");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/45">
          WORKBOOK SURVEY
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
          워크북 제작을 위한 설문
        </h1>
        <p className="mt-3 break-keep text-sm leading-relaxed text-[var(--foreground)]/60">
          답변을 바탕으로 회원님께 꼭 맞는 워크북을 새롭게 제작해 드려요.
          <br />2~3분이면 충분합니다.
        </p>
      </header>

      <div className="mt-10">
        <WorkshopSurveyForm />
      </div>
    </div>
  );
}
