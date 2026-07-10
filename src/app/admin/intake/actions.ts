"use server";

/**
 * 내면 아이 상담 진단(intake) — 관리자 서버 액션.
 *
 * 세션 생성·토큰 재발급을 store 에 위임한다.
 * 각 액션 시작 시 관리자 이메일을 재검증한다 (server action 은 외부에서 직접 호출될 수 있으므로).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
import { createSession, reissueToken } from "@/lib/intake/store";

/** 액션 공통 — 로그인 + 관리자 이메일 재검증. 아니면 throw. */
async function assertAdmin(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    throw new Error("관리자 권한이 필요합니다.");
  }
}

/** 세션 생성 — 표시명(필수), 메모/세션예정일(선택). 생성 후 목록 갱신. */
export async function createSessionAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const displayName = String(formData.get("display_name") ?? "").trim();
  const memo = String(formData.get("memo") ?? "").trim();
  const sessionDate = String(formData.get("session_date") ?? "").trim();

  if (!displayName) {
    throw new Error("표시명을 입력해 주세요.");
  }

  await createSession({
    display_name: displayName,
    memo: memo || undefined,
    session_date: sessionDate || undefined, // YYYY-MM-DD
  });

  revalidatePath("/admin/intake");
}

/** 토큰 재발급 — 새 토큰 세팅 + status→issued. 목록에서 새 링크 확인. */
export async function reissueTokenAction(formData: FormData): Promise<void> {
  await assertAdmin();

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("세션 id 가 없습니다.");
  }

  await reissueToken(id);
  revalidatePath("/admin/intake");
}
