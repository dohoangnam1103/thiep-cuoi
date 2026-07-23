import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { loginHref, TEMPLATE_LIST_PATH } from "@/lib/auth-redirects";
import { getSession } from "@/lib/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function TemplatesLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect(loginHref(TEMPLATE_LIST_PATH));
  }

  return children;
}
