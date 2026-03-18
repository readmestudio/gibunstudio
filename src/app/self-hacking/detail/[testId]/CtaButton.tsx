"use client";

import Link from "next/link";

interface CtaButtonProps {
  href: string;
  label: string;
}

export default function CtaButton({ href, label }: CtaButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[var(--foreground)] px-4 py-4">
      <div className="mx-auto max-w-2xl">
        <Link
          href={href}
          className="block w-full rounded-xl bg-[var(--foreground)] py-4 text-center text-base font-bold text-white transition-opacity hover:opacity-90"
        >
          {label}
        </Link>
      </div>
    </div>
  );
}
