"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthState } from "./actions";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
};

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow">
      <h1 className="text-center font-heading text-3xl text-foreground">
        {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {isLogin ? "Chào mừng bạn quay lại Thiệp Mừng Online" : "Bắt đầu tạo thiệp cưới của bạn"}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
            Email
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
            Mật khẩu
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

        {state?.error ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-primary px-4 py-2.5 font-bold text-primary-foreground shadow-lg transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              Đăng ký
            </Link>
          </>
        ) : (
          <>
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Đăng nhập
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
