import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const [{ default: fallbackMessages }, { default: localeMessages }] = await Promise.all([
    import("../../messages/en.json"),
    import(`../../messages/${locale}.json`),
  ]);

  return {
    locale,
    messages: { ...fallbackMessages, ...localeMessages },
  };
});
