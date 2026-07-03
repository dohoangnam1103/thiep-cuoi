import { useTranslations } from "next-intl";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";

type PolicyKind = "privacy" | "terms" | "refund";

const SECTION_KEYS: Record<PolicyKind, { titleKey: string; sections: Array<[string, string]> }> = {
  privacy: {
    titleKey: "privacyTitle",
    sections: [
      ["privacyS1H", "privacyS1B"],
      ["privacyS2H", "privacyS2B"],
      ["privacyS3H", "privacyS3B"],
      ["privacyS4H", "privacyS4B"],
    ],
  },
  terms: {
    titleKey: "termsTitle",
    sections: [
      ["termsS1H", "termsS1B"],
      ["termsS2H", "termsS2B"],
      ["termsS3H", "termsS3B"],
      ["termsS4H", "termsS4B"],
    ],
  },
  refund: {
    titleKey: "refundTitle",
    sections: [
      ["refundS1H", "refundS1B"],
      ["refundS2H", "refundS2B"],
      ["refundS3H", "refundS3B"],
    ],
  },
};

export function ChungDoiPolicy({ kind }: { kind: PolicyKind }) {
  const t = useTranslations("policy");
  const config = SECTION_KEYS[kind];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <section className="border-b border-border bg-secondary py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl">{t(config.titleKey)}</h1>
          <p className="mt-4 text-sm text-muted-foreground">{t("updated")}</p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {config.sections.map(([headingKey, bodyKey], index) => (
              <div key={headingKey}>
                <h2 className="flex items-start gap-3 font-heading text-xl font-black text-foreground sm:text-2xl">
                  <span className="mt-0.5 text-accent">{index + 1}.</span>
                  {t(headingKey)}
                </h2>
                <p className="mt-3 pl-7 text-base leading-8 text-muted-foreground">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
