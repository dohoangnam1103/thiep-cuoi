import { redirect } from "next/navigation";

import { getAnonymousSessionUserId } from "@/lib/auth/anonymous-account";
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
    // An anonymous session must still reach this form. Bouncing it to /dashboard
    // is what locks a visitor into their cookie-only account: they can never
    // attach an email, so a paid invitation dies with the cookie.
    const anonymousUserId = await getAnonymousSessionUserId();
    if (!anonymousUserId) {
      redirect("/dashboard");
    }
  }

  const { authError, error, next } = await searchParams;
  const oauthError = authError === "google" || authError === "facebook" || error ? authCopy.oauthError : undefined;
  const nextPath = safeAuthReturnPath(next);

  return <AuthForm copy={authCopy} nextPath={nextPath} oauthError={oauthError} />;
}
