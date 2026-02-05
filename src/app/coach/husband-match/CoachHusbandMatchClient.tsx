'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Phase2Row = {
  id: string;
  user_id: string;
  phase1_id: string;
  created_at: string;
  published_at: string | null;
  published_by: string | null;
};

type Tab = 'pending' | 'published';

export function CoachHusbandMatchClient({
  pending,
  published,
}: {
  pending: Phase2Row[];
  published: Phase2Row[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('pending');
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handlePublish = async (phase2Id: string) => {
    setPublishingId(phase2Id);
    try {
      const res = await fetch('/api/coach/phase2/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase2_id: phase2Id }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setPublishingId(null);
    }
  };

  const formatDate = (s: string) => {
    try {
      return new Date(s).toLocaleString('ko-KR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return s;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'pending' ? 'border-b-2 border-[var(--accent)] text-[var(--foreground)]' : 'text-[var(--foreground)]/70'}`}
        >
          검토 대기 ({pending.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('published')}
          className={`px-4 py-2 text-sm font-medium ${tab === 'published' ? 'border-b-2 border-[var(--accent)] text-[var(--foreground)]' : 'text-[var(--foreground)]/70'}`}
        >
          퍼블리시 완료 ({published.length})
        </button>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface)]">
              <th className="p-3 font-medium text-[var(--foreground)]">Phase2 ID</th>
              <th className="p-3 font-medium text-[var(--foreground)]">User ID</th>
              <th className="p-3 font-medium text-[var(--foreground)]">생성일</th>
              {tab === 'published' && (
                <th className="p-3 font-medium text-[var(--foreground)]">퍼블리시일</th>
              )}
              {tab === 'pending' && <th className="p-3 font-medium text-[var(--foreground)]">동작</th>}
            </tr>
          </thead>
          <tbody>
            {(tab === 'pending' ? pending : published).map((row) => (
              <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                <td className="p-3">
                  <Link
                    href={`/husband-match/deep-report/${row.id}`}
                    className="text-[var(--accent)] hover:underline"
                  >
                    {row.id.slice(0, 8)}…
                  </Link>
                </td>
                <td className="p-3 font-mono text-xs text-[var(--foreground)]/80">{row.user_id.slice(0, 8)}…</td>
                <td className="p-3 text-[var(--foreground)]/80">{formatDate(row.created_at)}</td>
                {tab === 'published' && row.published_at && (
                  <td className="p-3 text-[var(--foreground)]/80">{formatDate(row.published_at)}</td>
                )}
                {tab === 'pending' && (
                  <td className="p-3">
                    <button
                      type="button"
                      disabled={!!publishingId}
                      onClick={() => handlePublish(row.id)}
                      className="rounded bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
                    >
                      {publishingId === row.id ? '처리 중…' : '퍼블리시'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {(tab === 'pending' ? pending : published).length === 0 && (
          <p className="p-6 text-center text-[var(--foreground)]/60">
            {tab === 'pending' ? '검토 대기 항목이 없습니다.' : '퍼블리시된 항목이 없습니다.'}
          </p>
        )}
      </div>
    </div>
  );
}
