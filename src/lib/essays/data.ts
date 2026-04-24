import { createClient } from "@/lib/supabase/server";

/**
 * Essay
 *
 * 이전에는 같은 이름의 하드코딩 배열로 관리했으나,
 * /admin/essays CMS 도입 이후 Supabase `essays` 테이블이 단일 출처입니다.
 */
export interface Essay {
  slug: string;
  title: string;
  preview: string;
  publishedAt: string;             // ISO date (YYYY-MM-DD)
  illustration?: string | null;    // null 이면 타이포그래픽 헤더
  body?: string | null;            // null 이면 "곧 도착해요" 플레이스홀더
}

interface EssayRow {
  slug: string;
  title: string;
  preview: string;
  published_at: string;
  illustration: string | null;
  body: string | null;
}

function rowToEssay(row: EssayRow): Essay {
  return {
    slug: row.slug,
    title: row.title,
    preview: row.preview,
    publishedAt: row.published_at,
    illustration: row.illustration,
    body: row.body,
  };
}

export async function getAllEssays(): Promise<Essay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("essays")
    .select("slug, title, preview, published_at, illustration, body")
    .order("published_at", { ascending: false });

  if (error) {
    console.error("[essays/data] getAllEssays 실패:", error);
    return [];
  }
  return (data ?? []).map(rowToEssay);
}

export async function getEssayBySlug(slug: string): Promise<Essay | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("essays")
    .select("slug, title, preview, published_at, illustration, body")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(`[essays/data] getEssayBySlug(${slug}) 실패:`, error);
    return null;
  }
  return data ? rowToEssay(data) : null;
}

export async function getLatestEssays(count: number): Promise<Essay[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("essays")
    .select("slug, title, preview, published_at, illustration, body")
    .order("published_at", { ascending: false })
    .limit(count);

  if (error) {
    console.error("[essays/data] getLatestEssays 실패:", error);
    return [];
  }
  return (data ?? []).map(rowToEssay);
}

export function formatEssayDate(iso: string): string {
  return iso.replaceAll("-", ".");
}
