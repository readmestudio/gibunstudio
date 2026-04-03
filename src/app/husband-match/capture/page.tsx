'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

const MIN_IMAGES = 3;

const LOADING_MESSAGES = [
  '유튜브 구독 리스트를 확인하고 있습니다',
  '재밌는 패턴을 발견했어요!',
  '당신의 취향 밸런스를 분석하고 있습니다',
  '구독 채널에서 기질 신호를 읽고 있어요',
  '당신만의 고유한 성격 프로필을 그리는 중입니다',
  '당신의 배우자가 될만한 사람의 알고리즘을 분석하고 있어요',
  '48개 유형 중 가장 잘 맞는 타입을 찾고 있습니다',
  '거의 다 됐어요! 리포트를 만들고 있습니다',
];

export default function CapturePage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [existingResult, setExistingResult] = useState<{ id: string } | null>(null);
  const [forceReanalyze, setForceReanalyze] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 분석 중 메시지 롤링 (3초 간격)
  useEffect(() => {
    if (!submitLoading) {
      setLoadingMsgIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setLoadingMsgIndex((prev) =>
        prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 3000);
    return () => clearInterval(timer);
  }, [submitLoading]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace('/login?next=/husband-match/birth-info');
        return;
      }
      setIsLoggedIn(true);

      // 기존 분석 결과 존재 여부 확인
      const { data: existing } = await supabase
        .from('phase1_results')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        setExistingResult({ id: existing.id });
      }

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
      if (forceReanalyze) {
        formData.append('force', 'true');
      }

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

  // 분석 중 전체 화면 로딩
  if (submitLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
        {/* 펄스 애니메이션 원 */}
        <div className="relative mb-10">
          <div className="w-20 h-20 rounded-full border-2 border-[var(--foreground)] animate-ping opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-[var(--foreground)] animate-pulse" />
          </div>
        </div>

        {/* 롤링 텍스트 */}
        <div className="h-16 flex items-center overflow-hidden px-6">
          <p
            key={loadingMsgIndex}
            className="text-lg font-semibold text-[var(--foreground)] text-center animate-fade-in"
          >
            {LOADING_MESSAGES[loadingMsgIndex]}
          </p>
        </div>

        {/* 프로그레스 도트 */}
        <div className="flex gap-2 mt-8">
          {LOADING_MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                i <= loadingMsgIndex
                  ? 'bg-[var(--foreground)]'
                  : 'bg-[var(--foreground)]/20'
              }`}
            />
          ))}
        </div>

        <p className="mt-6 text-sm text-[var(--foreground)]/50">
          약 30초~1분 소요됩니다
        </p>

        {/* fade-in 애니메이션 */}
        <style jsx>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // 기존 분석 결과가 있을 때 선택 다이얼로그
  if (existingResult && !forceReanalyze) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-sm w-full rounded-2xl border-2 border-[var(--foreground)] p-6 text-center">
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">
            이전에 분석한 결과가 있어요!
          </h2>
          <p className="text-sm text-[var(--foreground)]/60 mb-6">
            이전 결과를 확인하거나, 새로 분석할 수 있어요.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/husband-match/report/${existingResult.id}`)}
            className="w-full py-3 rounded-xl bg-[var(--foreground)] text-white font-semibold border-2 border-[var(--foreground)] hover:opacity-90 transition-colors mb-3"
          >
            이전 결과 보기
          </button>
          <button
            type="button"
            onClick={() => {
              setForceReanalyze(true);
              setExistingResult(null);
            }}
            className="w-full py-3 rounded-xl bg-white text-[var(--foreground)] font-semibold border-2 border-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
          >
            새로 분석하기
          </button>
        </div>
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
            <div className="rounded-xl border-2 border-[var(--border)] overflow-hidden bg-[var(--surface)]">
              <div className="aspect-square">
                <Image
                  src="/images/guide-step1.png"
                  alt="1단계: 구독 탭 클릭"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-center text-[var(--foreground)]/70 py-2 px-1 font-medium">
                1. 구독 탭 클릭
              </p>
            </div>
            {/* 가이드 카드 2 */}
            <div className="rounded-xl border-2 border-[var(--border)] overflow-hidden bg-[var(--surface)]">
              <div className="aspect-square">
                <Image
                  src="/images/guide-step2.png"
                  alt="2단계: 전체 버튼 클릭"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-center text-[var(--foreground)]/70 py-2 px-1 font-medium">
                2. 전체 버튼 클릭
              </p>
            </div>
            {/* 가이드 카드 3 */}
            <div className="rounded-xl border-2 border-[var(--border)] overflow-hidden bg-[var(--surface)]">
              <div className="aspect-square">
                <Image
                  src="/images/guide-step3.png"
                  alt="3단계: 관련성 순으로 3장 캡처"
                  width={400}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-center text-[var(--foreground)]/70 py-2 px-1 font-medium">
                3. 관련성 순 3장 캡처
              </p>
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
