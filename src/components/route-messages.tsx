import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import { selectMessages } from "@/i18n/message-scopes";

/** Select on the server: omitted catalog sections never enter the RSC payload. */
export async function RouteMessages({ children, namespaces }: {
  children: React.ReactNode;
  namespaces?: readonly string[];
}) {
  const messages = await getMessages({ locale: "vi" });
  return (
    <NextIntlClientProvider locale="vi" messages={namespaces ? selectMessages(messages, namespaces) : messages}>
      {children}
    </NextIntlClientProvider>
  );
}
