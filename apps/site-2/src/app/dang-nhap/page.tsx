import { redirect } from "next/navigation";

import { getSite2Session } from "../../lib/session";
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
  return <Site2AuthForm mode={mode === "register" ? "register" : "login"} />;
}
