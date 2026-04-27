import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * 에세이 썸네일 이미지 업로드 API
 *
 * - multipart/form-data 의 `file` 필드로 이미지 받음
 * - requireAdmin 으로 관리자만 호출 가능
 * - Supabase Storage `essay-images` 버킷의 covers/ 경로에 저장
 * - public URL 을 반환 → 폼의 coverImage 필드에 그대로 저장됨
 */

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

const BUCKET = "essay-images";

export async function POST(req: NextRequest) {
  await requireAdmin();

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "파일 데이터를 읽지 못했어요." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "파일이 첨부되지 않았어요." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "PNG, JPG, WEBP, GIF 형식만 업로드할 수 있어요." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "파일 크기는 5MB 이하여야 해요." },
      { status: 400 }
    );
  }

  const ext = MIME_TO_EXT[file.type];
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 10);
  const path = `covers/${timestamp}-${random}.${ext}`;

  const admin = createAdminClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error("[admin/essays] upload-cover 실패:", uploadError);
    return NextResponse.json(
      { error: "업로드에 실패했어요. Supabase 버킷이 준비되었는지 확인해주세요." },
      { status: 500 }
    );
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, path });
}
