import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  MINDS_RELATIONSHIP_PRICE,
  MINDS_RELATIONSHIP_ORDER_PREFIX,
} from "@/lib/minds/relationship-constants";

/**
 * POST /api/payment/minds-relationship/create  (로그인 필요)
 *
 * 무료 /minds 테스트를 거친 leadId 로, "다섯 배역 + 관계 해설" 유료 리포트(₩9,900)의
 * 결제 레코드(pending)를 만들고 NicePay 에 넘길 order_id 를 반환한다.
 *
 * 결제는 반드시 로그인된 계정에 묶는다("무료 리포트 후 결제 직전 로그인" 정책):
 *   · 비로그인이면 401(needs_login) → 클라이언트가 로그인 관문을 띄운다.
 *   · 리드가 아직 주인이 없으면 이 계정에 바인딩하고, 다른 계정 소유면 거부(탈취 방지).
 *   · 결제 레코드(purchase)에도 user_id 를 박아 둔다 → 기기 무관 "내 유료 리포트" 조회.
 *
 * minds_leads(RLS admin-only)에는 admin 클라이언트로 접근한다. 금액은 서버 상수로
 * 고정해 위변조를 막는다(클라이언트가 보낸 금액은 신뢰하지 않음).
 *
 * Body: { leadId: string }
 * Resp:
 *   { success: true, order_id, amount, purchase_id }   — pending 생성됨, 결제창 진행
 *   { already_purchased: true, purchase_id }            — 이미 결제 완료된 리드(리포트로)
 *   { error, needs_login? }                             — 실패(로그인 필요 시 needs_login)
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, RATE_LIMITS.general);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === "string" ? body.leadId.trim() : "";
    // 결제완료 알림톡 수신번호(선택). 없으면 나중에 profiles.phone 으로 대체한다.
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!leadId) {
      return NextResponse.json(
        { error: "leadId가 필요합니다." },
        { status: 400 }
      );
    }

    // 로그인 필수 — 신원은 서버 세션에서 확정(클라이언트 값 불신).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요해요.", needs_login: true },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // 리드 확인 — 실제로 무료 테스트를 완료(answers 보유)한 리드만 결제 가능.
    const { data: lead, error: leadError } = await admin
      .from("minds_leads")
      .select("id, answers, user_id")
      .eq("id", leadId)
      .maybeSingle();

    if (leadError) {
      console.error("[minds-relationship/create] 리드 조회 실패:", leadError);
      return NextResponse.json(
        { error: "리드를 조회하지 못했습니다." },
        { status: 500 }
      );
    }
    if (!lead) {
      return NextResponse.json(
        { error: "테스트 기록을 찾을 수 없어요." },
        { status: 404 }
      );
    }
    const answers = Array.isArray(lead.answers) ? lead.answers : [];
    if (answers.length === 0) {
      return NextResponse.json(
        { error: "무료 테스트를 먼저 완료해주세요." },
        { status: 400 }
      );
    }

    // 소유권 — 리드가 다른 계정 소유면 거부, 비어 있으면 이 계정에 바인딩(claim).
    if (lead.user_id && lead.user_id !== user.id) {
      return NextResponse.json(
        { error: "이미 다른 계정에 연결된 테스트 기록이에요." },
        { status: 403 }
      );
    }
    if (!lead.user_id) {
      await admin
        .from("minds_leads")
        .update({ user_id: user.id })
        .eq("id", leadId)
        .is("user_id", null); // 경합 방지 — 아직 비어 있을 때만.
    }

    // 멱등성 — 이미 결제 완료된 리드면 새 결제를 막고 리포트로 보낸다(1인 1회 정책).
    const { data: confirmed } = await admin
      .from("minds_relationship_purchases")
      .select("id")
      .eq("lead_id", leadId)
      .eq("status", "confirmed")
      .maybeSingle();
    if (confirmed) {
      return NextResponse.json({
        already_purchased: true,
        purchase_id: confirmed.id,
      });
    }

    // pending 결제 레코드 생성. 금액은 서버 상수로 고정(위변조 방지).
    const orderId = `${MINDS_RELATIONSHIP_ORDER_PREFIX}${Date.now()}-${nanoid(8)}`;
    const { data: purchase, error: purchaseError } = await admin
      .from("minds_relationship_purchases")
      .insert({
        lead_id: leadId,
        user_id: user.id,
        amount: MINDS_RELATIONSHIP_PRICE,
        order_id: orderId,
        status: "pending",
        phone: phone || null,
      })
      .select("id, order_id, amount")
      .single();

    if (purchaseError || !purchase) {
      console.error(
        "[minds-relationship/create] 결제 레코드 생성 실패:",
        purchaseError
      );
      return NextResponse.json(
        { error: "결제 레코드 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: purchase.order_id,
      amount: purchase.amount,
      purchase_id: purchase.id,
    });
  } catch (err) {
    console.error("[minds-relationship/create] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
