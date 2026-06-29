import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildConcernText } from "@/lib/self-workshop/survey";

/**
 * POST /api/counseling/survey
 *
 * 상담 결제(confirmed) 건의 구매자가 사전 설문을 제출한다.
 * 상담은 비로그인 결제가 가능하므로 회원(user_id)이 아니라 결제 주문번호(order_id)로
 * 묶는다. order_id 가 counseling_purchases 에 confirmed 로 존재할 때만 접수한다.
 * 응답은 service role(admin) 클라이언트로 counseling_survey_responses 에 upsert 한다
 * (주문당 1건 — 재제출 시 갱신).
 *
 * Body: { orderId, name, phone, age?, job?, concernIds: string[], concernEtc?, goal }
 * Resp: { ok: true } | { error }
 */

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const orderId = str(b.orderId);
  if (!orderId) {
    return NextResponse.json(
      { error: "결제 정보를 확인할 수 없어요." },
      { status: 400 }
    );
  }

  // 1) 결제(confirmed) 확인 — 실제 결제된 상담 건만 설문 접수. admin 으로 조회
  //    (비로그인 결제 건도 있으므로 RLS 우회가 필요).
  const admin = createAdminClient();
  const { data: purchase } = await admin
    .from("counseling_purchases")
    .select("order_id, counseling_type, status")
    .eq("order_id", orderId)
    .eq("status", "confirmed")
    .maybeSingle();
  if (!purchase) {
    return NextResponse.json(
      { error: "상담 결제 내역을 찾을 수 없어요." },
      { status: 403 }
    );
  }

  // 2) 입력 검증.
  const name = str(b.name);
  const phone = str(b.phone);
  const age = str(b.age);
  const job = str(b.job);
  const concernIds = strArr(b.concernIds);
  const concernEtc = str(b.concernEtc);
  const goal = str(b.goal);

  // 고민 라벨 확정: 선택한 키워드 + 기타 주관식을 한 줄로 합친다.
  const concern = buildConcernText(concernIds, concernEtc);

  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  if (!phone) {
    return NextResponse.json({ error: "연락처를 입력해주세요." }, { status: 400 });
  }
  if (!concern) {
    return NextResponse.json(
      { error: "고민을 하나 이상 선택해주세요." },
      { status: 400 }
    );
  }
  if (!goal) {
    return NextResponse.json(
      { error: "상담으로 해결받고 싶은 부분을 입력해주세요." },
      { status: 400 }
    );
  }

  // 3) 로그인 사용자면 user_id 도 함께 남긴다(비로그인은 NULL).
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // 비로그인/세션 없음 — user_id NULL 로 진행.
  }

  // 4) 저장(upsert) — admin 클라이언트로 RLS 우회.
  const { error } = await admin.from("counseling_survey_responses").upsert(
    {
      order_id: orderId,
      counseling_type: purchase.counseling_type ?? null,
      user_id: userId,
      name,
      phone,
      age: age || null,
      job: job || null,
      concern,
      goal,
      status: "submitted",
    },
    { onConflict: "order_id" }
  );

  if (error) {
    console.error("[counseling/survey] upsert 실패:", error);
    return NextResponse.json(
      { error: "제출에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
