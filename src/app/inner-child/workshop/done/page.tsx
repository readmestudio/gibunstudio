/**
 * /inner-child/workshop/done — "내면 아이 찾기 워크샵" 결제 완료 페이지.
 *
 * NicePay return 라우트(IW-)가 승인·intake 토큰 발급 후 `?p={purchaseId}` 로 리다이렉트한다.
 * 로그인 필수 상품이라 구매 소유자(user_id)만 볼 수 있다 — 진단 링크(/intake/{token})가
 * 노출되는 페이지이므로 URL 만 알면 열리면 안 된다(알림톡으로도 같은 링크가 발송됨).
 *
 * confirmed 가 아니면(승인 처리 지연·비정상 접근) "결제 확인 중" 안내만 보여준다.
 * 시각 폴리시는 추후 디자인 문서와 함께 — 지금은 모노톤 규칙만 지킨 최소 화면.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { WORKSHOP_PRICE } from "@/lib/minds/relationship-constants";
import { WorkshopPurchasePixel } from "./WorkshopPurchasePixel";

export const metadata: Metadata = {
  title: "결제 완료 · 내면 아이 찾기 워크샵",
  robots: { index: false, follow: false },
};

export default async function WorkshopDonePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  if (!p) {
    redirect("/inner-child/workshop");
  }

  // 결제 레코드 조회 — 테이블이 RLS admin-only 라 admin 클라이언트로 읽는다.
  let purchase: {
    user_id: string;
    name: string | null;
    status: string;
    intake_token: string | null;
  } | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("workshop_intake_purchases")
      .select("user_id, name, status, intake_token")
      .eq("id", p)
      .maybeSingle();
    purchase = data ?? null;
  } catch {
    // 조회 실패 — 아래 "결제 확인 중" 안내로 폴백.
  }

  // 소유권 — 로그인 필수 상품이라 구매자 본인만 볼 수 있다(진단 링크 보호).
  if (purchase) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== purchase.user_id) {
      redirect(`/login?next=/inner-child/workshop/done?p=${p}`);
    }
  }

  // 미확정(레코드 없음·pending 등) — 승인 콜백 지연일 수 있어 최소 안내만 띄운다.
  if (!purchase || purchase.status !== "confirmed" || !purchase.intake_token) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-xl font-bold text-[var(--foreground)]">
          결제 확인 중이에요
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/70">
          결제 승인 처리에 잠시 시간이 걸릴 수 있어요.
          <br />
          잠시 후 새로고침해 주세요. 문제가 계속되면 카카오톡 채널로 문의해 주세요.
        </p>
        <Link
          href="/inner-child/workshop"
          className="mt-8 border-2 border-[var(--foreground)] px-6 py-3 text-sm font-bold text-[var(--foreground)]"
        >
          워크샵 안내로 돌아가기
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {/* 유료광고 Purchase 전환 신호 — eventId(결제 id)로 중복 발화 dedup. */}
      <WorkshopPurchasePixel amount={WORKSHOP_PRICE} eventId={p} />

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        결제가 완료됐어요
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/70">
        {purchase.name ? `${purchase.name}님, ` : ""}워크샵 상담을 위한
        <br />
        사전 진단이 준비됐어요. 상담 전에 완료해 주세요.
      </p>

      <Link
        href={`/intake/${purchase.intake_token}`}
        className="mt-8 w-full border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-4 text-base font-bold text-[var(--background)]"
      >
        사전 진단 시작하기
      </Link>

      <p className="mt-4 text-xs text-[var(--foreground)]/50">
        같은 진단 링크를 카카오 알림톡으로도 보내드렸어요.
        <br />
        나중에 알림톡 링크로 이어서 진행할 수 있어요.
      </p>
    </main>
  );
}
