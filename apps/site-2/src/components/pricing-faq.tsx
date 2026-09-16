"use client";

import { useState } from "react";

export function PricingFaq({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="divide-y divide-[var(--s2-line)] border-y border-[var(--s2-line)]">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q} className="py-5">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 rounded-[var(--s2-input-radius)] text-left text-[var(--s2-ink)]"
            >
              <span className="text-[16px] font-semibold">{item.q}</span>
              <span
                aria-hidden
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-all duration-300 ${
                  open
                    ? "rotate-45 border-[var(--s2-accent)] bg-[var(--s2-accent)] text-[var(--s2-accent-ink)]"
                    : "border-[var(--s2-line)] text-[var(--s2-muted)]"
                }`}
              >
                +
              </span>
            </button>
            {open ? (
              <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
                {item.a}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
