import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Essay
 *
 * 이전에는 같은 이름의 하드코딩 배열로 관리했으나,
 * /admin/essays CMS 도입 이후 Supabase `essays` 테이블이 단일 출처입니다.
 *
 * 읽기는 essays_public_read (RLS, USING true) 로 누구나 가능하므로
 * 쿠키 기반 서버 클라이언트 대신 anon 키만 사용하는 공개 클라이언트를 씁니다.
 * generateStaticParams 같이 request scope 밖에서도 안전하게 호출하기 위함.
 */
export interface Essay {
  slug: string;
  title: string;
  preview: string;
  publishedAt: string;             // ISO date (YYYY-MM-DD)
  illustration?: string | null;    // 작은 SVG 아이콘 (public/doodles/*.svg)
  coverImage?: string | null;      // 큰 썸네일 이미지 (public 기준 절대 경로). 있으면 illustration/타이포 헤더보다 우선
  body?: string | null;            // null 이면 "곧 도착해요" 플레이스홀더
  newsletterSendAt?: string | null;// YYYY-MM-DD. null 이면 자동 발송 안 함
}

interface EssayRow {
  slug: string;
  title: string;
  preview: string;
  published_at: string;
  illustration: string | null;
  cover_image: string | null;
  body: string | null;
  newsletter_send_at: string | null;
}

const SELECT_COLUMNS =
  "slug, title, preview, published_at, illustration, cover_image, body, newsletter_send_at";

interface QueryOpts {
  /**
   * true 면 published_at 이 미래인 "예약 공개" 에세이도 함께 조회.
   * 어드민 전용 — 공개 페이지에서는 기본 false 로 두어 예약글이 노출되지 않도록.
   */
  includeScheduled?: boolean;
}

let publicClient: SupabaseClient | null = null;

function getPublicClient(): SupabaseClient {
  if (!publicClient) {
    publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return publicClient;
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function rowToEssay(row: EssayRow): Essay {
  return {
    slug: row.slug,
    title: row.title,
    preview: row.preview,
    publishedAt: row.published_at,
    illustration: row.illustration,
    coverImage: row.cover_image,
    body: row.body,
    newsletterSendAt: row.newsletter_send_at,
  };
}

export async function getAllEssays(opts: QueryOpts = {}): Promise<Essay[]> {
  let query = getPublicClient()
    .from("essays")
    .select(SELECT_COLUMNS)
    .order("published_at", { ascending: false });

  if (!opts.includeScheduled) {
    query = query.lte("published_at", todayIsoDate());
  }

  const { data, error } = await query;
  if (error) {
    console.error("[essays/data] getAllEssays 실패:", error);
    return [];
  }
  return (data ?? []).map(rowToEssay);
}

export async function getEssayBySlug(
  slug: string,
  opts: QueryOpts = {}
): Promise<Essay | null> {
  let query = getPublicClient()
    .from("essays")
    .select(SELECT_COLUMNS)
    .eq("slug", slug);

  if (!opts.includeScheduled) {
    query = query.lte("published_at", todayIsoDate());
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    console.error(`[essays/data] getEssayBySlug(${slug}) 실패:`, error);
    return null;
  }
  return data ? rowToEssay(data) : null;
}

export async function getLatestEssays(
  count: number,
  opts: QueryOpts = {}
): Promise<Essay[]> {
  let query = getPublicClient()
    .from("essays")
    .select(SELECT_COLUMNS)
    .order("published_at", { ascending: false })
    .limit(count);

  if (!opts.includeScheduled) {
    query = query.lte("published_at", todayIsoDate());
  }

  const { data, error } = await query;
  if (error) {
    console.error("[essays/data] getLatestEssays 실패:", error);
    return [];
  }
  return (data ?? []).map(rowToEssay);
}

export function formatEssayDate(iso: string): string {
  return iso.replaceAll("-", ".");
}
