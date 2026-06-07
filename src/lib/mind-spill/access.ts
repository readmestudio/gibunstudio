/**
 * Mind Spill 접근 권한 헬퍼.
 * 활성 사용권 확인 + 테스트 유저 우회 + quota 차감/잔여 계산.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { WORKSHOP_TEST_EMAILS } from "@/lib/self-workshop/test-users";
import {
  MIND_SPILL_QUOTA,
  MIND_SPILL_VALID_DAYS,
  type MindSpillSubscription,
} from "./types";

/** 운영자/테스트 유저는 결제 없이 접근 가능. self-workshop 화이트리스트 재사용. */
export function isMindSpillTestUser(email: string | null | undefined): boolean {
  if (!email) return false;
  return WORKSHOP_TEST_EMAILS.includes(email);
}

/** 활성(미만료) 사용권 1건 조회. 없으면 null. */
export async function getActiveSubscription(
  supabase: SupabaseClient,
  userId: string
): Promise<MindSpillSubscription | null> {
  const { data } = await supabase
    .from("mind_spill_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }
  return data as MindSpillSubscription;
}

/**
 * 테스트 유저용: 활성 사용권이 없으면 6개월 / 10회 짜리 무료 사용권을 생성.
 */
export async function ensureTestSubscription(
  adminClient: SupabaseClient,
  userId: string
): Promise<MindSpillSubscription> {
  const { data: existing } = await adminClient
    .from("mind_spill_subscriptions")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing && new Date(existing.expires_at).getTime() > Date.now()) {
    return existing as MindSpillSubscription;
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + MIND_SPILL_VALID_DAYS);

  const { data, error } = await adminClient
    .from("mind_spill_subscriptions")
    .insert({
      user_id: userId,
      purchase_id: null,
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      quota_total: MIND_SPILL_QUOTA,
      quota_used: 0,
      status: "active",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("테스트 사용권 생성에 실패했습니다");
  }
  return data as MindSpillSubscription;
}

/** 사용권 잔여 계산. 옛 row(컬럼 누락)에도 안전한 fallback. */
export function remainingOf(sub: MindSpillSubscription): number {
  const total = Number.isFinite(sub.quota_total)
    ? sub.quota_total
    : MIND_SPILL_QUOTA;
  const used = Number.isFinite(sub.quota_used) ? sub.quota_used : 0;
  return Math.max(0, total - used);
}

/** 만료까지 남은 일수. */
export function daysLeftFor(sub: MindSpillSubscription): number {
  if (!sub.expires_at) return 0;
  const ms = new Date(sub.expires_at).getTime() - Date.now();
  if (!Number.isFinite(ms)) return 0;
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

/**
 * 워크북 생성 시 사용권 1회 차감 + 다음 volume_no 반환.
 * 차감 실패 또는 quota 소진이면 null 반환.
 *
 * 옛 스키마(`weekly_quota_*`)와 새 스키마(`quota_*`) 양쪽을 모두 지원한다 —
 * 마이그레이션이 부분적으로만 적용된 환경에서도 동작하도록.
 */
export async function consumeQuotaAndPickVolume(
  adminClient: SupabaseClient,
  userId: string,
  subscriptionId: string
): Promise<number | null> {
  // select("*") — 어떤 컬럼이 살아있는지 모르므로 일단 다 가져온다.
  const { data: sub, error: selectError } = await adminClient
    .from("mind_spill_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (selectError) {
    console.error("[mind-spill] sub select failed:", selectError);
    return null;
  }
  if (!sub) {
    console.warn("[mind-spill] subscription not found:", subscriptionId);
    return null;
  }

  // 어느 컬럼이 살아있나? (true = 새 스키마, false = 옛 스키마)
  const isNewSchema = "quota_total" in sub && sub.quota_total != null;
  const total: number = isNewSchema
    ? sub.quota_total
    : (sub.weekly_quota_total ?? MIND_SPILL_QUOTA);
  const used: number = isNewSchema
    ? sub.quota_used
    : (sub.weekly_quota_used ?? 0);

  if (used >= total) {
    console.warn("[mind-spill] quota exhausted:", { used, total });
    return null;
  }

  const usedCol = isNewSchema ? "quota_used" : "weekly_quota_used";
  const { error: updateError } = await adminClient
    .from("mind_spill_subscriptions")
    .update({ [usedCol]: used + 1 })
    .eq("id", subscriptionId)
    .eq(usedCol, used); // optimistic concurrency
  if (updateError) {
    console.error("[mind-spill] quota update failed:", updateError);
    return null;
  }

  // 다음 volume_no — 사용자가 가진 최대값 + 1.
  const { data: max, error: maxError } = await adminClient
    .from("mind_spill_workbooks")
    .select("volume_no")
    .eq("user_id", userId)
    .order("volume_no", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxError) {
    console.error("[mind-spill] volume_no lookup failed:", maxError);
    // 차감 롤백.
    await adminClient
      .from("mind_spill_subscriptions")
      .update({ [usedCol]: used })
      .eq("id", subscriptionId);
    return null;
  }

  return (max?.volume_no ?? 0) + 1;
}

/**
 * @deprecated Workbook 모델은 Daily Entry로 대체됨. Phase 2에서 제거 예정.
 * 새 코드는 canViewEntryReport 사용.
 */
export async function canViewReport(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  workbookId: string
): Promise<boolean> {
  if (isMindSpillTestUser(userEmail)) return true;

  const subscription = await getActiveSubscription(supabase, userId);
  if (subscription) return true;

  const { data: purchase } = await supabase
    .from("mind_spill_report_purchases")
    .select("id")
    .eq("workbook_id", workbookId)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .maybeSingle();

  return !!purchase;
}

/**
 * @deprecated Freemium 전환으로 entry 단위 결제는 없어짐. Phase 3에서 제거 예정.
 */
export async function canViewEntryReport(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  entryId: string
): Promise<boolean> {
  if (isMindSpillTestUser(userEmail)) return true;

  const { data: purchase } = await supabase
    .from("mind_spill_entry_purchases")
    .select("id")
    .eq("entry_id", entryId)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .maybeSingle();

  return !!purchase;
}

/**
 * Period Report (3일치 누적 종합) 열람 권한 체크.
 *   true: 테스트 유저 / 해당 period에 confirmed 결제.
 *   false: 결제 게이트 표시.
 *
 * Period 리포트 페이지 가드 + LLM 트리거 API(비용 방어) 양쪽에서 사용.
 */
export async function canViewPeriodReport(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string | null | undefined,
  periodReportId: string
): Promise<boolean> {
  if (isMindSpillTestUser(userEmail)) return true;

  const { data: purchase } = await supabase
    .from("mind_spill_period_purchases")
    .select("id")
    .eq("period_report_id", periodReportId)
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .maybeSingle();

  return !!purchase;
}

/** 차감 롤백 (insert 실패 시). 옛/새 스키마 양쪽 지원. */
export async function refundQuota(
  adminClient: SupabaseClient,
  subscriptionId: string
): Promise<void> {
  const { data: sub } = await adminClient
    .from("mind_spill_subscriptions")
    .select("*")
    .eq("id", subscriptionId)
    .maybeSingle();
  if (!sub) return;
  const isNewSchema = "quota_total" in sub && sub.quota_total != null;
  const used: number = isNewSchema
    ? sub.quota_used
    : (sub.weekly_quota_used ?? 0);
  if (used <= 0) return;
  const usedCol = isNewSchema ? "quota_used" : "weekly_quota_used";
  await adminClient
    .from("mind_spill_subscriptions")
    .update({ [usedCol]: used - 1 })
    .eq("id", subscriptionId);
}
