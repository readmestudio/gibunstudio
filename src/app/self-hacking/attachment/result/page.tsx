"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  ATTACHMENT_STYLE_NAMES,
  ATTACHMENT_STYLE_DESCRIPTIONS,
  type AttachmentScores,
  type AttachmentStyle,
} from "@/lib/self-hacking/attachment-questions";

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const submissionId = searchParams.get("id");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [scores, setScores] = useState<AttachmentScores | null>(null);
  const [loading, setLoading] = useState(true);

  /* 제출 데이터에서 점수 로드 */
  useEffect(() => {
    async function loadScores() {
      if (!submissionId) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("attachment_submissions")
          .select("scores")
          .eq("id", submissionId)
          .single();

        if (data?.scores) {
          setScores(data.scores as AttachmentScores);
        }
      } catch {
        // 점수 로드 실패해도 페이지는 표시
      }
      setLoading(false);
    }

    loadScores();
  }, [submissionId]);

  async function handleGenerateReport() {
    if (!submissionId) return;

    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/attachment/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "리포트 생성에 실패했습니다.");
      }

      router.push(`/self-hacking/attachment/report/${data.report_id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(message);
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--foreground)] border-t-transparent rounded-full" />
      </div>
    );
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
            당신의 애착 패턴을 심층 분석하고 있습니다.
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
          {/* 체크 아이콘 */}
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
        </div>

        {/* 무료 결과: 애착 유형 요약 */}
        {scores && (
          <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6 text-left">
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4 text-center">
              나의 애착 유형
            </h2>

            {/* 유형 이름 */}
            <div className="rounded-xl bg-[var(--foreground)]/5 p-4 mb-5 text-center">
              <p className="text-xl font-bold text-[var(--foreground)]">
                {ATTACHMENT_STYLE_NAMES[scores.style]}
              </p>
            </div>

            {/* 간단 설명 */}
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed mb-5">
              {ATTACHMENT_STYLE_DESCRIPTIONS[scores.style]}
            </p>

            {/* 2축 시각화 */}
            <div className="space-y-3">
              <ScoreBar label="관계 불안" score={scores.anxiety} />
              <ScoreBar label="친밀감 회피" score={scores.avoidance} />
            </div>
          </div>
        )}

        {/* AI 심층 리포트 CTA */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            AI 심층 분석 리포트
          </h2>
          <p className="text-sm text-[var(--foreground)]/60 mb-1">
            불안/회피 심층 분석 / 연애 패턴 해석
          </p>
          <p className="text-sm text-[var(--foreground)]/60 mb-4">
            + 성장 가이드 및 상담사의 한마디
          </p>

          <p className="text-2xl font-bold text-[var(--foreground)] mb-6">
            ₩9,900
          </p>

          <button
            onClick={handleGenerateReport}
            disabled={!submissionId}
            className="w-full py-4 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] text-white font-semibold text-base hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            AI 심층 리포트 받기
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

/** 점수 바 시각화 컴포넌트 */
function ScoreBar({ label, score }: { label: string; score: number }) {
  // 1~5 범위를 0~100%로 변환
  const percent = ((score - 1) / 4) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <span className="text-[var(--foreground)]/60">
          {score.toFixed(1)} / 5.0
        </span>
      </div>
      <div className="h-2.5 bg-[var(--foreground)]/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--foreground)] rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function AttachmentResultPage() {
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
