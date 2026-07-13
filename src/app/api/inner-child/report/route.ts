import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { readFreeReportBlob } from "@/lib/minds/inner-child/free-report-store";
import { generateInnerChildPaidReport, readPaidReport } from "@/lib/minds/inner-child/paid-report";

/**
 * POST /api/inner-child/report  (결제 게이트 — confirmed IC- 구매만)
 *
 * "내면 아이 심층 리포트" 유료 산출물(9생성필드)을 만들거나 캐시를 돌려준다. 결제 직후
 * 리포트 페이지(/inner-child/full/[id])가 호출한다. /api/minds/relationship 과 동형 골격이되,
 * 데이터 소스가 다르다 — 원응답 재분석이 아니라 무료에서 이미 만든 권위 채점본(score_result)을
 * 재사용해 gemini-2.5-pro 로 9필드(개인화 reparenting 포함)만 생성한다.
 *
 * 흐름:
 *   1) purchaseId 로 결제 레코드 조회 → 없으면 404.
 *   2) IC- 가드: order_id 가 IC- 로 시작하지 않으면 400(MR- 교차사용 차단).
 *   3) status=confirmed 게이트 + user_id 소유권 게이트.
 *   4) report_json 있으면 캐시 반환.
 *   5) 리드의 parts_map(FreeReportBlob)에서 score_result 로드(없거나 v2.0 아니면 500).
 *   6) generateInnerChildPaidReport 최대 2회 재시도 → report_json 저장 → 반환. 폴백 없음.
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

    // [1] 결제 레코드 조회.
    const { data: purchase, error: purchaseError } = await admin
      .from("minds_relationship_purchases")
      .select("id, lead_id, status, report_json, user_id, order_id")
      .eq("id", purchaseId)
      .maybeSingle();

    if (purchaseError) {
      console.error("[inner-child/report] 결제 조회 실패:", purchaseError);
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

    // [2] IC- 가드 — 다섯 배역(MR-) 구매가 이 라우트로 잘못 들어와 내면 아이 리포트가
    // 캐시되는 사고를 차단한다(MR- 는 /api/minds/relationship 에서 처리).
    if (
      typeof purchase.order_id !== "string" ||
      !purchase.order_id.startsWith("IC-")
    ) {
      return NextResponse.json(
        { error: "이 결제는 내면 아이 리포트 대상이 아니에요." },
        { status: 400 }
      );
    }

    // [3] 결제 게이트 — confirmed 구매만 리포트를 받을 수 있다.
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

    // [4] 이미 생성된 리포트가 있고 '현재 스키마'를 만족하면 그대로 반환(캐시).
    // 구버전 캐시(예: reparenting 개인화 필드 이전)는 readPaidReport 가 throw → 캐시미스로
    // 흘려보내 아래에서 새 프롬프트로 재생성·덮어쓴다(스키마 자동 업그레이드).
    if (purchase.report_json) {
      try {
        readPaidReport(purchase.report_json);
        return NextResponse.json({ report: purchase.report_json, cached: true });
      } catch {
        // 스키마 미달 — 재생성 경로로.
      }
    }

    // [5] 리드의 채점본 로드 — 원응답 재분석이 아니라 무료에서 만든 권위 채점본 재사용.
    const { data: lead, error: leadError } = await admin
      .from("minds_leads")
      .select("parts_map")
      .eq("id", purchase.lead_id)
      .maybeSingle();

    if (leadError || !lead) {
      console.error("[inner-child/report] 리드 조회 실패:", {
        leadId: purchase.lead_id,
        leadError,
      });
      return NextResponse.json(
        { error: "테스트 기록을 불러오지 못했어요." },
        { status: 500 }
      );
    }

    const blob = readFreeReportBlob(lead.parts_map);
    if (!blob) {
      // 무료 리포트 블롭이 없거나 v2.0 이 아님 — 데이터 정합 오류(운영 알림 대상).
      console.error(
        "[inner-child/report] 유효한 무료 리포트 블롭 없음(운영 확인 필요):",
        { leadId: purchase.lead_id, purchaseId: purchase.id }
      );
      return NextResponse.json(
        { error: "테스트 기록을 불러오지 못했어요. 문제가 계속되면 문의해주세요." },
        { status: 500 }
      );
    }

    // [6] 생성 — 유료 산출물이라 폴백 없음. 일시적 실패 대비 최대 2회 재시도.
    let report = null;
    for (let attempt = 0; attempt < 2 && !report; attempt++) {
      try {
        report = await generateInnerChildPaidReport(blob.score_result);
      } catch (err) {
        console.error(
          `[inner-child/report] 생성 시도 ${attempt + 1} 실패:`,
          err
        );
      }
    }

    if (!report) {
      // 돈은 받았는데 생성 실패 — 페이지에서 재시도 안내. (환불은 cancel 라우트로 별도)
      return NextResponse.json(
        { error: "리포트 생성에 실패했어요. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 캐시 저장.
    const { error: saveError } = await admin
      .from("minds_relationship_purchases")
      .update({ report_json: report })
      .eq("id", purchase.id);

    if (saveError) {
      // 저장 실패해도 생성된 리포트는 돌려준다(다음 호출에서 재생성될 뿐).
      console.error("[inner-child/report] report_json 저장 실패:", saveError);
    }

    return NextResponse.json({ report });
  } catch (err) {
    console.error("[inner-child/report] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
