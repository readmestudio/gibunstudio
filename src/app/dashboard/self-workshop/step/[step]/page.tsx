import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { WORKSHOP_STEPS } from "@/lib/self-workshop/diagnosis";
import { WorkshopDiagnosisContent } from "@/components/self-workshop/WorkshopDiagnosisContent";
import { WorkshopResultContent } from "@/components/self-workshop/WorkshopResultContent";
import { WorkshopExerciseStep4 } from "@/components/self-workshop/WorkshopExerciseStep4";
import { WorkbookChapterHeader } from "@/components/self-workshop/workbook-redesign/WorkbookChapterHeader";
import { WorkshopAIAnalysis } from "@/components/self-workshop/WorkshopAIAnalysis";
import { WorkshopExerciseStep5CoreBelief } from "@/components/self-workshop/WorkshopExerciseStep5CoreBelief";
import { WorkshopExerciseStep7 } from "@/components/self-workshop/WorkshopExerciseStep7";
import { WorkshopReflectionContent } from "@/components/self-workshop/WorkshopReflectionContent";
import { WorkshopPaymentGate } from "@/components/self-workshop/WorkshopPaymentGate";
import { WorkshopBeliefDestroyContent } from "@/components/self-workshop/WorkshopBeliefDestroyContent";
import { WorkshopAlternativeThoughtContent } from "@/components/self-workshop/WorkshopAlternativeThoughtContent";
import { WorkshopNewBeliefContent } from "@/components/self-workshop/WorkshopNewBeliefContent";
import {
  isCognitiveErrorId,
  type CognitiveErrorId,
} from "@/lib/self-workshop/cognitive-errors";

interface Props {
  params: Promise<{ step: string }>;
}

// router cache가 stale RSC payload(예: 진단 전 redirect 신호)를 사용해
// 진단 직후 step/2 진입이 워크북 리스트로 튕기는 이슈 방지.
// cookies()/auth()로 이미 dynamic이지만 명시적으로 강제.
export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  // 워크북 진행 데이터 조회 — 같은 (user_id, workshop_type)에 여러 row가 있어도
  // 가장 최근 1개를 사용 (PGRST116 "multiple rows" 에러 방지)
  let { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .order("updated_at", { ascending: false })
    .limit(1)
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
  // 예외 1: 구매자가 Step 2를 건너뛰고 Step 3로 이어가는 경우 허용
  // 예외 2: 진단 점수가 있는 사용자는 Step 2(진단 리포트)는 항상 접근 가능
  //         (calculate API가 어떤 이유로 current_step을 못 올린 케이스 보호)
  if (stepNumber > progress.current_step) {
    const canBypass =
      (hasPurchase && stepNumber === 3 && progress.current_step === 2) ||
      (stepNumber === 2 && progress.diagnosis_scores != null);
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

  // 진행 카운터: 완료된 챕터 수 (현재 step 직전까지)
  // - completed: 전부 완료
  // - 그 외: current_step 이전까지 완료된 것으로 간주
  const doneCount =
    progress.status === "completed"
      ? WORKSHOP_STEPS.length
      : Math.max(0, progress.current_step - 1);

  return (
    <div className="min-h-screen bg-white pb-8">
      <WorkbookChapterHeader
        currentStep={stepNumber}
        maxAccessibleStep={
          progress.status === "completed"
            ? WORKSHOP_STEPS.length
            : progress.current_step
        }
        doneCount={doneCount}
      />

      {/* Step별 콘텐츠 렌더링 (11단계 / 5섹션) */}

      {/* TEST · 1단계: 자가 진단 */}
      {stepNumber === 1 && (
        <WorkshopDiagnosisContent
          workshopId={workshopId}
          savedAnswers={progress.diagnosis_answers ?? undefined}
        />
      )}

      {/* TEST · 2단계: 진단 리포트 */}
      {stepNumber === 2 && progress.diagnosis_scores && (
        <WorkshopResultContent
          scores={progress.diagnosis_scores}
          workshopId={workshopId}
          cachedProfile={progress.diagnosis_profile ?? null}
          mechanismAlreadySaved={progress.mechanism_analysis !== null}
        />
      )}

      {/* FIND OUT · 1단계: 트리거 → 자동사고 찾기 (5-Part Model) */}
      {stepNumber === 3 && (
        <WorkshopExerciseStep4
          workshopId={workshopId}
          savedData={progress.mechanism_analysis ?? undefined}
        />
      )}

      {/* FIND OUT · 2단계: 핵심 신념 찾기 (Downward Arrow) */}
      {stepNumber === 4 && (
        <WorkshopExerciseStep5CoreBelief
          workshopId={workshopId}
          savedData={progress.core_belief_excavation ?? undefined}
          mechanismInsights={progress.mechanism_insights ?? null}
          mechanismAnalysis={progress.mechanism_analysis ?? null}
        />
      )}

      {/* FIND OUT · 3단계: 통합 패턴 분석 (6-Part LLM) */}
      {stepNumber === 5 && (
        <WorkshopAIAnalysis
          workshopId={workshopId}
          step={5}
          savedReport={progress.mechanism_insights ?? null}
          mechanismAnalysis={progress.mechanism_analysis ?? null}
          userName={
            (user.user_metadata?.name as string | undefined) ??
            (user.user_metadata?.full_name as string | undefined) ??
            null
          }
        />
      )}

      {/* DESTROY · 1단계: 핵심 믿음 반박 (4기법 통합) */}
      {stepNumber === 6 && (
        <WorkshopBeliefDestroyContent
          workshopId={workshopId}
          savedData={progress.belief_destroy ?? undefined}
          beliefLine={extractBeliefLine(progress.core_belief_excavation)}
          prefillAutomaticThought={
            progress.mechanism_analysis?.automatic_thought ?? ""
          }
          prefillCognitiveErrors={extractCognitiveErrorIds(
            progress.mechanism_insights
          )}
        />
      )}

      {/* DESTROY · 2단계: 대안 자동사고 시뮬레이션 */}
      {stepNumber === 7 && (
        <WorkshopAlternativeThoughtContent
          workshopId={workshopId}
          savedData={progress.alternative_thought_simulation ?? undefined}
          mechanism={extractMechanismSnapshot(progress.mechanism_analysis)}
        />
      )}

      {/* SOLUTION · 1단계: 새 핵심 신념 찾기 */}
      {stepNumber === 8 && (
        <WorkshopNewBeliefContent
          workshopId={workshopId}
          savedData={progress.new_belief ?? undefined}
          recentSituation={progress.mechanism_analysis?.recent_situation ?? ""}
          oldBeliefLine={extractBeliefLine(progress.core_belief_excavation)}
          reframeInvitation={extractReframeInvitation(
            progress.core_belief_excavation
          )}
        />
      )}

      {/* SOLUTION · 2단계: 대체 사고 + 실천 계획 */}
      {stepNumber === 9 && (
        <WorkshopExerciseStep7
          workshopId={workshopId}
          savedData={progress.coping_plan ?? undefined}
          prefillThought={progress.mechanism_analysis?.automatic_thought}
          aiSuggestedErrors={extractCognitiveErrors(progress.mechanism_insights)}
        />
      )}

      {/* SUMMARY · 1단계: 전문 상담사 리포트 */}
      {stepNumber === 10 && (
        <WorkshopAIAnalysis
          workshopId={workshopId}
          step={10}
          savedCards={progress.summary_cards ?? undefined}
        />
      )}

      {/* SUMMARY · 2단계: 마무리 성찰 */}
      {stepNumber === 11 && (
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

function extractCognitiveErrorIds(
  insights: unknown
): CognitiveErrorId[] | undefined {
  const ids = extractCognitiveErrors(insights);
  if (!ids) return undefined;
  // isCognitiveErrorId로 한번 더 좁히기
  return ids.filter((id): id is CognitiveErrorId => isCognitiveErrorId(id));
}

function extractBeliefLine(excavation: unknown): string {
  if (!excavation || typeof excavation !== "object") return "";
  const r = excavation as {
    synthesis?: { belief_line?: unknown };
  };
  const v = r.synthesis?.belief_line;
  return typeof v === "string" ? v.trim() : "";
}

function extractReframeInvitation(excavation: unknown): string {
  if (!excavation || typeof excavation !== "object") return "";
  const r = excavation as {
    synthesis?: { reframe_invitation?: unknown };
  };
  const v = r.synthesis?.reframe_invitation;
  return typeof v === "string" ? v.trim() : "";
}

function extractMechanismSnapshot(mechanism: unknown): {
  situation: string;
  automatic_thought: string;
  emotion: string;
  behavior: string;
} {
  const empty = { situation: "", automatic_thought: "", emotion: "", behavior: "" };
  if (!mechanism || typeof mechanism !== "object") return empty;
  const m = mechanism as {
    recent_situation?: unknown;
    automatic_thought?: unknown;
    emotions_body?: { emotions?: unknown; body_text?: unknown };
    resulting_behavior?: unknown;
  };
  const emotions = Array.isArray(m.emotions_body?.emotions)
    ? m.emotions_body.emotions.filter((e): e is string => typeof e === "string")
    : [];
  const body = typeof m.emotions_body?.body_text === "string"
    ? m.emotions_body.body_text.trim()
    : "";
  const emotionParts: string[] = [];
  if (emotions.length > 0) emotionParts.push(emotions.join(", "));
  if (body) emotionParts.push(body);
  return {
    situation: typeof m.recent_situation === "string" ? m.recent_situation : "",
    automatic_thought:
      typeof m.automatic_thought === "string" ? m.automatic_thought : "",
    emotion: emotionParts.join(" · "),
    behavior:
      typeof m.resulting_behavior === "string" ? m.resulting_behavior : "",
  };
}
