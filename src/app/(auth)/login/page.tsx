import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { AuthForm } from "../AuthForm";
import { login } from "../actions";
import { authCopy } from "../auth-copy";

type LoginPageProps = {
  searchParams: Promise<{ authError?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const { authError, error } = await searchParams;
  const oauthError = authError === "google" || error ? authCopy.oauthError : undefined;

  return <AuthForm mode="login" action={login} copy={authCopy} oauthError={oauthError} />;
}
