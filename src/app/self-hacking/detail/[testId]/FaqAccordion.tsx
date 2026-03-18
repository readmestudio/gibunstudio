"use client";

import { useState } from "react";

interface FaqAccordionProps {
  items: { q: string; a: string }[];
}

export default function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y-2 divide-[var(--foreground)] border-2 border-[var(--foreground)] rounded-2xl overflow-hidden">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
            >
              <span>Q. {item.q}</span>
              <span className="ml-2 flex-shrink-0 text-lg">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="px-5 pb-4 text-sm leading-relaxed text-[var(--foreground)]/70">
                {item.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
