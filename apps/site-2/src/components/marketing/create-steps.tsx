import { LayoutTemplate, PenLine, Send } from "lucide-react";

import { RevealGroup, RevealItem } from "../motion/reveal";
import vi from "@messages/vi.json";

const STEP_ICONS = [LayoutTemplate, PenLine, Send] as const;

/* Three creation steps on a progress track: one line, one icon per step,
 * copy from the catalog. No numerals, the track itself shows the order. */
export function CreateSteps() {
  return (
    <section className="py-16 md:py-24">
      <h2 className="s2-display max-w-[16ch] text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
        {vi.home.stepsTitle}
      </h2>
      <RevealGroup className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
        {vi.home.steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? PenLine;
          return (
            <RevealItem key={step.title} className="relative">
              <div
                aria-hidden
                className="absolute top-6 right-0 left-14 hidden h-px bg-[var(--s2-line)] md:block"
              />
              <span className="relative flex size-12 items-center justify-center rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] text-[var(--s2-accent)]">
                <Icon size={20} aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-[var(--s2-ink)]">
                {step.title}
              </h3>
              <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
                {step.body}
              </p>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
