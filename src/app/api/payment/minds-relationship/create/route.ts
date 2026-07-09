import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  MINDS_RELATIONSHIP_PRICE,
  MINDS_RELATIONSHIP_ORDER_PREFIX,
  INNER_CHILD_ORDER_PREFIX,
  INNER_CHILD_PRICE,
} from "@/lib/minds/relationship-constants";

/**
 * POST /api/payment/minds-relationship/create  (로그인 선택)
 *
 * 무료 테스트를 거친 leadId 로, 유료 리포트(minds·inner-child 모두 ₩19,900)의
 * 결제 레코드(pending)를 만들고 NicePay 에 넘길 order_id 를 반환한다.
 *
 * 로그인은 강제하지 않는다(마찰 최소화 — 익명으로 무료 테스트를 한 사용자가 바로 결제):
 *   · 비로그인이면 user_id=NULL 로 익명 결제. 리포트는 링크(+알림톡)로 조회한다.
 *   · 로그인 상태면 리드/결제를 계정에 묶는다(다른 계정 소유 리드면 거부 — 탈취 방지).
 *   · 익명 결제 건은 나중에 로그인 시 /api/minds/lead/claim 이 계정으로 흡수한다.
 *
 * minds_leads(RLS admin-only)에는 admin 클라이언트로 접근한다. 금액은 서버 상수로
 * 고정해 위변조를 막는다(클라이언트가 보낸 금액은 신뢰하지 않음).
 *
 * Body: { leadId: string, phone?: string, product?: "relationship" | "inner_child" }
 * Resp:
 *   { success: true, order_id, amount, purchase_id }   — pending 생성됨, 결제창 진행
 *   { already_purchased: true, purchase_id }            — 이미 결제 완료된 리드(리포트로)
 *   { error }                                            — 실패
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, RATE_LIMITS.general);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const leadId = typeof body?.leadId === "string" ? body.leadId.trim() : "";
    // 결제완료 알림톡 수신번호(선택). 없으면 나중에 profiles.phone 으로 대체한다.
    const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
    // 상품 구분 — 기본은 다섯 배역("relationship"). /inner-child 퍼널만 "inner_child" 를 보낸다.
    // 이 값에 따라 orderId prefix(MR-/IC-)만 갈라지고, 나머지 흐름은 완전히 동일하다.
    const product =
      body?.product === "inner_child" ? "inner_child" : "relationship";
    if (!leadId) {
      return NextResponse.json(
        { error: "leadId가 필요합니다." },
        { status: 400 }
      );
    }

    // 로그인은 선택 — 있으면 신원을 서버 세션에서 확정해 계정에 연결하고, 없으면
    // 비로그인(익명) 결제로 진행한다. 익명 결제는 리포트를 링크(+알림톡)로 조회한다.
    // (마찰 최소화: 무료 테스트를 익명으로 한 사용자가 로그인 없이 바로 결제 가능.)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

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

    // 소유권 — 로그인 상태일 때만 검사/바인딩한다(비로그인이면 익명 결제라 skip).
    // 리드가 다른 계정 소유면 거부(탈취 방지), 비어 있으면 이 계정에 바인딩(claim).
    if (user) {
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
    }

    // 결제 모달에서 받은 연락처를 리드에도 남긴다 — 나중에 어드민이 연락처로 리포트를
    // 찾을 수 있게(비로그인/익명 리드를 분별할 유일한 단서). 결제 레코드에도 함께 저장된다.
    if (phone) {
      await admin.from("minds_leads").update({ phone }).eq("id", leadId);
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
    // orderId prefix 로 결제 유형을 영속화한다(return 라우트가 prefix 로 분기).
    const orderPrefix =
      product === "inner_child"
        ? INNER_CHILD_ORDER_PREFIX
        : MINDS_RELATIONSHIP_ORDER_PREFIX;
    // 금액은 상품별 상수로 고정한다(현재 minds·inner-child 모두 ₩19,900). 서버 상수로
    // 고정해 위변조를 막고, return 검증도 같은 상품 기준으로 재확인한다.
    const amount =
      product === "inner_child" ? INNER_CHILD_PRICE : MINDS_RELATIONSHIP_PRICE;
    const orderId = `${orderPrefix}${Date.now()}-${nanoid(8)}`;
    const { data: purchase, error: purchaseError } = await admin
      .from("minds_relationship_purchases")
      .insert({
        lead_id: leadId,
        user_id: user?.id ?? null,
        amount,
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
      // 훅이 리다이렉트 베이스를 재확인할 수 있게 상품 구분을 에코한다(선택).
      product,
    });
  } catch (err) {
    console.error("[minds-relationship/create] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
