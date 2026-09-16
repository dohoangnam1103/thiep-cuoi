"use client";

import Image from "next/image";
import { useActionState } from "react";

import { site2Login, site2Signup } from "../../auth-actions";
import vi from "@messages/vi.json";

/* Google OAuth stays out of core launch: no button renders unless a
 * site-2-gated provider component is added once callbacks and credentials
 * exist. Email and password remain the only path here. */
export default function Site2AuthForm({
  mode,
  next,
  sideImage,
}: {
  mode: "login" | "register";
  next?: string;
  sideImage?: string;
}) {
  const action = mode === "register" ? site2Signup : site2Login;
  const [state, formAction, pending] = useActionState(action, undefined);
  const isRegister = mode === "register";

  return (
    <div className="s2-marketing-container grid gap-0 py-10 md:py-14 lg:grid-cols-2 lg:gap-12">
      <div className="s2-hero-enter mx-auto w-full max-w-sm lg:mx-0 lg:max-w-md lg:py-8">
        <h1 className="s2-display text-4xl font-semibold tracking-tight text-[var(--s2-ink)] md:text-5xl">
          {isRegister ? vi.auth.registerTitle : vi.auth.loginTitle}
        </h1>
        <form action={formAction} className="mt-8 flex flex-col gap-5">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="site2-email"
              className="text-[14px] font-semibold text-[var(--s2-ink)]"
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
              className="rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-3 text-base outline-none transition-colors duration-200 placeholder:text-[var(--s2-muted)] focus:border-[var(--s2-accent)] focus:ring-2 focus:ring-[var(--s2-accent-soft)]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label
              htmlFor="site2-password"
              className="text-[14px] font-semibold text-[var(--s2-ink)]"
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
              className="rounded-[var(--s2-input-radius)] border border-[var(--s2-line)] bg-[var(--s2-surface)] px-4 py-3 text-base outline-none transition-colors duration-200 placeholder:text-[var(--s2-muted)] focus:border-[var(--s2-accent)] focus:ring-2 focus:ring-[var(--s2-accent-soft)]"
            />
          </div>
          {state?.error ? (
            <p role="alert" className="text-[14px] font-medium text-[var(--s2-danger)]">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--s2-accent)] px-6 py-3 text-[15px] font-semibold text-[var(--s2-accent-ink)] transition-all duration-300 hover:bg-[color-mix(in_oklab,var(--s2-accent)_88%,#0e1a12)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100"
          >
            {pending
              ? vi.auth.pendingCta
              : isRegister
                ? vi.auth.registerCta
                : vi.auth.loginCta}
          </button>
        </form>
        <p className="mt-6 text-center text-[14px] text-[var(--s2-muted)] lg:text-left">
          <a
            href={
              next
                ? `/dang-nhap?mode=${isRegister ? "login" : "register"}&next=${encodeURIComponent(next)}`
                : `/dang-nhap${isRegister ? "" : "?mode=register"}`
            }
            className="font-semibold text-[var(--s2-accent)]"
          >
            {isRegister ? vi.auth.toLogin : vi.auth.toRegister}
          </a>
        </p>
      </div>
      {sideImage ? (
        <aside
          aria-hidden="true"
          className="s2-hero-enter-late relative hidden min-h-[560px] overflow-hidden rounded-[var(--s2-card-radius)] border border-[var(--s2-line)] lg:block"
        >
          <Image
            src={sideImage}
            alt=""
            fill
            loading="lazy"
            decoding="async"
            sizes="(min-width: 1024px) 44vw, 0px"
            className="object-cover object-top"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 p-8">
            <p className="s2-display text-3xl font-semibold tracking-tight text-white">
              {vi.auth.sideTitle}
            </p>
            <p className="mt-2 max-w-[40ch] text-[15px] leading-relaxed text-white/85">
              {vi.auth.sideBody}
            </p>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
