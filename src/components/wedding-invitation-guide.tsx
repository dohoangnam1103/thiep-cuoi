import {
  BookHeart,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Gift,
  HeartHandshake,
  Images,
  ListOrdered,
  MailOpen,
  MessageSquareHeart,
  Music2,
  Sparkles,
  UserRound,
  UsersRound,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { SiteFooter, SiteHeader } from "@/components/chungdoi-chrome";
import { WeddingGuideVideo } from "@/components/wedding-guide-video";
import { getVietnameseTemplateSlug } from "@/data/chungdoi";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

const guideSteps = [
  {
    key: "step1",
    image: "/thiepmungonline/wedding-guide/chon-mau-thiep-tmo.webp",
    width: 1170,
    height: 2532,
  },
  {
    key: "step2",
    image: "/thiepmungonline/wedding-guide/chinh-sua-thiep-tmo.webp",
    width: 1170,
    height: 1700,
  },
  {
    key: "step3",
    image: "/thiepmungonline/wedding-guide/album-anh-tmo.webp",
    width: 1170,
    height: 899,
  },
  {
    key: "step4",
    image: "/thiepmungonline/wedding-guide/xem-truoc-thiep-tmo.webp",
    width: 2320,
    height: 1215,
  },
  {
    key: "step5",
    image: "/thiepmungonline/wedding-guide/quan-ly-khach-moi-tmo.webp",
    width: 1744,
    height: 913,
  },
  {
    key: "step6",
    image: "/thiepmungonline/wedding-guide/theo-doi-rsvp-tmo.webp",
    width: 2546,
    height: 1333,
  },
  {
    key: "step7",
    image: "/thiepmungonline/wedding-guide/thanh-toan-tmo.webp",
    width: 2045,
    height: 1071,
  },
] as const;

const featuredTemplates = [
  {
    key: "template1",
    slug: "double-dragon-red",
    image: "/chungdoi/images/template-previews/en/portrait/double_dragon_red.webp",
  },
  {
    key: "template2",
    slug: "spring-garden-green",
    image: "/chungdoi/images/template-previews/en/portrait/spring_garden_green.webp",
  },
  {
    key: "template3",
    slug: "cherry-blossom-pink",
    image: "/chungdoi/images/template-previews/en/portrait/cherry_blossom_pink.webp",
  },
  {
    key: "template4",
    slug: "dragon-phoenix-red",
    image: "/chungdoi/images/template-previews/en/portrait/dragon_phoenix_red.webp",
  },
] as const;

type Feature = {
  key: string;
  icon: LucideIcon;
  tags: readonly string[];
};

const features: readonly Feature[] = [
  { key: "couple", icon: UserRound, tags: ["tag1", "tag2", "tag3"] },
  { key: "family", icon: UsersRound, tags: ["tag1", "tag2", "tag3"] },
  { key: "ceremony", icon: HeartHandshake, tags: ["tag1", "tag2", "tag3", "tag4"] },
  { key: "reception", icon: Utensils, tags: ["tag1", "tag2", "tag3", "tag4", "tag5"] },
  { key: "timeline", icon: ListOrdered, tags: ["tag1", "tag2", "tag3", "tag4"] },
  { key: "calendar", icon: CalendarClock, tags: ["tag1", "tag2", "tag3"] },
  { key: "album", icon: Images, tags: ["tag1"] },
  { key: "rsvp", icon: ClipboardCheck, tags: ["tag1", "tag2"] },
  { key: "guestbook", icon: BookHeart, tags: ["tag1"] },
  { key: "gift", icon: Gift, tags: ["tag1", "tag2", "tag3", "tag4"] },
  { key: "thanks", icon: MessageSquareHeart, tags: ["tag1"] },
  { key: "envelope", icon: MailOpen, tags: ["tag1", "tag2", "tag3"] },
  { key: "music", icon: Music2, tags: ["tag1"] },
];

const faqKeys = ["faq1", "faq2", "faq3", "faq4", "faq5", "faq6", "faq7", "faq8"] as const;

export async function WeddingInvitationGuide({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "weddingGuide" });

  return (
    <main className="font-app-sans min-h-screen bg-background text-foreground">
      <SiteHeader />

      <article>
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10 lg:px-0 lg:pb-24">
            <nav aria-label={t("breadcrumbLabel")} className="mb-10 flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/" className="transition hover:text-foreground">
                {t("breadcrumbHome")}
              </Link>
              <span aria-hidden>/</span>
              <span className="text-foreground">{t("breadcrumbCurrent")}</span>
            </nav>

            <div className="grid items-center gap-12 lg:grid-cols-[1fr_17.5rem] lg:gap-16">
              <div className="text-center lg:text-left">
                <h1 className="font-heading text-4xl font-black leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem]">
                  {t("hero.title")}
                </h1>
                <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground lg:mx-0">
                  {t("hero.description")}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
                  {["badge1", "badge2", "badge3", "badge4"].map((key) => (
                    <span
                      key={key}
                      className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-sm font-medium text-foreground"
                    >
                      <CheckCircle2 className="size-4 fill-primary text-primary-foreground" />
                      {t(`hero.${key}`)}
                    </span>
                  ))}
                </div>
                <Link
                  href="/templates"
                  className="demo-shine relative mt-7 inline-flex items-center justify-center overflow-hidden rounded-xl bg-primary px-6 py-3.5 text-base font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  {t("hero.cta")}
                </Link>
              </div>

              <div className="mx-auto aspect-[9/16] w-full max-w-[17.5rem] overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-[0_20px_60px_rgb(0_0_0/0.14)]">
                <WeddingGuideVideo title={t("hero.videoTitle")} />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-0">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-black text-foreground sm:text-4xl">{t("steps.title")}</h2>
              <p className="mt-3 text-muted-foreground">{t("steps.description")}</p>
            </div>

            <ol className="mt-12 space-y-14 sm:space-y-16">
              {guideSteps.map((step, index) => {
                const reverse = index % 2 === 1;
                return (
                  <li key={step.key} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-10">
                    <div className={reverse ? "lg:order-2" : undefined}>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground shadow-md shadow-primary/25">
                          {index + 1}
                        </span>
                        <h3 className="font-heading text-2xl font-black text-foreground sm:text-3xl">
                          {t(`steps.${step.key}.title`)}
                        </h3>
                      </div>
                      <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                        {t(`steps.${step.key}.description`)}
                      </p>
                    </div>
                    <div className={reverse ? "lg:order-1" : undefined}>
                      <Image
                        src={step.image}
                        alt={t(`steps.${step.key}.alt`)}
                        width={step.width}
                        height={step.height}
                        sizes="(min-width: 1024px) 476px, calc(100vw - 32px)"
                        className="h-auto w-full rounded-2xl border border-border shadow-[0_16px_50px_rgb(0_0_0/0.1)]"
                      />
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <section className="bg-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-0">
            <h2 className="font-heading text-3xl font-black text-foreground sm:text-4xl">{t("templates.title")}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("templates.description")}</p>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {featuredTemplates.map((template) => {
                const routeSlug = locale === "vi" ? getVietnameseTemplateSlug(template.slug) : template.slug;
                return (
                  <Link
                    key={template.key}
                    href={{ pathname: "/templates/[slug]", params: { slug: routeSlug } }}
                    className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
                  >
                    <Image
                      src={template.image}
                      alt={t(`templates.${template.key}`)}
                      width={750}
                      height={1333}
                      sizes="(min-width: 1024px) 202px, 45vw"
                      className="aspect-[9/16] w-full object-cover object-top transition duration-500 group-hover:scale-[1.02]"
                    />
                    <p className="px-3 py-3 text-center text-sm font-bold text-foreground">
                      {t(`templates.${template.key}`)}
                    </p>
                  </Link>
                );
              })}
            </div>
            <Link
              href="/templates"
              className="mt-9 inline-flex rounded-xl border border-primary px-5 py-3 text-sm font-black text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              {t("templates.cta")}
            </Link>
          </div>
        </section>

        <section className="bg-background py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-0">
            <div className="text-center">
              <h2 className="font-heading text-3xl font-black text-foreground sm:text-4xl">{t("features.title")}</h2>
              <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("features.description")}</p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {features.map(({ key, icon: Icon, tags }) => (
                <article key={key} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-xl font-black text-foreground">{t(`features.${key}.title`)}</h3>
                      <p className="mt-2 leading-6 text-muted-foreground">{t(`features.${key}.description`)}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-foreground">
                        {t(`features.${key}.${tag}`)}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-0">
            <h2 className="text-center font-heading text-3xl font-black text-foreground sm:text-4xl">{t("faq.title")}</h2>
            <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
              {faqKeys.map((key) => (
                <details key={key} className="group p-5 sm:p-6">
                  <summary className="flex list-none items-center justify-between gap-5 font-bold text-foreground">
                    {t(`faq.${key}.question`)}
                    <ChevronDown className="size-5 shrink-0 text-primary transition group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 leading-7 text-muted-foreground">{t(`faq.${key}.answer`)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background py-12">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-0">
            <Link
              href="/tools"
              className="group block rounded-2xl border border-primary/25 bg-primary/5 p-6 transition hover:border-primary/50 hover:bg-primary/10 sm:p-8"
            >
              <p className="text-sm font-bold text-primary">{t("next.eyebrow")}</p>
              <div className="mt-2 flex items-start justify-between gap-5">
                <div>
                  <h2 className="font-heading text-2xl font-black text-foreground">{t("next.title")}</h2>
                  <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{t("next.description")}</p>
                </div>
                <Sparkles className="mt-1 size-6 shrink-0 text-primary transition group-hover:rotate-12 group-hover:scale-110" />
              </div>
            </Link>
          </div>
        </section>

        <section className="bg-background pb-16 sm:pb-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-0">
            <h2 className="font-heading text-2xl font-black text-foreground">{t("resources.title")}</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Link
                href={{ pathname: "/blog/[slug]", params: { slug: "lich-trinh-ngay-cuoi" } }}
                className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <h3 className="font-heading text-lg font-black text-foreground">{t("resources.item1Title")}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("resources.item1Description")}</p>
              </Link>
              <Link
                href="/tools"
                className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <h3 className="font-heading text-lg font-black text-foreground">{t("resources.item2Title")}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("resources.item2Description")}</p>
              </Link>
              <Link
                href="/blog"
                className="rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <h3 className="font-heading text-lg font-black text-foreground">{t("resources.item3Title")}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("resources.item3Description")}</p>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-secondary py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="font-heading text-3xl font-black text-foreground sm:text-4xl">{t("finalCta.title")}</h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">{t("finalCta.description")}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/templates"
                className="demo-shine relative inline-flex justify-center overflow-hidden rounded-xl bg-primary px-7 py-3.5 font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90"
              >
                {t("finalCta.primary")}
              </Link>
              <Link
                href="/pricing"
                className="inline-flex justify-center rounded-xl border border-border bg-background px-7 py-3.5 font-black text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {t("finalCta.secondary")}
              </Link>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="size-4 text-primary" /> {t("finalCta.note")}
            </p>
          </div>
        </section>
      </article>

      <SiteFooter />
    </main>
  );
}
