'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// capture 페이지에서 비로그인 유저가 저장해 둔 이미지 키 (capture/page.tsx와 동일)
const CAPTURE_STORAGE_KEY = 'husband_match_capture_images';

// data URL(base64) → File 복원 (분석 API 제출용)
async function dataUrlToFile(dataUrl: string, index: number): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = (blob.type.split('/')[1] || 'png').split(';')[0];
  return new File([blob], `capture-${index + 1}.${ext}`, { type: blob.type || 'image/png' });
}

export default function CaptureClaimPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'submitting' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (cancelled) return;
      if (!user) {
        router.replace('/login?next=/husband-match/capture/claim');
        return;
      }

      if (typeof window === 'undefined') return;
      const raw = window.sessionStorage.getItem(CAPTURE_STORAGE_KEY);
      if (!raw) {
        // 저장된 캡처가 없으면 업로드 화면으로
        router.replace('/husband-match/capture');
        return;
      }

      let images: string[];
      let force = false;
      try {
        const parsed = JSON.parse(raw) as { images?: string[]; force?: boolean };
        images = Array.isArray(parsed.images) ? parsed.images : [];
        force = !!parsed.force;
      } catch {
        window.sessionStorage.removeItem(CAPTURE_STORAGE_KEY);
        router.replace('/husband-match/capture');
        return;
      }

      if (images.length === 0) {
        window.sessionStorage.removeItem(CAPTURE_STORAGE_KEY);
        router.replace('/husband-match/capture');
        return;
      }

      setStatus('submitting');
      try {
        const formData = new FormData();
        const files = await Promise.all(images.map((url, i) => dataUrlToFile(url, i)));
        files.forEach((file) => formData.append('images', file));
        if (force) formData.append('force', 'true');

        // 생년월일/이름은 capture 흐름과 동일하게 localStorage에서 읽는다.
        try {
          const birthInfoStr = window.localStorage.getItem('birthInfo');
          if (birthInfoStr) {
            const birthInfo = JSON.parse(birthInfoStr);
            if (birthInfo.userName) formData.append('user_name', birthInfo.userName);
            if (birthInfo.year) formData.append('birth_year', String(birthInfo.year));
            if (birthInfo.month) formData.append('birth_month', String(birthInfo.month));
            if (birthInfo.day) formData.append('birth_day', String(birthInfo.day));
          }
        } catch { /* birthInfo 파싱 실패는 무시 */ }

        const res = await fetch('/api/analyze/phase1/from-screenshots', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;
        if (!res.ok) {
          setErrorMessage(data.error || '분석 요청에 실패했습니다.');
          setStatus('error');
          return;
        }
        if (data.phase1_id) {
          window.sessionStorage.removeItem(CAPTURE_STORAGE_KEY);
          router.push(`/husband-match/report/${data.phase1_id}`);
          return;
        }
        setErrorMessage('결과를 받지 못했습니다.');
        setStatus('error');
      } catch (e) {
        if (cancelled) return;
        setErrorMessage(e instanceof Error ? e.message : '요청 중 오류가 났습니다.');
        setStatus('error');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <p className="text-red-600 mb-4 text-center">{errorMessage}</p>
        <button
          type="button"
          onClick={() => router.push('/husband-match/capture')}
          className="rounded-xl bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-white border-2 border-[var(--foreground)] hover:opacity-90"
        >
          캡처 화면으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <p className="text-[var(--foreground)]/70">
        {status === 'checking' ? '확인 중...' : '결과를 분석하는 중...'}
      </p>
    </div>
  );
}
