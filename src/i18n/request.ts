import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  const { default: messages } = await import("../../messages/vi.json");

  return {
    locale: routing.defaultLocale,
    messages,
  };
});
