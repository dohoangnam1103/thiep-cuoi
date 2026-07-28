import { getRequestConfig } from "next-intl/server";
import { generatedListingMessages } from "@/data/templates/generated-data";
import { routing } from "./routing";

export default getRequestConfig(async () => {
  const { default: messages } = await import("../../messages/vi.json");

  return {
    locale: routing.defaultLocale,
    messages: {
      ...messages,
      listing: {
        ...messages.listing,
        templates: {
          ...messages.listing.templates,
          ...generatedListingMessages.vi,
        },
      },
    },
  };
});
