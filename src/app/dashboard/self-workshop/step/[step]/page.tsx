import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { WORKSHOP_STEPS } from "@/lib/self-workshop/diagnosis";
import {
  deriveExpectedMinStep,
  needsRecovery,
} from "@/lib/self-workshop/progress-recovery";
import { WorkshopDiagnosisContent } from "@/components/self-workshop/WorkshopDiagnosisContent";
import { WorkshopResultContent } from "@/components/self-workshop/WorkshopResultContent";
import { WorkshopExerciseStep4 } from "@/components/self-workshop/WorkshopExerciseStep4";
import { WorkbookChapterHeader } from "@/components/self-workshop/workbook-redesign/WorkbookChapterHeader";
import { WorkshopAIAnalysis } from "@/components/self-workshop/WorkshopAIAnalysis";
import { WorkshopExerciseStep5CoreBelief } from "@/components/self-workshop/WorkshopExerciseStep5CoreBelief";
import { WorkshopBeliefEvidenceContent } from "@/components/self-workshop/WorkshopBeliefEvidenceContent";
import { WorkshopReflectionContent } from "@/components/self-workshop/WorkshopReflectionContent";
import { WorkshopPaymentGate } from "@/components/self-workshop/WorkshopPaymentGate";
import { WorkshopAlternativeThoughtContent } from "@/components/self-workshop/WorkshopAlternativeThoughtContent";
import { WorkshopNewBeliefContent } from "@/components/self-workshop/WorkshopNewBeliefContent";
import { WorkshopPartsDiscovery } from "@/components/self-workshop/WorkshopPartsDiscovery";
import { isWorkshopTestUser } from "@/lib/self-workshop/test-users";
import { isAdaptiveStepsEnabled } from "@/lib/self-workshop/feature-flags";
import { readDialogueRecap } from "@/lib/self-workshop/conversation";

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

  // 11단계 → 10단계 구조 시프트.
  // - DB의 current_step은 progress 조회 직후 lazy migration으로 자동 정렬(아래 블록).
  // - URL redirect는 두지 않는다 — 새 사용자가 정상적으로 새 step/7, 8 등에 진입하는
  //   경로까지 가로채기 때문. 옛 URL(예: 옛 step/11) 북마크는 이제 invalid step으로 notFound 처리.

  // 유효한 step 번호 확인
  const stepMeta = WORKSHOP_STEPS.find((s) => s.step === stepNumber);
  if (!stepMeta) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/self-workshop");

  // 워크북 진행 데이터 조회 — 같은 (user_id, workshop_type)에 여러 row가 있어도
  // 가장 진행이 많이 된 row(current_step desc) → 같은 단계면 가장 최근 row를 사용.
  // PGRST116 "multiple rows" 에러 방지 + 옛 진행 이력이 새 진행을 가로막지 않도록.
  let { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .order("current_step", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Step 1(진단)은 progress 없어도 접근 가능 → 자동 생성
  // Step 2+는 progress + 구매 확인 필요
  const isTestUser = isWorkshopTestUser(user.email);
  const adaptiveEnabled = isAdaptiveStepsEnabled(user.email);

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

  // 자가 회복: 작성된 컬럼으로부터 "도달했어야 할 최소 step" 을 derive 해서
  // current_step 이 그보다 낮으면 위로만 보정.
  // 옛 11→10 마이그레이션 코드가 idempotency 가드 없이 매 방문마다 step 을 깎아
  // 내려 사용자의 실제 진행보다 뒤처진 케이스를 자동 회복하기 위함.
  if (needsRecovery(progress)) {
    const expected = deriveExpectedMinStep(progress);
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    await admin
      .from("workshop_progress")
      .update({ current_step: expected })
      .eq("id", progress.id);
    progress.current_step = expected;
  }

  // Step 2+ 접근 시 구매 확인 (테스트 유저 제외)
  // expires_at(결제 후 90일) 만료된 결제는 hasPurchase=false로 처리.
  let hasPurchase = isTestUser;
  if (!hasPurchase && stepNumber >= 2) {
    const { data: purchase } = await supabase
      .from("workshop_purchases")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("workshop_type", "achievement-addiction")
      .eq("status", "confirmed")
      .maybeSingle();
    if (purchase) {
      const expiresAtRaw = (purchase as { expires_at?: string | null })
        .expires_at;
      const isExpired = expiresAtRaw
        ? new Date(expiresAtRaw).getTime() < Date.now()
        : false;
      hasPurchase = !isExpired;
    }
  }

  // 결제 완료 사용자(테스트 유저 제외)의 인앱 워크북 접근 제어.
  //  · 미전달(released_at NULL) → 인앱 차단 → "제작/전달 현황" 안내로.
  //  · 전달됐고 커스텀 "외부" 링크가 지정됨 → 그 링크로 보게 하므로 인앱은 차단.
  //  · 전달됐고 커스텀 외부 링크 없음(기본) → 기본 성취중독 워크북을 인앱에서 열람 허용.
  // hasPurchase 는 stepNumber>=2 일 때만 계산되므로 결제 여부를 독립적으로 재확인한다.
  if (!isTestUser) {
    const { data: paid } = await supabase
      .from("workshop_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("workshop_type", "achievement-addiction")
      .eq("status", "confirmed")
      .maybeSingle();
    if (paid) {
      const { data: delivery } = await supabase
        .from("workshop_survey_responses")
        .select("released_at, workbook_url")
        .eq("user_id", user.id)
        .eq("workshop_type", "achievement-addiction")
        .maybeSingle();
      const released = !!delivery?.released_at;
      const hasExternalCustom =
        !!delivery?.workbook_url &&
        /^https?:\/\//i.test(delivery.workbook_url);
      if (!released || hasExternalCustom) {
        redirect("/dashboard/self-workshop/generating");
      }
    }
  }

  // 잠금 확인: 현재 step보다 앞선 step만 접근 가능
  // 예외 1: 구매자가 Step 2를 건너뛰고 Step 3로 이어가는 경우 허용
  // 예외 2: 진단 점수가 있는 사용자는 Step 2(진단 리포트)는 항상 접근 가능
  //         (calculate API가 어떤 이유로 current_step을 못 올린 케이스 보호)
  // 예외 3: 인접 진행(N-1 → N)은 항상 허용 — 컴포넌트의 advanceStep fetch가
  //         race condition·여러 progress row·캐시 등 구조적 이유로 적용되지
  //         않은 채 router.push가 도착해도 사용자가 갇히지 않도록 안전망.
  //         단계 *건너뛰기*(N+2 이상)는 여전히 차단됨.
  if (stepNumber > progress.current_step) {
    const canBypass =
      (hasPurchase && stepNumber === 3 && progress.current_step === 2) ||
      (stepNumber === 2 && progress.diagnosis_scores != null) ||
      stepNumber === progress.current_step + 1;
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
          userName={
            (user.user_metadata?.name as string | undefined) ??
            (user.user_metadata?.full_name as string | undefined) ??
            null
          }
        />
      )}

      {/* FIND OUT · 1단계: adaptive=ON → PART 찾기 (IFS), OFF → 기존 5-Part 폼 */}
      {stepNumber === 3 &&
        (adaptiveEnabled ? (
          <WorkshopPartsDiscovery
            workshopId={workshopId}
            savedData={progress.parts_discovery ?? undefined}
            userName={
              (user.user_metadata?.name as string | undefined) ??
              (user.user_metadata?.full_name as string | undefined) ??
              null
            }
          />
        ) : (
          <WorkshopExerciseStep4
            workshopId={workshopId}
            savedData={progress.mechanism_analysis ?? undefined}
            adaptive={false}
          />
        ))}

      {/* FIND OUT · 2단계: 핵심 신념 찾기 (Downward Arrow) */}
      {stepNumber === 4 && (
        <WorkshopExerciseStep5CoreBelief
          workshopId={workshopId}
          savedData={progress.core_belief_excavation ?? undefined}
          mechanismInsights={progress.mechanism_insights ?? null}
          mechanismAnalysis={progress.mechanism_analysis ?? null}
          partsDiscovery={progress.parts_discovery ?? null}
          userName={
            (user.user_metadata?.name as string | undefined) ??
            (user.user_metadata?.full_name as string | undefined) ??
            null
          }
          adaptive={adaptiveEnabled}
        />
      )}

      {/* FIND OUT · 3단계: 통합 패턴 분석 (6-Part LLM) */}
      {stepNumber === 5 && (
        <WorkshopAIAnalysis
          workshopId={workshopId}
          step={5}
          savedReport={progress.mechanism_insights ?? null}
          mechanismAnalysis={progress.mechanism_analysis ?? null}
          coreBeliefExcavation={progress.core_belief_excavation ?? null}
          userName={
            (user.user_metadata?.name as string | undefined) ??
            (user.user_metadata?.full_name as string | undefined) ??
            null
          }
        />
      )}

      {/* RESHAPE · 1단계: 대안 자동사고 시뮬레이션 */}
      {stepNumber === 6 && (
        <WorkshopAlternativeThoughtContent
          workshopId={workshopId}
          savedData={progress.alternative_thought_simulation ?? undefined}
          mechanism={withSelectedThought(
            enrichMechanismFromRecap(
              extractMechanismSnapshot(progress.mechanism_analysis),
              progress.parts_discovery
            ),
            progress.core_belief_excavation
          )}
        />
      )}

      {/* RESHAPE · 2단계: 새 핵심 신념 찾기 */}
      {stepNumber === 7 && (
        <WorkshopNewBeliefContent
          workshopId={workshopId}
          savedData={progress.new_belief ?? undefined}
          recentSituation={
            (progress.mechanism_analysis?.recent_situation ?? "").trim() ||
            enrichMechanismFromRecap(
              extractMechanismSnapshot(progress.mechanism_analysis),
              progress.parts_discovery
            ).situation
          }
          beliefAnalysis={extractBeliefAnalysis(progress.core_belief_excavation)}
        />
      )}

      {/* RESHAPE · 3단계: 새 신념 강화하기 (근거 모으기 실습) */}
      {stepNumber === 8 && (
        <WorkshopBeliefEvidenceContent
          workshopId={workshopId}
          savedData={progress.coping_plan ?? undefined}
          newBelief={progress.new_belief ?? null}
          beliefAnalysis={extractBeliefAnalysis(progress.core_belief_excavation)}
          mechanism={enrichMechanismFromRecap(
            extractMechanismSnapshot(progress.mechanism_analysis),
            progress.parts_discovery
          )}
          userName={
            (user.user_metadata?.name as string | undefined) ??
            (user.user_metadata?.full_name as string | undefined) ??
            null
          }
        />
      )}

      {/* SUMMARY · 1단계: 전문 상담사 리포트 */}
      {stepNumber === 9 && (
        <WorkshopAIAnalysis
          workshopId={workshopId}
          step={9}
          savedCards={progress.summary_cards ?? undefined}
          mechanismAnalysis={progress.mechanism_analysis ?? null}
          mechanismInsights={progress.mechanism_insights ?? null}
          coreBeliefExcavation={progress.core_belief_excavation ?? null}
          beliefDestroy={progress.belief_destroy ?? null}
          newBelief={progress.new_belief ?? null}
          copingPlan={progress.coping_plan ?? null}
          userName={
            (user.user_metadata?.name as string | undefined) ??
            (user.user_metadata?.full_name as string | undefined) ??
            null
          }
        />
      )}

      {/* SUMMARY · 2단계: 마무리 성찰 */}
      {stepNumber === 10 && (
        <WorkshopReflectionContent
          workshopId={workshopId}
          savedData={progress.reflections ?? undefined}
        />
      )}
    </div>
  );
}

function extractBeliefAnalysis(excavation: unknown): {
  belief_about_self?: string;
  belief_about_others?: string;
  belief_about_world?: string;
} | null {
  if (!excavation || typeof excavation !== "object") return null;
  const r = excavation as {
    belief_analysis?: {
      belief_about_self?: unknown;
      belief_about_others?: unknown;
      belief_about_world?: unknown;
    };
    synthesis?: { belief_line?: unknown };
    selected_beliefs?: unknown;
  };

  // 1순위: Step 4 완료 화면에서 사용자가 *고른* 핵심신념 — 수정 실습의 대상.
  const selected = Array.isArray(r.selected_beliefs)
    ? r.selected_beliefs
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];
  if (selected.length > 0) {
    return {
      belief_about_self: selected[0],
      ...(selected[1] ? { belief_about_others: selected[1] } : {}),
      ...(selected[2] ? { belief_about_world: selected[2] } : {}),
    };
  }

  const ba = r.belief_analysis;
  const out: {
    belief_about_self?: string;
    belief_about_others?: string;
    belief_about_world?: string;
  } = {};
  if (typeof ba?.belief_about_self === "string")
    out.belief_about_self = ba.belief_about_self.trim();
  if (typeof ba?.belief_about_others === "string")
    out.belief_about_others = ba.belief_about_others.trim();
  if (typeof ba?.belief_about_world === "string")
    out.belief_about_world = ba.belief_about_world.trim();

  // belief_analysis가 비어 있고 legacy synthesis.belief_line만 있는 경우
  // → self 축에라도 채워서 단일 신념 흐름이 작동하도록.
  if (
    !out.belief_about_self &&
    !out.belief_about_others &&
    !out.belief_about_world
  ) {
    const fallback = r.synthesis?.belief_line;
    if (typeof fallback === "string" && fallback.trim()) {
      out.belief_about_self = fallback.trim();
    } else {
      return null;
    }
  }

  return out;
}

/**
 * Step 4 완료 화면에서 사용자가 *고른* 자동사고가 있으면, Step 6 대안 자동사고 실습의
 * 원본(automatic_thought)을 그 선택값으로 덮어쓴다. (없으면 mechanism 그대로)
 */
function withSelectedThought<T extends { automatic_thought: string }>(
  snapshot: T,
  excavation: unknown
): T {
  if (!excavation || typeof excavation !== "object") return snapshot;
  const sel = (excavation as { selected_thoughts?: unknown }).selected_thoughts;
  const first = Array.isArray(sel)
    ? sel.find((x): x is string => typeof x === "string" && x.trim().length > 0)
    : undefined;
  return first ? { ...snapshot, automatic_thought: first.trim() } : snapshot;
}

function extractMechanismSnapshot(mechanism: unknown): {
  situation: string;
  automatic_thought: string;
  emotion: string;
  behavior: string;
  /** Step 8 보호 루프 다이어그램용 — 감정 단어 배열만 따로 */
  emotion_words: string[];
  /** Step 8 보호 루프 다이어그램용 — 신체감각/세부 감정 묘사 */
  body_text: string;
  /** Step 8 보호 루프 다이어그램용 — 최악 시나리오 (두려움 본문에 활용) */
  worst_case: string;
} {
  const empty = {
    situation: "",
    automatic_thought: "",
    emotion: "",
    behavior: "",
    emotion_words: [] as string[],
    body_text: "",
    worst_case: "",
  };
  if (!mechanism || typeof mechanism !== "object") return empty;
  const m = mechanism as {
    recent_situation?: unknown;
    automatic_thought?: unknown;
    worst_case_result?: unknown;
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
    emotion_words: emotions,
    body_text: body,
    worst_case:
      typeof m.worst_case_result === "string" ? m.worst_case_result.trim() : "",
  };
}

/**
 * 대화형 흐름에서는 mechanism_analysis가 비어 Step 6/8의 상황·감정 칸이 비어 보인다.
 * 그런데 사용자가 Step 3을 끝낼 때 만든 parts_discovery.dialogue_recap에는 이미
 * 깨끗한 상황(part_profile.trigger_situation)·감정(surface_card.emotions)이 들어 있다.
 * 추가 LLM 호출 없이 그 값으로 빈 필드만 보강한다(이미 한 답변을 그대로 반영).
 */
function enrichMechanismFromRecap(
  snapshot: ReturnType<typeof extractMechanismSnapshot>,
  partsDiscovery: unknown
): ReturnType<typeof extractMechanismSnapshot> {
  const recap = readDialogueRecap(partsDiscovery);
  if (!recap) return snapshot;
  const pp = recap.part_profile;
  const surface = recap.surface_card;

  const recapEmotions = Array.isArray(surface?.emotions)
    ? surface.emotions
        .map((e) => (typeof e?.label === "string" ? e.label.trim() : ""))
        .filter((s) => s.length > 0)
    : [];
  const recapBody = surface?.body_signal
    ? [surface.body_signal.headline, surface.body_signal.description]
        .filter((s) => typeof s === "string" && s.trim().length > 0)
        .join(" — ")
    : "";
  const pick = (cur: string, ...fallbacks: Array<string | undefined>): string =>
    cur.trim().length > 0
      ? cur
      : fallbacks.find((f) => typeof f === "string" && f.trim().length > 0)?.trim() ?? "";

  const emotionWords =
    snapshot.emotion_words.length > 0 ? snapshot.emotion_words : recapEmotions;
  const bodyText = pick(snapshot.body_text, recapBody);
  const emotionParts: string[] = [];
  if (emotionWords.length > 0) emotionParts.push(emotionWords.join(", "));
  if (bodyText) emotionParts.push(bodyText);

  return {
    ...snapshot,
    situation: pick(snapshot.situation, pp?.trigger_situation),
    automatic_thought: pick(
      snapshot.automatic_thought,
      pp?.automatic_thought,
      surface?.thought
    ),
    emotion:
      snapshot.emotion.trim().length > 0
        ? snapshot.emotion
        : emotionParts.join(" · "),
    emotion_words: emotionWords,
    body_text: bodyText,
  };
}
