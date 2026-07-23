import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ChungDoiClone } from "@/components/chungdoi-clone";
import type { Locale } from "@/i18n/routing";
import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";
import { pageSeo, staticAlternates } from "@/lib/seo";
import { getSession } from "@/lib/session";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return pageSeo({
    title: t("title"),
    description: t("description"),
    alternates: staticAlternates("/", locale),
    image: "/chungdoi/images/en/banner_hero.webp",
  });
}

export default async function Home({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getSession();
  const createHref = session ? TEMPLATE_LIST_PATH : loginHref(TEMPLATE_LIST_PATH);

  return <ChungDoiClone createHref={createHref} isAuthenticated={Boolean(session)} />;
}
