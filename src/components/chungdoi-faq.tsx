"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

import { parseFaqAnswer } from "@/lib/faq-answer";
import { sectionPaddingClass } from "@/lib/section-spacing";
import { blockTitleClass, bodyClass, sectionTitleClass } from "@/lib/typography";

const faqKeys = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q10"] as const;

export function WeddingFaqSection({ animated = false, id }: { animated?: boolean; id?: string }) {
  const t = useTranslations("home");

  return (
    <section id={id} className={`bg-secondary ${sectionPaddingClass}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2
          className={`${animated ? "reveal " : ""}text-center ${sectionTitleClass} text-foreground`}
        >
          {t("faq.heading")}
        </h2>
        <div
          className={`${animated ? "reveal " : ""}mt-10 divide-y divide-border overflow-hidden rounded-[2rem] border border-border bg-card`}
        >
          {faqKeys.map((key) => (
            <details key={key} className="group p-6">
              <summary className={`flex cursor-pointer list-none items-center justify-between gap-5 ${blockTitleClass} text-foreground`}>
                {t(`faq.${key}Q`)}
                <ChevronDown className="size-5 shrink-0 text-primary transition group-open:rotate-180" />
              </summary>
              <div className={`mt-4 space-y-4 ${bodyClass} text-muted-foreground`}>
                {parseFaqAnswer(t(`faq.${key}A`)).map((block, index) =>
                  block.type === "list" ? (
                    <ul key={index} className="list-disc space-y-1 pl-5">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p key={index}>{block.text}</p>
                  ),
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
