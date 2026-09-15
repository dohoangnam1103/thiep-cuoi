import { redirect } from "next/navigation";

import { getCatalogTemplates } from "../../../lib/catalog";
import { getSite2Session } from "../../../lib/session";
import { templatePreviewUrl } from "../../../lib/template-preview";
import Site2AuthForm from "./auth-form";

export default async function Site2LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const session = await getSite2Session();
  if (session) {
    redirect("/dashboard");
  }
  const { mode } = await searchParams;
  const showcase = getCatalogTemplates()[20] ?? getCatalogTemplates()[0];
  return (
    <Site2AuthForm
      mode={mode === "register" ? "register" : "login"}
      sideImage={templatePreviewUrl(showcase.listing)}
      sideImageAlt={showcase.name}
    />
  );
}
