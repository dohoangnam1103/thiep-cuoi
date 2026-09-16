import { LayoutTemplate, PenLine, Send } from "lucide-react";

import { Glass } from "../../ui/glass";
import { RevealGroup, RevealItem } from "../../motion/reveal";
import vi from "@messages/vi.json";

const STEP_ICONS = [LayoutTemplate, PenLine, Send] as const;

/* Three creation steps as glass cards with Lucide icons. Stagger reveal on
 * scroll. Copy from i18n catalog. */
export function HomeSteps() {
  return (
    <section className="py-16 md:py-24">
      <h2 className="s2-display max-w-[16ch] text-3xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
        {vi.home.stepsTitle}
      </h2>
      <RevealGroup className="mt-10 grid gap-6 md:grid-cols-3">
        {vi.home.steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? PenLine;
          return (
            <RevealItem key={step.title}>
              <Glass variant="default" sheen className="h-full p-6 md:p-8">
                <span className="flex size-12 items-center justify-center rounded-full border border-[var(--s2-line)] bg-[var(--s2-surface)] text-[var(--s2-accent)]">
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-[var(--s2-ink)]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[38ch] text-[15px] leading-relaxed text-[var(--s2-muted)]">
                  {step.body}
                </p>
              </Glass>
            </RevealItem>
          );
        })}
      </RevealGroup>
    </section>
  );
}
