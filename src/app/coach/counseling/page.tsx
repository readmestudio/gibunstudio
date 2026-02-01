import { createClient } from "@/lib/supabase/server";
import { isCoachEmail } from "@/lib/auth/coach";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CoachCounselingContent } from "./CoachCounselingContent";

export default async function CoachCounselingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login/coach");
  if (!isCoachEmail(user.email)) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/coach" className="text-sm text-[var(--foreground)]/60 hover:underline">
            ← 코치 모드
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
            1:1 상담
          </h1>
        </div>
      </div>

      <CoachCounselingContent />
    </div>
  );
}
