import { redirect } from "next/navigation";

import { getVisibleCatalogTemplates } from "../../../lib/catalog";
import { getSite2Session } from "../../../lib/session";
import { templatePreviewUrl } from "../../../lib/template-preview";
import Site2AuthForm from "./auth-form";

export default async function Site2LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const { mode, next } = await searchParams;
  const session = await getSite2Session();
  if (session) {
    redirect(next && next.startsWith("/") ? next : "/dashboard");
  }
  const visible = await getVisibleCatalogTemplates();
  const showcase = visible[20] ?? visible[0];
  return (
    <Site2AuthForm
      mode={mode === "register" ? "register" : "login"}
      next={next && next.startsWith("/") && !next.startsWith("//") ? next : undefined}
      sideImage={showcase ? templatePreviewUrl(showcase.listing) : undefined}
    />
  );
}
