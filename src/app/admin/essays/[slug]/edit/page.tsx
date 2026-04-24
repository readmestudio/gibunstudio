import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getEssayBySlug } from "@/lib/essays/data";
import { EssayForm } from "../../EssayForm";
import { updateEssay } from "../../actions";

export const metadata: Metadata = {
  title: "에세이 수정 | 기분 스튜디오",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditEssayPage({ params }: Props) {
  await requireAdmin();
  const { slug } = await params;
  const essay = await getEssayBySlug(slug);
  if (!essay) notFound();

  // updateEssay 는 (originalSlug, prevState, formData) 시그니처이므로
  // 서버 액션 wrapper 로 originalSlug 를 bind 하여 useActionState 호환으로 맞춤
  const boundAction = updateEssay.bind(null, slug);

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-3xl mx-auto px-5 py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-2">
            CMS · 수정
          </p>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            에세이 수정
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            현재 수정 중: <code className="font-mono">{slug}</code>
          </p>
        </div>

        <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white p-8">
          <EssayForm
            originalSlug={slug}
            defaults={{
              slug: essay.slug,
              title: essay.title,
              preview: essay.preview,
              publishedAt: essay.publishedAt,
              illustration: essay.illustration ?? null,
              body: essay.body ?? null,
            }}
            action={boundAction}
            submitLabel="변경사항 저장"
          />
        </div>
      </div>
    </main>
  );
}
