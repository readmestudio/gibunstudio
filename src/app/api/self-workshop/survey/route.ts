import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildConcernText } from "@/lib/self-workshop/survey";

/**
 * POST /api/self-workshop/survey
 *
 * 워크북 결제(confirmed) 회원이 맞춤 제작 설문을 제출한다.
 * 응답은 service role(admin) 클라이언트로 workshop_survey_responses 에 upsert 한다
 * (회원·워크북당 1건 — 재제출 시 갱신).
 *
 * Body: { name, phone, age, job, concernIds: string[], concernEtc?, goal }
 * Resp: { ok: true } | { error }
 */

const WORKSHOP_TYPE = "achievement-addiction";

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

  // 1) 로그인 확인 — 신원은 클라이언트 값이 아니라 서버 세션에서 확정.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요해요." },
      { status: 401 }
    );
  }

  // 2) 결제(confirmed) 확인 — 구매자만 제출 가능.
  const { data: purchase } = await supabase
    .from("workshop_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("workshop_type", WORKSHOP_TYPE)
    .eq("status", "confirmed")
    .maybeSingle();
  if (!purchase) {
    return NextResponse.json(
      { error: "워크북 결제 내역을 찾을 수 없어요." },
      { status: 403 }
    );
  }

  // 3) 입력 검증.
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
      { error: "워크북으로 해결받고 싶은 부분을 입력해주세요." },
      { status: 400 }
    );
  }

  // 4) 저장(upsert) — admin 클라이언트로 RLS 우회.
  const admin = createAdminClient();
  const { error } = await admin.from("workshop_survey_responses").upsert(
    {
      user_id: user.id,
      purchase_id: purchase.id,
      workshop_type: WORKSHOP_TYPE,
      name,
      phone,
      age: age || null,
      job: job || null,
      concern,
      goal,
      status: "submitted",
    },
    { onConflict: "user_id,workshop_type" }
  );

  if (error) {
    console.error("[self-workshop/survey] upsert 실패:", error);
    return NextResponse.json(
      { error: "제출에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
