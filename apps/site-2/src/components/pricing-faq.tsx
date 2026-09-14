"use client";

import { useState } from "react";

export function PricingFaq({
  items,
}: {
  items: { q: string; a: string }[];
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  return (
    <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {items.map((item, index) => {
        const open = openIndex === index;
        return (
          <div key={item.q} className="py-5">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : index)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 text-left"
            >
              <span className="text-[16px] font-bold">{item.q}</span>
              <span
                aria-hidden
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--line)] text-lg leading-none transition-transform ${open ? "rotate-45" : ""}`}
              >
                +
              </span>
            </button>
            {open ? (
              <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-[var(--muted)]">
                {item.a}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
