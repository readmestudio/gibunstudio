"use client";

import { useTransition } from "react";
import { deleteEssay } from "./actions";

interface Props {
  slug: string;
  title: string;
}

export function DeleteEssayButton({ slug, title }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const ok = window.confirm(
      `"${title}" 을(를) 정말 삭제하시겠어요?\n\n삭제하면 되돌릴 수 없어요. 그리고 이 에세이 URL(/essays/${slug})은 이후 404가 됩니다.`
    );
    if (!ok) return;
    startTransition(async () => {
      try {
        await deleteEssay(slug);
      } catch (err) {
        alert(err instanceof Error ? err.message : "삭제에 실패했어요.");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
      {isPending ? "삭제 중..." : "삭제"}
    </button>
  );
}
