import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { AuthForm } from "../AuthForm";
import { signup } from "../actions";

export default async function SignupPage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }
  return <AuthForm mode="signup" action={signup} />;
}
