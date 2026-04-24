"use client";

import Link from "next/link";
import { useActionState } from "react";

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
  body: string | null;
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
            발행일
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            required
            defaultValue={defaults.publishedAt}
            className="w-full px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
          />
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
