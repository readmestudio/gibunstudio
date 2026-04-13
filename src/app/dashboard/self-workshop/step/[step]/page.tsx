import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { WORKSHOP_STEPS } from "@/lib/self-workshop/diagnosis";
import { WorkshopReadStep1 } from "@/components/self-workshop/WorkshopReadStep1";
import { WorkshopDiagnosisContent } from "@/components/self-workshop/WorkshopDiagnosisContent";
import { WorkshopResultContent } from "@/components/self-workshop/WorkshopResultContent";
import { WorkshopExerciseStep4 } from "@/components/self-workshop/WorkshopExerciseStep4";
import { WorkshopAIAnalysis } from "@/components/self-workshop/WorkshopAIAnalysis";
import { WorkshopReadStep6 } from "@/components/self-workshop/WorkshopReadStep6";
import { WorkshopExerciseStep7 } from "@/components/self-workshop/WorkshopExerciseStep7";
import { WorkshopReflectionContent } from "@/components/self-workshop/WorkshopReflectionContent";

interface Props {
  params: Promise<{ step: string }>;
}

export default async function WorkshopStepPage({ params }: Props) {
  const { step: stepParam } = await params;
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
  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .maybeSingle();

  // 진행 데이터가 없으면 대시보드로
  if (!progress) redirect("/dashboard/self-workshop");

  // 잠금 확인: 현재 step보다 앞선 step만 접근 가능
  if (stepNumber > progress.current_step) {
    redirect("/dashboard/self-workshop");
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
      </div>

      {/* Step별 콘텐츠 렌더링 */}
      {stepNumber === 1 && <WorkshopReadStep1 />}

      {stepNumber === 2 && (
        <WorkshopDiagnosisContent
          workshopId={workshopId}
          savedAnswers={progress.diagnosis_answers ?? undefined}
        />
      )}

      {stepNumber === 3 && progress.diagnosis_scores && (
        <WorkshopResultContent scores={progress.diagnosis_scores} />
      )}

      {stepNumber === 4 && (
        <WorkshopExerciseStep4
          workshopId={workshopId}
          savedData={progress.mechanism_analysis ?? undefined}
        />
      )}

      {stepNumber === 5 && (
        <WorkshopAIAnalysis
          workshopId={workshopId}
          step={5}
          savedCards={progress.mechanism_insights ?? undefined}
        />
      )}

      {stepNumber === 6 && (
        <WorkshopReadStep6
          highlightedErrors={extractCognitiveErrors(progress.mechanism_insights)}
        />
      )}

      {stepNumber === 7 && (
        <WorkshopExerciseStep7
          workshopId={workshopId}
          savedData={progress.coping_plan ?? undefined}
          prefillThought={progress.mechanism_analysis?.my_automatic_thoughts}
          aiSuggestedErrors={extractCognitiveErrors(progress.mechanism_insights)}
        />
      )}

      {stepNumber === 8 && (
        <WorkshopAIAnalysis
          workshopId={workshopId}
          step={8}
          savedCards={progress.summary_cards ?? undefined}
        />
      )}

      {stepNumber === 9 && (
        <WorkshopReflectionContent
          workshopId={workshopId}
          savedData={progress.reflections ?? undefined}
        />
      )}
    </div>
  );
}

/**
 * AI 분석 카드에서 인지적 오류 id 추출
 * Step 5 결과의 cross_validation/hidden_pattern 카드에서 오류 키워드 매칭
 */
function extractCognitiveErrors(
  insights: { card_type: string; content: string }[] | null
): string[] | undefined {
  if (!insights) return undefined;

  const errorKeywords: Record<string, string> = {
    "이분법": "dichotomous",
    "과잉 일반화": "overgeneralization",
    "당위": "should_statements",
    "감정적 추론": "emotional_reasoning",
    "독심술": "mind_reading",
    "파국화": "catastrophizing",
  };

  const found: string[] = [];
  const allContent = insights.map((c) => c.content).join(" ");

  for (const [keyword, id] of Object.entries(errorKeywords)) {
    if (allContent.includes(keyword)) {
      found.push(id);
    }
  }

  return found.length > 0 ? found : undefined;
}
