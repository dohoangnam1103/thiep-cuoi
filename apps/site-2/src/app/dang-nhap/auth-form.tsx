"use client";

import { useActionState } from "react";

import { site2Login, site2Signup } from "../auth-actions";
import vi from "@messages/vi.json";

export default function Site2AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "register" ? site2Signup : site2Login;
  const [state, formAction, pending] = useActionState(action, undefined);
  const isRegister = mode === "register";

  return (
    <div className="mx-auto max-w-sm px-4 pb-16 pt-16">
      <h1 className="text-center text-2xl font-bold">
        {isRegister ? vi.auth.registerTitle : vi.auth.loginTitle}
      </h1>
      <form action={formAction} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {vi.auth.email}
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-lg border border-[#e5dcc8] bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {vi.auth.password}
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="rounded-lg border border-[#e5dcc8] bg-white px-3 py-2"
          />
        </label>
        {state?.error ? (
          <p role="alert" className="text-sm text-red-700">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#9a6a42] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isRegister ? vi.auth.registerCta : vi.auth.loginCta}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <a
          href={isRegister ? "/dang-nhap" : "/dang-nhap?mode=register"}
          className="font-semibold underline"
        >
          {isRegister ? vi.auth.toLogin : vi.auth.toRegister}
        </a>
      </p>
    </div>
  );
}
