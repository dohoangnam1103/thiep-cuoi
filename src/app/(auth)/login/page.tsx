import { redirect } from "next/navigation";

import { safeAuthReturnPath } from "@/lib/auth-redirects";
import { getSession } from "@/lib/session";
import { AuthForm } from "../AuthForm";
import { authCopy } from "../auth-copy";

type LoginPageProps = {
  searchParams: Promise<{ authError?: string; error?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const { authError, error, next } = await searchParams;
  const oauthError = authError === "google" || authError === "facebook" || error ? authCopy.oauthError : undefined;
  const nextPath = safeAuthReturnPath(next);

  return <AuthForm copy={authCopy} nextPath={nextPath} oauthError={oauthError} />;
}
