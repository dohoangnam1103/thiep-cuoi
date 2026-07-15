"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useActionState } from "react";

import type { AuthCopy } from "./auth-copy";
import type { AuthState } from "./actions";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  copy: AuthCopy;
  oauthError?: string;
};

export function AuthForm({ mode, action, copy, oauthError }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow">
      <h1 className="text-center font-heading text-3xl text-foreground">
        {isLogin ? copy.loginTitle : copy.signupTitle}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {isLogin ? copy.loginSubtitle : copy.signupSubtitle}
      </p>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/auth/google/complete" })}
          data-ga-event={isLogin ? "login_attempt" : "sign_up_attempt"}
          data-ga-param-method="google"
          className="flex w-full items-center justify-center gap-3 rounded-full border border-input bg-background px-4 py-2.5 font-semibold text-foreground shadow-sm transition hover:bg-muted"
        >
          <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
            />
            <path
              fill="#34A853"
              d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
            />
            <path
              fill="#FBBC05"
              d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"
            />
            <path
              fill="#EA4335"
              d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
            />
          </svg>
          {isLogin ? copy.loginWithGoogle : copy.signupWithGoogle}
        </button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>{copy.or}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form
        action={formAction}
        data-ga-event={isLogin ? "login_attempt" : "sign_up_attempt"}
        data-ga-param-method="email"
        className="space-y-4"
      >
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
            {copy.email}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-foreground">
            {copy.password}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-foreground outline-none transition focus:ring-2 focus:ring-ring"
          />
        </div>

        {oauthError ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{oauthError}</p>
        ) : null}
        {state?.error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-primary px-4 py-2.5 font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? copy.pending : isLogin ? copy.loginSubmit : copy.signupSubmit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            {copy.noAccount} {" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {copy.signupSubmit}
            </Link>
          </>
        ) : (
          <>
            {copy.haveAccount} {" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {copy.loginSubmit}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
