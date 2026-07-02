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
    <main className="min-h-screen bg-[#18120f] text-white">
      <SiteHeader />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_15%_-10%,rgba(251,53,112,0.22),transparent_40%)] py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl">{t(config.titleKey)}</h1>
          <p className="mt-4 text-sm text-zinc-400">{t("updated")}</p>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {config.sections.map(([headingKey, bodyKey], index) => (
              <div key={headingKey}>
                <h2 className="flex items-start gap-3 text-xl font-black text-white sm:text-2xl">
                  <span className="mt-0.5 text-[#ff8cad]">{index + 1}.</span>
                  {t(headingKey)}
                </h2>
                <p className="mt-3 pl-7 text-base leading-8 text-zinc-300">{t(bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
