'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

const GUIDE_STEPS = [
  { title: '1. 구독 탭 클릭', desc: '유튜브 앱/웹에서 구독 탭을 눌러주세요.', highlight: '구독' },
  { title: '2. 전체 클릭', desc: '상단의 "전체"를 눌러주세요.', highlight: '전체' },
  { title: '3. 관련성 순 필터', desc: '"관련성 순" 필터를 선택해 주세요.', highlight: '관련성 순' },
];

const MIN_IMAGES = 3;

export default function CapturePage() {
  const router = useRouter();
  const [guideStep, setGuideStep] = useState(0);
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
        setIsLoggedIn(!!user);
        setLoading(false);
      });
  }, []);

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

  const getRedirectTo = () => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent("/husband-match/capture")}`;
  };

  const handleKakaoLogin = async () => {
    setError(null);
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: getRedirectTo() },
      });
      if (err) setError(err.message || "카카오 로그인에 실패했습니다.");
    } catch {
      setError("카카오 로그인 중 오류가 발생했습니다.");
    }
  };

  const handleSubmit = async () => {
    if (files.length < MIN_IMAGES) {
      setError(`구독 목록 캡처를 ${MIN_IMAGES}장 이상 올려주세요.`);
      return;
    }
    if (!isLoggedIn) {
      return;
    }
    setSubmitLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('images', file));
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface)]">
        <p className="text-[var(--foreground)]/60">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold text-[var(--foreground)] mb-2 text-center">
          구독 목록 캡처하기
        </h1>
        <p className="text-sm text-[var(--foreground)]/70 text-center mb-6">
          유튜브에서 구독 &gt; 전체 &gt; 관련성 순으로 설정한 뒤, 보이는 구독 목록을 3장 이상 캡처해 올려주세요.
        </p>

        {/* Guide carousel */}
        <div className="rounded-2xl overflow-hidden bg-white border border-[var(--border)] shadow-sm mb-6">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={guideStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-24 h-24 rounded-2xl bg-white/90 shadow-lg flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-[var(--foreground)]">{guideStep + 1}</span>
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">
                  {GUIDE_STEPS[guideStep].title}
                </h2>
                <p className="text-sm text-[var(--foreground)]/70 mb-4">
                  {GUIDE_STEPS[guideStep].desc}
                </p>
                <motion.span
                  className="inline-block px-4 py-2 rounded-lg bg-[var(--accent)] text-[var(--foreground)] font-medium"
                  animate={{ scale: [1, 1.05, 1], boxShadow: ['0 0 0 0 rgba(255,232,18,0.4)', '0 0 0 12px rgba(255,232,18,0)', '0 0 0 0 rgba(255,232,18,0)'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  {GUIDE_STEPS[guideStep].highlight} 클릭
                </motion.span>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={() => setGuideStep((s) => (s > 0 ? s - 1 : 2))}
              className="text-sm font-medium text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
            >
              이전
            </button>
            <div className="flex gap-1.5">
              {[0, 1, 2].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGuideStep(i)}
                  className={`w-2 h-2 rounded-full transition-colors ${guideStep === i ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                  aria-label={`단계 ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setGuideStep((s) => (s < 2 ? s + 1 : 0))}
              className="text-sm font-medium text-[var(--foreground)]/70 hover:text-[var(--foreground)]"
            >
              다음
            </button>
          </div>
        </div>

        {/* Upload area */}
        <div className="rounded-2xl bg-white border border-[var(--border)] shadow-sm p-4 mb-4">
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
            className="w-full py-4 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--foreground)]/60 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors text-sm"
          >
            사진 선택 (갤러리에서 선택)
          </button>
          {previews.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {previews.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[var(--surface)]">
                  <img src={url} alt={`캡처 ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center"
                    aria-label="삭제"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {files.length > 0 && files.length < MIN_IMAGES && (
            <p className="mt-2 text-xs text-amber-600">
              {MIN_IMAGES - files.length}장 더 올려주세요.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 mb-4 text-center">{error}</p>
        )}

        {isLoggedIn ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={files.length < MIN_IMAGES || submitLoading}
            className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--foreground)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent-hover)] transition-colors"
          >
            {submitLoading ? '분석 중...' : '분석하기'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-[var(--foreground)]/70">
              분석을 하려면 로그인이 필요해요. 카카오로 시작하면 인증 후 바로 이용할 수 있어요.
            </p>
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-4 py-3.5 font-semibold text-[#191919] hover:bg-[#FADA0A] transition-colors"
            >
              카카오로 시작하기
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-[var(--surface)] px-2 text-[var(--foreground)]/60">또는</span>
              </div>
            </div>
            <Link
              href="/login?next=/husband-match/capture"
              className="block w-full py-3 rounded-xl border border-[var(--border)] text-center font-medium text-[var(--foreground)] hover:bg-[var(--border)]/30 transition-colors"
            >
              이메일로 로그인
            </Link>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/husband-match/onboarding"
            className="text-sm text-[var(--foreground)]/60 hover:underline"
          >
            ← 시작 화면으로
          </Link>
        </div>
      </div>
    </div>
  );
}
