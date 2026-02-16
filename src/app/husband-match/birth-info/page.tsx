'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const YEARS = Array.from({ length: 60 }, (_, i) => 2010 - i); // 1951~2010
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export default function BirthInfoPage() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [month, setMonth] = useState<number | ''>('');
  const [day, setDay] = useState<number | ''>('');

  const isValid = userName.trim().length > 0 && year !== '' && month !== '' && day !== '';

  function handleSubmit() {
    if (!isValid) return;
    const birthInfo = {
      userName: userName.trim(),
      year: Number(year),
      month: Number(month),
      day: Number(day),
    };
    localStorage.setItem('birthInfo', JSON.stringify(birthInfo));
    router.push('/husband-match/capture');
  }

  const selectClass =
    'w-full py-3 px-4 rounded-xl bg-white text-[var(--foreground)] border-2 border-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] appearance-none cursor-pointer';

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            당신에 대해 알려주세요
          </h1>
          <p className="text-base text-[var(--foreground)]/70">
            맞춤 분석을 위해 간단한 정보를 입력해주세요
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border-2 border-[var(--foreground)] p-6 mb-6">
          {/* 이름 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              이름 또는 닉네임 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value.slice(0, 10))}
              placeholder="리포트에서 사용할 이름을 입력해주세요"
              className="w-full py-3 px-4 rounded-xl bg-white text-[var(--foreground)] border-2 border-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--foreground)] placeholder:text-[var(--foreground)]/40"
            />
          </div>

          {/* 생년 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              태어난 해 <span className="text-red-500">*</span>
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')}
              className={selectClass}
            >
              <option value="">선택하세요</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
          </div>

          {/* 생월 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              태어난 월 <span className="text-red-500">*</span>
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : '')}
              className={selectClass}
            >
              <option value="">선택하세요</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
          </div>

          {/* 생일 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
              태어난 일 <span className="text-red-500">*</span>
            </label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value ? Number(e.target.value) : '')}
              className={selectClass}
            >
              <option value="">선택하세요</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}일
                </option>
              ))}
            </select>
          </div>

          {/* 제출 버튼 */}
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className="block w-full text-center py-4 px-6 rounded-xl font-semibold text-lg border-2 border-[var(--foreground)] transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--foreground)] text-white hover:opacity-90"
          >
            다음으로
          </button>
        </div>
      </div>
    </div>
  );
}
