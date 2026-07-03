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
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1c1512]/90 p-8 shadow-2xl">
      <h1 className="text-center font-pattaya text-3xl text-white">
        {isLogin ? "Đăng nhập" : "Tạo tài khoản"}
      </h1>
      <p className="mt-2 text-center text-sm text-zinc-400">
        {isLogin ? "Chào mừng bạn quay lại Thiệp Mừng Online" : "Bắt đầu tạo thiệp cưới của bạn"}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-200">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none transition focus:border-[#fb3570]"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-200">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none transition focus:border-[#fb3570]"
          />
        </div>

        {state?.error ? (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#fb3570] px-4 py-2.5 font-bold text-white shadow-lg shadow-[#fb3570]/25 transition hover:bg-[#ff4a82] disabled:opacity-60"
        >
          {pending ? "Đang xử lý..." : isLogin ? "Đăng nhập" : "Đăng ký"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-400">
        {isLogin ? (
          <>
            Chưa có tài khoản?{" "}
            <Link href="/signup" className="font-semibold text-[#fb3570] hover:underline">
              Đăng ký
            </Link>
          </>
        ) : (
          <>
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-[#fb3570] hover:underline">
              Đăng nhập
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
