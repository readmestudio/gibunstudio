import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { isWorkshopTestUser } from "@/lib/self-workshop/test-users";

export const dynamic = "force-dynamic";

export default async function WorkshopGeneratingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/dashboard/self-workshop");

  const isTestUser = isWorkshopTestUser(user.email);

  // 결제 완료(confirmed) 사용자에게만 노출 — 미구매자는 워크북 안내로 돌려보냄.
  const { data: purchase } = await supabase
    .from("workshop_purchases")
    .select("id")
    .eq("user_id", user.id)
    .eq("workshop_type", "achievement-addiction")
    .eq("status", "confirmed")
    .maybeSingle();

  if (!purchase && !isTestUser) {
    redirect("/dashboard/self-workshop");
  }

  const userName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    null;
  const displayName = userName ?? "회원";

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {/* 완료 체크 아이콘 */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--foreground)]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        결제가 완료되었습니다
      </h1>

      <p className="mt-4 text-base leading-relaxed text-[var(--foreground)]/80">
        지금 <span className="font-semibold">{displayName}</span>님의 답변에 맞춰
        <br />
        워크북을 한 권 한 권 만들고 있어요.
      </p>

      <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/60">
        완성되면 바로 보내드릴게요.
        <br />
        제작에는 하루 정도 소요됩니다.
      </p>

      {/* 안내 박스 */}
      <div className="mt-8 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6 text-left">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          이렇게 진행돼요
        </p>
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--foreground)]/70">
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">1.</span>
            <span>제출하신 진단 답변을 바탕으로 워크북을 개인화해서 제작합니다.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">2.</span>
            <span>완성까지 하루 정도 걸려요. 이 페이지를 닫으셔도 괜찮습니다.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">3.</span>
            <span>완성되면 가입하신 계정으로 안내드릴게요.</span>
          </li>
        </ol>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-[var(--foreground)]/45">
        문의는 카카오톡 채널 <span className="font-medium">gibun_studio</span>로
        남겨주세요.
      </p>

      <Link
        href="/dashboard"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)] px-6 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
      >
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
