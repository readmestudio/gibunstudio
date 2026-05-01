import { createAdminClient } from "@/lib/supabase/admin";
import type { DiagnosisScores } from "./diagnosis";

/**
 * 랜딩 페이지 미리보기용 데모 워크북 결과 fetch.
 *
 * 매 페이지 요청마다 admin client로 DB를 직접 조회한다(소량 호출이라 캐시 없이도 OK).
 * 결과가 없거나 fetch 실패 시 null 을 반환 → 호출처는 placeholder fallback.
 */

const DEMO_EMAIL = "mingle22@hanmail.net";

export interface DemoWorkshopResult {
  userId: string;
  userName: string | null;
  currentStep: number;
  diagnosisScores: DiagnosisScores | null;
  diagnosisProfile: unknown | null;
  mechanismAnalysis: unknown | null;
  mechanismInsights: unknown | null;
  coreBeliefExcavation: unknown | null;
  alternativeThoughtSimulation: unknown | null;
  newBelief: unknown | null;
  copingPlan: unknown | null;
  summaryCards: unknown | null;
  reflection: unknown | null;
}

export async function getDemoWorkshopResult(): Promise<DemoWorkshopResult | null> {
  try {
    const admin = createAdminClient();

    // 1) 데모 유저 찾기 — auth.admin.listUsers 는 페이지네이션 (perPage=1000 충분)
    const { data: usersResp, error: userErr } =
      await admin.auth.admin.listUsers({ perPage: 1000 });
    if (userErr || !usersResp) {
      console.warn("[getDemoWorkshopResult] listUsers failed", userErr);
      return null;
    }

    const demoUser = usersResp.users.find((u) => u.email === DEMO_EMAIL);
    if (!demoUser) {
      console.warn(`[getDemoWorkshopResult] demo user not found: ${DEMO_EMAIL}`);
      return null;
    }

    // 2) 가장 진행이 많이 된 progress 한 건만
    const { data: progress, error: progErr } = await admin
      .from("workshop_progress")
      .select("*")
      .eq("user_id", demoUser.id)
      .eq("workshop_type", "achievement-addiction")
      .order("current_step", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (progErr) {
      console.warn("[getDemoWorkshopResult] workshop_progress fetch error", progErr);
      return null;
    }
    if (!progress) {
      console.warn("[getDemoWorkshopResult] no workshop_progress row for demo user");
      return null;
    }

    return {
      userId: demoUser.id,
      userName:
        (demoUser.user_metadata?.name as string | undefined) ??
        (demoUser.user_metadata?.full_name as string | undefined) ??
        null,
      currentStep: progress.current_step ?? 1,
      diagnosisScores: progress.diagnosis_scores ?? null,
      diagnosisProfile: progress.diagnosis_profile ?? null,
      mechanismAnalysis: progress.mechanism_analysis ?? null,
      mechanismInsights: progress.mechanism_insights ?? null,
      coreBeliefExcavation: progress.core_belief_excavation ?? null,
      alternativeThoughtSimulation: progress.alternative_thought_simulation ?? null,
      newBelief: progress.new_belief ?? null,
      copingPlan: progress.coping_plan ?? null,
      summaryCards: progress.summary_cards ?? null,
      reflection: progress.reflection ?? null,
    };
  } catch (e) {
    console.error("[getDemoWorkshopResult] fatal", e);
    return null;
  }
}
