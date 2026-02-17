"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionId = searchParams.get("id");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerateReport() {
    if (!submissionId) return;

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/core-belief/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "리포트 생성에 실패했습니다.");
      }

      router.push(`/self-hacking/core-belief/report/${data.report_id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(message);
      setGenerating(false);
    }
  }

  if (generating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin w-10 h-10 border-2 border-[var(--foreground)] border-t-transparent rounded-full mx-auto mb-6" />
          <p className="text-lg font-semibold text-[var(--foreground)] mb-2">
            AI가 분석 중입니다
          </p>
          <p className="text-sm text-[var(--foreground)]/60">
            당신의 답변을 바탕으로 핵심 신념을 분석하고 있습니다.
            <br />
            약 30초~1분 정도 소요됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-full border-2 border-[var(--foreground)] flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-[var(--foreground)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">
            검사가 완료되었습니다!
          </h1>
          <p className="text-base text-[var(--foreground)]/70 leading-relaxed">
            당신의 무의식 속 핵심 신념을
            <br />
            AI가 분석한 리포트를 확인하세요.
          </p>
        </div>

        {/* 리포트 결제 카드 */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            핵심 신념 분석 리포트
          </h2>
          <p className="text-sm text-[var(--foreground)]/60 mb-1">
            나에 대한 신념 / 타인에 대한 신념 / 세상에 대한 신념
          </p>
          <p className="text-sm text-[var(--foreground)]/60 mb-4">
            + 종합 분석 및 성장 방향 제시
          </p>

          <p className="text-2xl font-bold text-[var(--foreground)] mb-6">
            ₩19,900
          </p>

          <button
            onClick={handleGenerateReport}
            disabled={!submissionId}
            className="w-full py-4 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] text-white font-semibold text-base hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            리포트 받기
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>

        <Link
          href="/self-hacking"
          className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
        >
          ← 검사 목록으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default function CoreBeliefResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--foreground)] border-t-transparent rounded-full" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
