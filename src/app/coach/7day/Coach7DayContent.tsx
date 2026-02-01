"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PendingPayment = {
  id: string;
  userEmail: string;
  amount: number;
  createdAt: string;
};

export function Coach7DayContent() {
  const [pending, setPending] = useState<PendingPayment[]>([]);

  useEffect(() => {
    // 추후 Supabase에서 입금 대기 목록 조회
    // const { data } = await supabase.from('purchases').select('*').eq('status', 'pending').eq('program_type', '7day');
    setPending([]);
  }, []);

  const handleConfirm = async (id: string) => {
    // 추후 API 호출: await fetch('/api/purchases/confirm', { method: 'POST', body: JSON.stringify({ id }) });
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          입금 대기
        </h2>
        {pending.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--foreground)]/60">
            입금을 기다리는 건이 없습니다.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pending.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-white p-4"
              >
                <div>
                  <p className="font-medium text-[var(--foreground)]">{p.userEmail}</p>
                  <p className="text-sm text-[var(--foreground)]/60">
                    {p.amount.toLocaleString()}원 · {new Date(p.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleConfirm(p.id)}
                  className="rounded-lg bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
                >
                  입금 확인
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          TCI PDF 업로드
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground)]/70">
          회원별 TCI 검사 결과 PDF를 업로드합니다.
        </p>
        <div className="mt-4 space-y-2">
          <input
            type="file"
            accept=".pdf"
            className="block w-full text-sm text-[var(--foreground)] file:mr-4 file:rounded-lg file:border-0 file:bg-[var(--accent)] file:px-4 file:py-2 file:font-semibold file:text-[var(--foreground)] hover:file:bg-[var(--accent-hover)]"
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
          >
            업로드
          </button>
        </div>
        <p className="mt-2 text-sm text-[var(--foreground)]/60">
          Supabase Storage 연동 후 구현됩니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          일자별 미션 현황
        </h2>
        <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--foreground)]/60">
          Supabase 연동 후 회원별 미션 완료 현황이 표시됩니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          리포트 작성
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground)]/70">
          6일차 미션을 완료한 회원의 로우데이터로 리포트를 생성합니다.
        </p>
        <Link
          href="/coach/7day/report"
          className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          리포트 작성하기
        </Link>
      </section>
    </div>
  );
}
