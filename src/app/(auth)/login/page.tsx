import { redirect } from "next/navigation";

import { getAccountSessionUserId } from "@/lib/auth/anonymous-account";
import { safeAuthReturnPath } from "@/lib/auth-redirects";
import { AuthForm } from "../AuthForm";
import { authCopy } from "../auth-copy";

type LoginPageProps = {
  searchParams: Promise<{
    authError?: string;
    error?: string;
    next?: string;
    reason?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Only a session that already belongs to a real account has nothing to do
  // here. An anonymous session must still reach this form: bouncing it to
  // /dashboard is what locks a visitor into their cookie-only account, where
  // they can never attach an email and a paid invitation dies with the cookie.
  if (await getAccountSessionUserId()) {
    redirect("/dashboard");
  }

  const { authError, error, next, reason } = await searchParams;
  const oauthError = authError === "google" || authError === "facebook" || error ? authCopy.oauthError : undefined;
  const notice =
    reason === "checkout"
      ? authCopy.checkoutNotice
      : reason === "create"
        ? authCopy.createNotice
        : reason === "slideshow"
          ? authCopy.slideshowNotice
          : undefined;
  const nextPath = safeAuthReturnPath(next);

  return (
    <AuthForm
      copy={authCopy}
      nextPath={nextPath}
      notice={notice}
      oauthError={oauthError}
    />
  );
}
