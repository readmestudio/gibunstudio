import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { EssayForm } from "../EssayForm";
import { createEssay } from "../actions";

export const metadata: Metadata = {
  title: "새 에세이 작성 | 기분 스튜디오",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function NewEssayPage() {
  await requireAdmin();

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-3xl mx-auto px-5 py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-2">
            CMS · 새 에세이
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            새 에세이 작성
          </h1>
        </div>

        <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white p-8">
          <EssayForm
            defaults={{
              slug: "",
              title: "",
              preview: "",
              publishedAt: today,
              illustration: null,
              coverImage: null,
              body: null,
              newsletterSendAt: null,
            }}
            action={createEssay}
            submitLabel="저장하고 발행"
          />
        </div>
      </div>
    </main>
  );
}
