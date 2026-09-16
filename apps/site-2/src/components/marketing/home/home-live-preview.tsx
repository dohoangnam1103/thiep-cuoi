"use client";

import { useState, useTransition } from "react";

import { Glass } from "../../ui/glass";
import vi from "@messages/vi.json";

/* Live typing preview: user enters couple names + date, sees them rendered
 * on a simplified invitation card in real time. Client-only — state is local,
 * no server round-trip. Debounced via React transition for smooth UX. */
export function HomeLivePreview() {
  const [bride, setBride] = useState("Mai Lan");
  const [groom, setGroom] = useState("Đức Minh");
  const [date, setDate] = useState("22.11.2026");
  const [isPending, startTransition] = useTransition();

  const updateField = (setter: (v: string) => void) => (value: string) => {
    startTransition(() => setter(value));
  };

  return (
    <section className="py-16 md:py-24">
      <div className="mb-10 max-w-[28ch]">
        <h2 className="s2-display text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
          {vi.home.livePreviewTitle}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--s2-muted)]">
          {vi.home.livePreviewSubtitle}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        {/* Input panel */}
        <Glass variant="default" className="space-y-5 p-6 md:p-8">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold tracking-wide text-[var(--s2-muted)] uppercase">
              {vi.home.livePreviewBrideLabel}
            </span>
            <input
              type="text"
              value={bride}
              onChange={(e) => updateField(setBride)(e.target.value)}
              className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-[15px] text-[var(--s2-ink)] outline-none transition-colors focus:border-[var(--s2-accent)]"
              maxLength={40}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold tracking-wide text-[var(--s2-muted)] uppercase">
              {vi.home.livePreviewGroomLabel}
            </span>
            <input
              type="text"
              value={groom}
              onChange={(e) => updateField(setGroom)(e.target.value)}
              className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-[15px] text-[var(--s2-ink)] outline-none transition-colors focus:border-[var(--s2-accent)]"
              maxLength={40}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold tracking-wide text-[var(--s2-muted)] uppercase">
              {vi.home.livePreviewDateLabel}
            </span>
            <input
              type="text"
              value={date}
              onChange={(e) => updateField(setDate)(e.target.value)}
              className="w-full rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-2.5 text-[15px] text-[var(--s2-ink)] outline-none transition-colors focus:border-[var(--s2-accent)]"
              maxLength={20}
            />
          </label>
        </Glass>

        {/* Preview card */}
        <Glass
          variant="strong"
          className={`flex min-h-[360px] flex-col items-center justify-center p-8 text-center transition-opacity ${isPending ? "opacity-80" : ""}`}
        >
          <p className="text-[13px] font-semibold tracking-[0.2em] text-[var(--s2-muted)] uppercase">
            Lễ Thành Hôn
          </p>
          <p className="s2-display mt-6 text-3xl font-semibold leading-tight text-[var(--s2-ink)] md:text-4xl">
            {bride || "…"}
            <span className="mx-3 inline-block text-[var(--s2-accent)]">&</span>
            {groom || "…"}
          </p>
          <div className="my-6 h-px w-16 bg-[var(--s2-line)]" />
          <p className="text-lg font-medium text-[var(--s2-muted)]">
            {date || "…"}
          </p>
          <p className="mt-8 text-[12px] text-[var(--s2-muted)] opacity-60">
            Preview chỉ mang tính minh hoạ
          </p>
        </Glass>
      </div>
    </section>
  );
}
