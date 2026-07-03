import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { AuthForm } from "../AuthForm";
import { login } from "../actions";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
  return <AuthForm mode="login" action={login} />;
}
