'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const MIN_IMAGES = 3;

export default function CapturePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        if (!user) {
          router.replace('/login?next=/husband-match/birth-info');
          return;
        }
        setIsLoggedIn(true);
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (files.length === 0) {
      setPreviews([]);
      return;
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews((prev) => {
      prev.forEach(URL.revokeObjectURL);
      return urls;
    });
    return () => urls.forEach(URL.revokeObjectURL);
  }, [files]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected].slice(0, 20));
      setError(null);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length < MIN_IMAGES) {
      setError(`구독 목록 캡처를 ${MIN_IMAGES}장 이상 올려주세요.`);
      return;
    }
    if (!isLoggedIn) return;

    setSubmitLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));

      try {
        const birthInfoStr = localStorage.getItem('birthInfo');
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
      if (!res.ok) {
        setError(data.error || '분석 요청에 실패했습니다.');
        setSubmitLoading(false);
        return;
      }
      if (data.phase1_id) {
        router.push(`/husband-match/report/${data.phase1_id}`);
        return;
      }
      setError('결과를 받지 못했습니다.');
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-[var(--foreground)]/60">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2 text-center">
          구독 목록 캡처하기
        </h1>
        <p className="text-sm text-[var(--foreground)]/70 text-center mb-6">
          유튜브 구독 목록을 캡처해서 올려주세요 (3장 이상)
        </p>

        {/* 업로드 영역 — 상단 */}
        <div className="rounded-2xl bg-white border-2 border-[var(--foreground)] p-4 mb-6">
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">
            캡처한 이미지 올리기 (3장 이상)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-4 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--foreground)]/60 hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors text-sm"
          >
            사진 선택 (갤러리에서 선택)
          </button>
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--surface)] border border-[var(--border)]">
                  <img src={url} alt={`캡처 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[var(--foreground)] text-white text-xs flex items-center justify-center"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && files.length < MIN_IMAGES && (
            <p className="mt-2 text-xs text-[var(--foreground)]/60">
              {MIN_IMAGES - files.length}장 더 올려주세요.
            </p>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
        )}

        {/* 분석 버튼 */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={files.length < MIN_IMAGES || submitLoading}
          className="w-full py-4 rounded-xl bg-[var(--foreground)] text-white font-semibold border-2 border-[var(--foreground)] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-colors mb-8"
        >
          {submitLoading ? '분석 중...' : '분석하기'}
        </button>

        {/* 구독 목록 캡처 가이드 — 하단 카드 */}
        <div className="mb-6">
          <p className="text-sm font-medium text-[var(--foreground)] mb-3">
            캡처 방법이 헷갈린다면?
          </p>
          <div className="grid grid-cols-3 gap-3">
            {/* 가이드 카드 1 */}
            <div className="aspect-square rounded-xl border-2 border-[var(--border)] overflow-hidden bg-[var(--surface)] flex items-center justify-center">
              <Image
                src="/images/guide-step1.png"
                alt="1단계: 유튜브 앱에서 구독 탭 열기"
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>
            {/* 가이드 카드 2 */}
            <div className="aspect-square rounded-xl border-2 border-[var(--border)] overflow-hidden bg-[var(--surface)] flex items-center justify-center">
              <Image
                src="/images/guide-step2.png"
                alt="2단계: 전체 > 관련성 순 설정"
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>
            {/* 가이드 카드 3 */}
            <div className="aspect-square rounded-xl border-2 border-[var(--border)] overflow-hidden bg-[var(--surface)] flex items-center justify-center">
              <Image
                src="/images/guide-step3.png"
                alt="3단계: 구독 목록 캡처하기"
                width={200}
                height={200}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* 뒤로가기 */}
        <div className="text-center">
          <Link
            href="/self-hacking"
            className="text-sm text-[var(--foreground)]/60 hover:underline"
          >
            ← 시작 화면으로
          </Link>
        </div>
      </div>
    </div>
  );
}
