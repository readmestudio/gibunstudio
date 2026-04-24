"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * 에세이 CMS 서버 액션
 *
 * 모든 액션은 requireAdmin 이 먼저 실행되어 비관리자의 호출을 차단합니다.
 * DB 쓰기는 createAdminClient (Service Role) 로 RLS 를 우회합니다.
 */

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

interface EssayInput {
  slug: string;
  title: string;
  preview: string;
  publishedAt: string;
  illustration: string | null;
  coverImage: string | null;
  body: string | null;
}

function parseFormData(formData: FormData): EssayInput | { error: string } {
  const slug = (formData.get("slug") ?? "").toString().trim();
  const title = (formData.get("title") ?? "").toString().trim();
  const preview = (formData.get("preview") ?? "").toString().trim();
  const publishedAt = (formData.get("publishedAt") ?? "").toString().trim();
  const illustrationRaw = (formData.get("illustration") ?? "").toString().trim();
  const coverImageRaw = (formData.get("coverImage") ?? "").toString().trim();
  const bodyRaw = (formData.get("body") ?? "").toString();

  if (!slug) return { error: "slug 를 입력해주세요." };
  if (!SLUG_REGEX.test(slug)) {
    return { error: "slug 는 영문 소문자·숫자·하이픈만 사용할 수 있어요. (예: my-first-essay)" };
  }
  if (!title) return { error: "제목을 입력해주세요." };
  if (!preview) return { error: "preview 를 입력해주세요." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
    return { error: "발행일 형식이 올바르지 않아요. (YYYY-MM-DD)" };
  }
  if (coverImageRaw && !coverImageRaw.startsWith("/") && !/^https?:\/\//.test(coverImageRaw)) {
    return { error: "썸네일 이미지는 '/' 로 시작하는 절대 경로 또는 http(s) URL 이어야 해요." };
  }

  return {
    slug,
    title,
    preview,
    publishedAt,
    illustration: illustrationRaw === "" ? null : illustrationRaw,
    coverImage: coverImageRaw === "" ? null : coverImageRaw,
    body: bodyRaw.trim() === "" ? null : bodyRaw,
  };
}

export async function createEssay(
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  const admin = createAdminClient();
  const { error } = await admin.from("essays").insert({
    slug: parsed.slug,
    title: parsed.title,
    preview: parsed.preview,
    published_at: parsed.publishedAt,
    illustration: parsed.illustration,
    cover_image: parsed.coverImage,
    body: parsed.body,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `이미 같은 slug 의 에세이가 있어요: ${parsed.slug}` };
    }
    console.error("[admin/essays] createEssay 실패:", error);
    return { error: "저장에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/essays");
  revalidatePath(`/essays/${parsed.slug}`);
  revalidatePath("/admin/essays");
  redirect("/admin/essays");
}

export async function updateEssay(
  originalSlug: string,
  _prev: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = parseFormData(formData);
  if ("error" in parsed) return { error: parsed.error };

  const admin = createAdminClient();
  const { error } = await admin
    .from("essays")
    .update({
      slug: parsed.slug,
      title: parsed.title,
      preview: parsed.preview,
      published_at: parsed.publishedAt,
      illustration: parsed.illustration,
      cover_image: parsed.coverImage,
      body: parsed.body,
    })
    .eq("slug", originalSlug);

  if (error) {
    if (error.code === "23505") {
      return { error: `이미 같은 slug 의 에세이가 있어요: ${parsed.slug}` };
    }
    console.error("[admin/essays] updateEssay 실패:", error);
    return { error: "저장에 실패했어요. 잠시 후 다시 시도해주세요." };
  }

  revalidatePath("/essays");
  revalidatePath(`/essays/${originalSlug}`);
  if (parsed.slug !== originalSlug) {
    revalidatePath(`/essays/${parsed.slug}`);
  }
  revalidatePath("/admin/essays");
  redirect("/admin/essays");
}

export async function deleteEssay(slug: string): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("essays").delete().eq("slug", slug);
  if (error) {
    console.error("[admin/essays] deleteEssay 실패:", error);
    throw new Error("삭제에 실패했어요.");
  }
  revalidatePath("/essays");
  revalidatePath(`/essays/${slug}`);
  revalidatePath("/admin/essays");
}
