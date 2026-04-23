import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { WORKSHOP_STEPS } from "@/lib/self-workshop/diagnosis";
import { WorkshopDiagnosisContent } from "@/components/self-workshop/WorkshopDiagnosisContent";
import { WorkshopResultContent } from "@/components/self-workshop/WorkshopResultContent";
import { WorkshopExerciseStep4 } from "@/components/self-workshop/WorkshopExerciseStep4";
import { WorkshopStep3Understand } from "@/components/self-workshop/WorkshopStep3Understand";
import { WorkshopStepNav } from "@/components/self-workshop/WorkshopStepNav";
import { WorkshopAIAnalysis } from "@/components/self-workshop/WorkshopAIAnalysis";
import { WorkshopExerciseStep5CoreBelief } from "@/components/self-workshop/WorkshopExerciseStep5CoreBelief";
import { WorkshopExerciseStep7 } from "@/components/self-workshop/WorkshopExerciseStep7";
import { WorkshopReflectionContent } from "@/components/self-workshop/WorkshopReflectionContent";
import { WorkshopPaymentGate } from "@/components/self-workshop/WorkshopPaymentGate";
import { isCognitiveErrorId } from "@/lib/self-workshop/cognitive-errors";

interface Props {
  params: Promise<{ step: string }>;
  searchParams: Promise<{ phase?: string }>;
}

export default async function WorkshopStepPage({ params, searchParams }: Props) {
  const { step: stepParam } = await params;
  const { phase } = await searchParams;
  const stepNumber = parseInt(stepParam, 10);

  // 유효한 step 번호 확인
  const stepMeta = WORKSHOP_STEPS.find((s) => s.step === stepNumber);
  if (!stepMeta) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/self-workshop");

  // 워크북 진행 데이터 조회
  let { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .maybeSingle();

  // Step 1(진단)은 progress 없어도 접근 가능 → 자동 생성
  // Step 2+는 progress + 구매 확인 필요
  const TEST_EMAILS: string[] = ["mingle22@hanmail.net"];
  const isTestUser = TEST_EMAILS.includes(user.email ?? "");

  if (!progress && stepNumber === 1) {
    // Step 1 접근 시 progress 없으면 자동 생성 (진단은 무료)
    const { createAdminClient } = await import("@/lib/supabase/admin");
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
    if (!created) redirect("/dashboard/self-workshop");
    // progress를 새로 할당 (재조회 대신)
    progress = created;
  }

  // 진행 데이터가 없으면 대시보드로
  if (!progress) redirect("/dashboard/self-workshop");

  // Step 2+ 접근 시 구매 확인 (테스트 유저 제외)
  let hasPurchase = isTestUser;
  if (!hasPurchase && stepNumber >= 2) {
    const { data: purchase } = await supabase
      .from("workshop_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("workshop_type", "achievement-addiction")
      .eq("status", "confirmed")
      .maybeSingle();
    hasPurchase = !!purchase;
  }

  // 잠금 확인: 현재 step보다 앞선 step만 접근 가능
  // 예외: 구매자가 Step 2를 건너뛰고 Step 3로 이어가는 경우 허용 + current_step 업그레이드
  if (stepNumber > progress.current_step) {
    const canBypass =
      hasPurchase && stepNumber === 3 && progress.current_step === 2;
    if (!canBypass) {
      redirect("/dashboard/self-workshop");
    }
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin
      .from("workshop_progress")
      .update({ current_step: stepNumber })
      .eq("id", progress.id);
    progress.current_step = stepNumber;
  }

  // 미구매 + Step 2+ → 결제 게이트 표시
  if (!hasPurchase && stepNumber >= 2) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="mx-auto max-w-lg mb-8">
          <Link
            href="/dashboard/self-workshop"
            className="text-sm text-[var(--foreground)]/60 hover:underline"
          >
            ← 워크북 목록
          </Link>
        </div>
        <WorkshopPaymentGate scores={progress.diagnosis_scores} />
      </div>
    );
  }

  const workshopId = progress.id;

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      {/* 상단 네비게이션 */}
      <div className="mx-auto max-w-lg mb-8">
        <Link
          href="/dashboard/self-workshop"
          className="text-sm text-[var(--foreground)]/60 hover:underline"
        >
          ← 워크북 목록
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
            {stepNumber}
          </span>
          <div>
            <p className="text-xs font-medium text-[var(--foreground)]/50 uppercase tracking-wider">
              {stepMeta.subtitle}
            </p>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {stepMeta.title}
            </h1>
          </div>
        </div>

        <WorkshopStepNav
          currentStep={stepNumber}
          maxAccessibleStep={
            progress.status === "completed"
              ? WORKSHOP_STEPS.length
              : progress.current_step
          }
        />
      </div>

      {/* Step별 콘텐츠 렌더링 (8단계) */}
      {stepNumber === 1 && (
        <WorkshopDiagnosisContent
          workshopId={workshopId}
          savedAnswers={progress.diagnosis_answers ?? undefined}
        />
      )}

      {stepNumber === 2 && progress.diagnosis_scores && (
        <WorkshopResultContent
          scores={progress.diagnosis_scores}
          workshopId={workshopId}
        />
      )}

      {stepNumber === 3 && progress.diagnosis_scores && (() => {
        if (phase === "exercise") {
          return (
            <WorkshopExerciseStep4
              workshopId={workshopId}
              savedData={progress.mechanism_analysis ?? undefined}
            />
          );
        }
        return (
          <WorkshopStep3Understand
            workshopId={workshopId}
            scores={progress.diagnosis_scores}
            cachedProfile={progress.diagnosis_profile ?? null}
            mechanismAlreadySaved={progress.mechanism_analysis !== null}
          />
        );
      })()}

      {stepNumber === 4 && (
        <WorkshopAIAnalysis
          workshopId={workshopId}
          step={4}
          savedReport={progress.mechanism_insights ?? null}
          userName={
            (user.user_metadata?.name as string | undefined) ??
            (user.user_metadata?.full_name as string | undefined) ??
            null
          }
        />
      )}

      {stepNumber === 5 && (
        <WorkshopExerciseStep5CoreBelief
          workshopId={workshopId}
          savedData={progress.core_belief_excavation ?? undefined}
          mechanismInsights={progress.mechanism_insights ?? null}
          mechanismAnalysis={progress.mechanism_analysis ?? null}
        />
      )}

      {stepNumber === 6 && (
        <WorkshopExerciseStep7
          workshopId={workshopId}
          savedData={progress.coping_plan ?? undefined}
          prefillThought={progress.mechanism_analysis?.automatic_thought}
          aiSuggestedErrors={extractCognitiveErrors(progress.mechanism_insights)}
        />
      )}

      {stepNumber === 7 && (
        <WorkshopAIAnalysis
          workshopId={workshopId}
          step={7}
          savedCards={progress.summary_cards ?? undefined}
        />
      )}

      {stepNumber === 8 && (
        <WorkshopReflectionContent
          workshopId={workshopId}
          savedData={progress.reflections ?? undefined}
        />
      )}
    </div>
  );
}

function extractCognitiveErrors(insights: unknown): string[] | undefined {
  if (!insights || typeof insights !== "object" || Array.isArray(insights)) {
    return undefined;
  }
  const r = insights as {
    cognitive_errors?: { items?: Array<{ id?: unknown }> };
  };
  const ids = r.cognitive_errors?.items
    ?.map((item) => item.id)
    .filter((id): id is string => isCognitiveErrorId(id));
  return ids && ids.length > 0 ? ids : undefined;
}
