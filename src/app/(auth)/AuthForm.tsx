"use client";

import Link from "next/link";
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

      <form action="/api/auth/signin/google" method="get" className="mt-6">
        <input type="hidden" name="callbackUrl" value="/api/auth/google/complete" />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-3 rounded-full border border-input bg-background px-4 py-2.5 font-semibold text-foreground shadow-sm transition hover:bg-muted"
        >
          <span className="flex size-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285f4]">
            G
          </span>
          {isLogin ? copy.loginWithGoogle : copy.signupWithGoogle}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>{copy.or}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
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
