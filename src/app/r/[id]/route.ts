/**
 * /r/[id] — 알림톡·공유용 짧은 리포트 링크.
 *
 * [id] 는 minds_relationship_purchases 의 결제 UUID. order_id prefix 로 퍼널을 갈라
 * 실제 리포트 페이지로 리다이렉트한다(IC-→내면 아이, 그 외→다섯 배역). 로그인 불필요 —
 * 비로그인 구매자도 이 링크로 자신의 유료 리포트를 되찾을 수 있게 하는 진입점이다.
 * (신규 알림톡 템플릿 버튼이 `https://gibunstudio.com/r/#{리포트코드}` 로 이 경로를 가리킨다.)
 */

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const home = new URL("/", req.url);

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("minds_relationship_purchases")
      .select("id, order_id")
      .eq("id", id)
      .maybeSingle();

    if (!data) return NextResponse.redirect(home);

    const orderId = (data.order_id as string | null) ?? "";
    const path = orderId.startsWith("IC-")
      ? `/inner-child/full/${data.id}`
      : `/minds/relationship/${data.id}`;
    return NextResponse.redirect(new URL(path, req.url));
  } catch {
    // 조회 실패 시엔 홈으로 — 죽은 링크로 에러 화면을 띄우지 않는다.
    return NextResponse.redirect(home);
  }
}
