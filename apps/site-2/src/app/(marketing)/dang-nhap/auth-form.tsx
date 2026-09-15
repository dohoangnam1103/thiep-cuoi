"use client";

import { useActionState } from "react";

import { site2Login, site2Signup } from "../../auth-actions";
import vi from "@messages/vi.json";

export default function Site2AuthForm({
  mode,
  sideImage,
  sideImageAlt,
}: {
  mode: "login" | "register";
  sideImage: string;
  sideImageAlt: string;
}) {
  const action = mode === "register" ? site2Signup : site2Login;
  const [state, formAction, pending] = useActionState(action, undefined);
  const isRegister = mode === "register";

  return (
    <div className="mx-auto grid max-w-6xl gap-0 px-4 py-10 sm:px-6 md:py-14 lg:grid-cols-2 lg:gap-12">
      <div className="mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md lg:py-8">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
          {isRegister ? vi.auth.registerTitle : vi.auth.loginTitle}
        </h1>
        <form action={formAction} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="site2-email"
              className="text-[14px] font-semibold"
            >
              {vi.auth.email}
            </label>
            <input
              id="site2-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ban@example.com"
              className="rounded-[var(--radius-input)] border border-[var(--line)] bg-white px-4 py-3 text-[15px] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="site2-password"
              className="text-[14px] font-semibold"
            >
              {vi.auth.password}
            </label>
            <input
              id="site2-password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={isRegister ? "new-password" : "current-password"}
              className="rounded-[var(--radius-input)] border border-[var(--line)] bg-white px-4 py-3 text-[15px] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
          </div>
          {state?.error ? (
            <p role="alert" className="text-[14px] font-medium text-red-700">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-[var(--radius-pill)] bg-[var(--accent)] px-6 py-3 text-[15px] font-semibold text-[var(--accent-ink)] transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {isRegister ? vi.auth.registerCta : vi.auth.loginCta}
          </button>
        </form>
        <p className="mt-6 text-center text-[14px] text-[var(--muted)] lg:text-left">
          <a
            href={isRegister ? "/dang-nhap" : "/dang-nhap?mode=register"}
            className="font-semibold text-[var(--accent)]"
          >
            {isRegister ? vi.auth.toLogin : vi.auth.toRegister}
          </a>
        </p>
      </div>
      <aside
        aria-hidden="true"
        className="relative hidden min-h-[560px] overflow-hidden rounded-[var(--radius-card)] lg:block"
      >
        <img
          src={sideImage}
          alt={sideImageAlt}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-8">
          <p className="text-2xl font-extrabold tracking-tight text-white">
            {vi.auth.sideTitle}
          </p>
          <p className="mt-2 max-w-[40ch] text-[15px] leading-relaxed text-white/85">
            {vi.auth.sideBody}
          </p>
        </div>
      </aside>
    </div>
  );
}
