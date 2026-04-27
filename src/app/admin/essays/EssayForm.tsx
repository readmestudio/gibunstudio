"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState, useRef, useState } from "react";

const AVAILABLE_ILLUSTRATIONS = [
  "anchor-storm",
  "arrow-squiggle",
  "brain-mind",
  "chat-bubble",
  "face-smile",
  "heart-doodle",
  "journal-book",
  "mystic-eye",
  "plant-doodle",
  "star-sparkle",
  "underline-wave",
] as const;

export interface EssayFormDefaults {
  slug: string;
  title: string;
  preview: string;
  publishedAt: string;
  illustration: string | null;
  coverImage: string | null;
  body: string | null;
  newsletterSendAt: string | null;
}

type FormState = { error?: string } | undefined;

interface Props {
  /** new 모드: undefined, edit 모드: 원본 slug */
  originalSlug?: string;
  /** new 모드: 기본값 (오늘 발행일), edit 모드: 현재 값 */
  defaults: EssayFormDefaults;
  /** 서버 액션 — useActionState 와 호환되는 시그니처 */
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
}

/**
 * 썸네일 이미지 입력 필드.
 *
 * 1) 드래그앤드롭 / 클릭으로 파일 업로드 → /api/admin/essays/upload-cover
 * 2) 텍스트 입력으로 직접 경로/URL 입력 (예: /essays/my-essay.png)
 *
 * 두 방법 모두 같은 `coverImage` 폼 필드에 값이 들어가므로
 * 서버 액션 측은 바뀐 게 없어요.
 */
function CoverImageField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploadError(null);
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/essays/upload-cover", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setUploadError(json.error ?? "업로드에 실패했어요.");
        return;
      }
      setValue(json.url);
    } catch (e) {
      console.error("[CoverImageField] upload error:", e);
      setUploadError("네트워크 에러가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setUploadError("이미지 파일만 업로드할 수 있어요.");
      return;
    }
    uploadFile(file);
  }

  // next/image 는 외부 호스트라도 절대 URL 이거나 / 로 시작하는 경로만 OK.
  const showPreview = value && (value.startsWith("/") || /^https?:\/\//.test(value));

  return (
    <div>
      <label
        htmlFor="coverImage"
        className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60 mb-2"
      >
        썸네일 이미지 (선택)
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`relative cursor-pointer rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
            : "border-[var(--foreground)]/20 bg-white hover:border-[var(--foreground)]/40"
        } ${showPreview ? "p-3" : "p-8"}`}
      >
        {showPreview ? (
          <div className="space-y-3">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md bg-[var(--foreground)]/5">
              <Image
                src={value}
                alt="썸네일 미리보기"
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                unoptimized={value.startsWith("http")}
              />
            </div>
            <p className="text-xs text-[var(--foreground)]/60 text-center">
              새 이미지를 끌어다 놓거나 클릭해서 교체할 수 있어요.
            </p>
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm font-medium text-[var(--foreground)]/70">
              이미지를 여기에 끌어다 놓거나 클릭해서 선택
            </p>
            <p className="text-xs text-[var(--foreground)]/50">
              PNG, JPG, WEBP, GIF · 최대 5MB
            </p>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm">
            <p className="text-sm font-medium text-[var(--foreground)]">
              업로드 중...
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          // 같은 파일을 다시 선택해도 onChange 가 발화하도록 초기화
          e.target.value = "";
        }}
      />

      {uploadError && (
        <p className="mt-2 text-xs text-red-600">{uploadError}</p>
      )}

      <div className="mt-3">
        <input
          id="coverImage"
          name="coverImage"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/essays/my-essay.png"
          className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-sm font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
        />
        <div className="mt-1.5 flex items-start justify-between gap-3">
          <p className="text-xs text-[var(--foreground)]/50">
            업로드하면 이 칸에 URL 이 자동으로 채워져요. 직접 경로(예:{" "}
            <code className="font-mono">/essays/my-essay.png</code>)나 외부 URL 을 입력해도 됩니다.
          </p>
          {value && (
            <button
              type="button"
              onClick={() => {
                setValue("");
                setUploadError(null);
              }}
              className="shrink-0 text-xs text-[var(--foreground)]/60 hover:text-red-600 underline"
            >
              제거
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EssayForm({ defaults, action, submitLabel }: Props) {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="slug"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60 mb-2"
        >
          Slug (URL)
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          defaultValue={defaults.slug}
          placeholder="my-first-essay"
          pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
          className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-sm font-mono text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
        />
        <p className="mt-1.5 text-xs text-[var(--foreground)]/50">
          영문 소문자·숫자·하이픈만. URL 이 됩니다 (예: /essays/<strong>my-first-essay</strong>)
        </p>
      </div>

      <div>
        <label
          htmlFor="title"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60 mb-2"
        >
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaults.title}
          placeholder="예) 기쁨, 슬픔, 아름다운 마음"
          className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-base text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
        />
      </div>

      <div>
        <label
          htmlFor="preview"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60 mb-2"
        >
          Preview (한 줄 요약)
        </label>
        <input
          id="preview"
          name="preview"
          type="text"
          required
          defaultValue={defaults.preview}
          placeholder="카드·미리보기·메타 설명에 쓰이는 한 문장"
          className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="publishedAt"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60 mb-2"
          >
            공개 일자
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            required
            defaultValue={defaults.publishedAt}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
          />
          <p className="mt-1.5 text-xs text-[var(--foreground)]/50">
            미래 날짜로 설정하면 해당 날짜 전까지 공개 페이지에 노출되지 않아요.
          </p>
        </div>

        <div>
          <label
            htmlFor="newsletterSendAt"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60 mb-2"
          >
            뉴스레터 자동 발송 시작일
          </label>
          <input
            id="newsletterSendAt"
            name="newsletterSendAt"
            type="date"
            defaultValue={defaults.newsletterSendAt ?? ""}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
          />
          <p className="mt-1.5 text-xs text-[var(--foreground)]/50">
            이 날짜 이후 첫 목요일 오전 9시(KST)에 구독자에게 자동 발송돼요.
            비워두면 자동 발송 안 함. 중복 발송은 자동 방지.
          </p>
        </div>

        <div>
          <label
            htmlFor="illustration"
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60 mb-2"
          >
            일러스트 (선택)
          </label>
          <select
            id="illustration"
            name="illustration"
            defaultValue={defaults.illustration ?? ""}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
          >
            <option value="">— 없음 (타이포그래픽 헤더) —</option>
            {AVAILABLE_ILLUSTRATIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-[var(--foreground)]/50">
            비워두면 제목이 큰 타이포그래픽으로 렌더됩니다.
          </p>
        </div>
      </div>

      <CoverImageField defaultValue={defaults.coverImage ?? ""} />

      <div>
        <label
          htmlFor="body"
          className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60 mb-2"
        >
          본문
        </label>
        <textarea
          id="body"
          name="body"
          rows={20}
          defaultValue={defaults.body ?? ""}
          placeholder="에세이 본문을 여기에 적어주세요. 빈 줄로 문단을 구분하시면 화면에서도 문단으로 분리됩니다."
          className="w-full px-4 py-3 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-base leading-[1.8] text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)] font-sans"
          style={{ wordBreak: "keep-all" }}
        />
        <p className="mt-1.5 text-xs text-[var(--foreground)]/50">
          비워두면 &quot;이 편지는 곧 도착해요&quot; 플레이스홀더가 표시됩니다. 본문이
          있어야 주간 발송 대상이 될 수 있어요.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{state.error}</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-[var(--foreground)]/10">
        <Link
          href="/admin/essays"
          className="text-sm font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
        >
          ← 목록으로
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-lg bg-[var(--foreground)] text-white text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "저장 중..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
