'use client';

import { useRouter } from 'next/navigation';

export function GoBackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="block w-full py-4 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
    >
      다시 시도하기
    </button>
  );
}
