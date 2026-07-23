"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] as const;

export function WeddingFaqSection({ animated = false, id }: { animated?: boolean; id?: string }) {
  const t = useTranslations("home");

  return (
    <section id={id} className="bg-secondary py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2
          className={`${animated ? "reveal " : ""}text-center font-heading text-3xl font-black text-foreground sm:text-5xl`}
        >
          {t("faq.heading")}
        </h2>
        <div
          className={`${animated ? "reveal " : ""}mt-10 divide-y divide-border overflow-hidden rounded-[2rem] border border-border bg-card`}
        >
          {faqKeys.map((key) => (
            <details key={key} className="group p-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black text-foreground">
                {t(`faq.${key}Q`)}
                <ChevronDown className="size-5 shrink-0 text-primary transition group-open:rotate-180" />
              </summary>
              <p className="mt-4 leading-7 text-muted-foreground">{t(`faq.${key}A`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
