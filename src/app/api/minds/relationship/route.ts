import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";
import {
  generateRelationshipReport,
  type RelationshipAnswer,
} from "@/lib/minds/relationship-report";

/**
 * POST /api/minds/relationship  (결제 게이트 — confirmed 구매만)
 *
 * "내 마음 속 다섯 가지 배역과 그 관계" 유료 리포트를 생성하거나, 이미 만들어 둔
 * 캐시를 돌려준다. 결제 직후 리포트 페이지(/minds/relationship/[id])가 호출한다.
 *
 * 흐름:
 *   1) purchaseId 로 결제 레코드 조회 → status=confirmed 가 아니면 거부(결제 게이트).
 *   2) report_json 이 이미 있으면 그대로 반환(1회 생성·캐시 — 재방문 재생성 0).
 *   3) 없으면 같은 리드(minds_leads)의 답변으로 generateRelationshipReport 실행
 *      (일시적 실패 대비 최대 2회 재시도). 유료 산출물이라 폴백을 만들지 않는다.
 *   4) 성공 시 report_json 에 저장하고 반환.
 *
 * Body: { purchaseId: string }
 * Resp: { report } | { error }
 */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, RATE_LIMITS.ai);
  if (limited) return limited;

  try {
    const body = await req.json().catch(() => ({}));
    const purchaseId =
      typeof body?.purchaseId === "string" ? body.purchaseId.trim() : "";
    if (!purchaseId) {
      return NextResponse.json(
        { error: "purchaseId가 필요합니다." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // [1] 결제 게이트 — confirmed 구매만 리포트를 받을 수 있다.
    const { data: purchase, error: purchaseError } = await admin
      .from("minds_relationship_purchases")
      .select("id, lead_id, status, report_json, user_id")
      .eq("id", purchaseId)
      .maybeSingle();

    if (purchaseError) {
      console.error("[minds/relationship] 결제 조회 실패:", purchaseError);
      return NextResponse.json(
        { error: "결제 정보를 조회하지 못했습니다." },
        { status: 500 }
      );
    }
    if (!purchase) {
      return NextResponse.json(
        { error: "결제 정보를 찾을 수 없어요." },
        { status: 404 }
      );
    }
    if (purchase.status !== "confirmed") {
      return NextResponse.json(
        { error: "결제가 완료되지 않았어요." },
        { status: 403 }
      );
    }

    // 소유권 — 계정에 묶인 리포트는 주인만 생성·열람 가능(URL 추측 차단).
    // 비로그인으로 결제했던 과거 건(user_id=null)은 하위호환으로 통과.
    if (purchase.user_id) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== purchase.user_id) {
        return NextResponse.json(
          { error: "이 리포트를 볼 권한이 없어요." },
          { status: 403 }
        );
      }
    }

    // [2] 이미 생성된 리포트가 있으면 그대로 반환(캐시).
    if (purchase.report_json) {
      return NextResponse.json({ report: purchase.report_json, cached: true });
    }

    // [3] 리드 답변 로드.
    const { data: lead, error: leadError } = await admin
      .from("minds_leads")
      .select("answers, parts_map")
      .eq("id", purchase.lead_id)
      .maybeSingle();

    if (leadError || !lead) {
      console.error("[minds/relationship] 리드 조회 실패:", {
        leadId: purchase.lead_id,
        leadError,
      });
      return NextResponse.json(
        { error: "테스트 기록을 불러오지 못했어요." },
        { status: 500 }
      );
    }

    const answers: RelationshipAnswer[] = (
      Array.isArray(lead.answers) ? lead.answers : []
    )
      .map((a: unknown) => {
        const o = (a ?? {}) as Record<string, unknown>;
        return {
          id: typeof o.id === "string" ? o.id : "",
          question: typeof o.question === "string" ? o.question : "",
          answer: typeof o.answer === "string" ? o.answer : "",
        };
      })
      .filter((a: RelationshipAnswer) => a.answer.trim().length > 0);

    if (answers.length === 0) {
      return NextResponse.json(
        { error: "분석할 답변이 없어요." },
        { status: 400 }
      );
    }

    // parts_map 은 무료 분석 결과(있으면 힌트로). 형태가 깨졌으면 무시.
    const partsMap =
      lead.parts_map &&
      Array.isArray((lead.parts_map as Record<string, unknown>).parts)
        ? (lead.parts_map as unknown as PartsMap)
        : null;

    // [3] 생성 — 유료 산출물이라 폴백 없음. 일시적 실패 대비 최대 2회 재시도.
    let report = null;
    for (let attempt = 0; attempt < 2 && !report; attempt++) {
      try {
        report = await generateRelationshipReport(answers, partsMap);
      } catch (err) {
        console.error(
          `[minds/relationship] 생성 시도 ${attempt + 1} 실패:`,
          err
        );
      }
    }

    if (!report) {
      // 돈은 받았는데 생성 실패 — 페이지에서 재시도 안내. (환불은 cancel 라우트로 별도)
      return NextResponse.json(
        { error: "리포트 생성에 실패했어요. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }

    // [4] 캐시 저장.
    const { error: saveError } = await admin
      .from("minds_relationship_purchases")
      .update({ report_json: report })
      .eq("id", purchase.id);

    if (saveError) {
      // 저장 실패해도 생성된 리포트는 돌려준다(다음 호출에서 재생성될 뿐).
      console.error("[minds/relationship] report_json 저장 실패:", saveError);
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[minds/relationship] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
