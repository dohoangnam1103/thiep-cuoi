# Google SSO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google SSO to login and signup while preserving existing email/password accounts and invitations.

**Architecture:** Auth.js/NextAuth handles Google OAuth and provider session state. The existing app `session` cookie remains the authorization source for protected routes; a bridge route reads the Auth.js session, links or creates the local Prisma `User`, then calls `createSession(user.id)` and redirects to `/dashboard`.

**Tech Stack:** Next.js 16 App Router route handlers, React 19, TypeScript strict, Prisma 7 SQLite, Auth.js/NextAuth Google provider, existing `jose` local session cookie.

---

## File structure

- Modify `package.json` and `package-lock.json`: add the `next-auth` dependency.
- Create `src/auth.ts`: Auth.js configuration, Google provider, verified-email guard, exported route handlers and `auth()` helper.
- Create `src/app/api/auth/[...nextauth]/route.ts`: expose Auth.js `GET` and `POST` handlers under the App Router.
- Create `src/lib/auth/google-user.ts`: small data-access helper that finds or creates a local `User` by Google email.
- Create `scripts/verify-google-user-linking.mjs`: focused verification script for account linking without adding a test runner.
- Create `src/app/api/auth/google/complete/route.ts`: bridge Auth.js session to the existing app session cookie.
- Modify `src/app/(auth)/AuthForm.tsx`: render Google SSO button, existing credential form unchanged.
- Modify `src/app/(auth)/login/page.tsx`: read OAuth error from `searchParams` and pass it to `AuthForm`.
- Modify `src/app/(auth)/signup/page.tsx`: pass no OAuth error and keep current redirect behavior.
- Modify all `messages/*.json`: add `auth` messages for the Google button and generic OAuth error.

---

### Task 1: Add Auth.js dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install NextAuth**

Run:

```bash
npm install next-auth@beta
```

Expected: `package.json` includes `"next-auth"` in `dependencies` with a beta version compatible with Auth.js v5, and `package-lock.json` is updated.

- [ ] **Step 2: Verify install did not break TypeScript dependency resolution**

Run:

```bash
npm run typecheck
```

Expected: PASS or only pre-existing errors unrelated to `next-auth`. If there are pre-existing errors, record them before continuing and do not claim typecheck passes.

- [ ] **Step 3: Review dependency diff**

```bash
git diff -- package.json package-lock.json
```

Expected: diff only adds the Auth.js/NextAuth dependency and lockfile entries.

---

### Task 2: Add Auth.js configuration

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create Auth.js config**

Create `src/auth.ts`:

```ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

type GoogleProfile = {
  email?: string | null;
  email_verified?: boolean;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ profile }) {
      const googleProfile = profile as GoogleProfile | undefined;
      return Boolean(googleProfile?.email && googleProfile.email_verified === true);
    },
  },
});
```

- [ ] **Step 2: Expose Auth.js route handlers**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 3: Run typecheck to verify Auth.js API usage**

Run:

```bash
npm run typecheck
```

Expected: PASS. If it fails on exported names from `next-auth`, inspect the installed package types and update only `src/auth.ts` to match the installed Auth.js API.

- [ ] **Step 4: Review Auth.js config diff**

```bash
git diff -- src/auth.ts src/app/api/auth/[...nextauth]/route.ts
```

Expected: diff only adds Auth.js configuration and route handler exports.

---

### Task 3: Add and verify local Google user linking helper

**Files:**
- Create: `src/lib/auth/google-user.ts`
- Create: `scripts/verify-google-user-linking.mjs`

- [ ] **Step 1: Write the failing verification script**

Create `scripts/verify-google-user-linking.mjs`:

```js
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client.ts";

const dir = await mkdtemp(join(tmpdir(), "google-user-linking-"));
const dbUrl = `file:${join(dir, "test.db")}`;

const adapter = new PrismaBetterSqlite3({ url: dbUrl });
const prisma = new PrismaClient({ adapter });

try {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE User (
      id TEXT NOT NULL PRIMARY KEY,
      email TEXT UNIQUE,
      passwordHash TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const { findOrCreateGoogleUser } = await import(
    pathToFileURL(join(process.cwd(), "src/lib/auth/google-user.ts")).href
  );

  const existing = await prisma.user.create({
    data: { email: "couple@example.com", passwordHash: "hashed-password" },
  });

  const linked = await findOrCreateGoogleUser(prisma.user, "couple@example.com");
  if (linked.id !== existing.id) {
    throw new Error("Expected Google login to link the existing user by email");
  }
  if (linked.passwordHash !== "hashed-password") {
    throw new Error("Expected account linking to preserve the existing password hash");
  }

  const created = await findOrCreateGoogleUser(prisma.user, "new-couple@example.com");
  if (created.email !== "new-couple@example.com") {
    throw new Error("Expected Google login to create a user with the Google email");
  }
  if (created.passwordHash !== null) {
    throw new Error("Expected Google-created users to have no password hash");
  }

  const userCount = await prisma.user.count();
  if (userCount !== 2) {
    throw new Error(`Expected exactly 2 users, got ${userCount}`);
  }

  console.log("google user linking verified");
} finally {
  await prisma.$disconnect();
  await rm(dir, { recursive: true, force: true });
}
```

- [ ] **Step 2: Run script to verify it fails before helper exists**

Run:

```bash
npx tsx scripts/verify-google-user-linking.mjs
```

Expected: FAIL with a module-not-found error for `src/lib/auth/google-user.ts`.

- [ ] **Step 3: Implement the helper**

Create `src/lib/auth/google-user.ts`:

```ts
import type { PrismaClient, User } from "@/generated/prisma/client";

type UserClient = Pick<PrismaClient["user"], "findUnique" | "create">;

export async function findOrCreateGoogleUser(userClient: UserClient, email: string): Promise<User> {
  const existing = await userClient.findUnique({ where: { email } });
  if (existing) return existing;

  return userClient.create({
    data: {
      email,
      passwordHash: null,
    },
  });
}
```

- [ ] **Step 4: Run script to verify helper behavior**

Run:

```bash
npx tsx scripts/verify-google-user-linking.mjs
```

Expected: PASS and prints `google user linking verified`.

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Review helper and verification diff**

```bash
git diff -- src/lib/auth/google-user.ts scripts/verify-google-user-linking.mjs
```

Expected: diff only adds the linking helper and focused verification script.

---

### Task 4: Bridge Auth.js session to the app session

**Files:**
- Create: `src/app/api/auth/google/complete/route.ts`

- [ ] **Step 1: Create bridge route**

Create `src/app/api/auth/google/complete/route.ts`:

```ts
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { findOrCreateGoogleUser } from "@/lib/auth/google-user";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login?authError=google");
  }

  const user = await findOrCreateGoogleUser(prisma.user, email);
  await createSession(user.id);
  redirect("/dashboard");
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS. If TypeScript does not infer `session.user.email`, use Auth.js module augmentation only for the exact session shape instead of using `any`.

- [ ] **Step 3: Review bridge route diff**

```bash
git diff -- src/app/api/auth/google/complete/route.ts
```

Expected: diff only adds the Google completion bridge route.

---

### Task 5: Add auth messages to all catalogs

**Files:**
- Modify: `messages/vi.json`
- Modify: `messages/en.json`
- Modify: `messages/ko.json`
- Modify: `messages/ja.json`
- Modify: `messages/zh.json`

- [ ] **Step 1: Add Vietnamese auth messages**

Add this top-level sibling next to `chrome` in `messages/vi.json`:

```json
"auth": {
  "loginTitle": "Đăng nhập",
  "signupTitle": "Tạo tài khoản",
  "loginSubtitle": "Chào mừng bạn quay lại Thiệp Mừng Online",
  "signupSubtitle": "Bắt đầu tạo thiệp cưới của bạn",
  "email": "Email",
  "password": "Mật khẩu",
  "pending": "Đang xử lý...",
  "loginSubmit": "Đăng nhập",
  "signupSubmit": "Đăng ký",
  "loginWithGoogle": "Tiếp tục với Google",
  "signupWithGoogle": "Đăng ký với Google",
  "or": "hoặc",
  "noAccount": "Chưa có tài khoản?",
  "haveAccount": "Đã có tài khoản?",
  "oauthError": "Không thể đăng nhập bằng Google. Vui lòng thử lại."
}
```

- [ ] **Step 2: Add English auth messages**

Add this top-level sibling next to `chrome` in `messages/en.json`:

```json
"auth": {
  "loginTitle": "Sign in",
  "signupTitle": "Create account",
  "loginSubtitle": "Welcome back to Thiệp Mừng Online",
  "signupSubtitle": "Start creating your wedding invitation",
  "email": "Email",
  "password": "Password",
  "pending": "Processing...",
  "loginSubmit": "Sign in",
  "signupSubmit": "Sign up",
  "loginWithGoogle": "Continue with Google",
  "signupWithGoogle": "Sign up with Google",
  "or": "or",
  "noAccount": "Don't have an account?",
  "haveAccount": "Already have an account?",
  "oauthError": "Could not sign in with Google. Please try again."
}
```

- [ ] **Step 3: Add Korean auth messages**

Add this top-level sibling next to `chrome` in `messages/ko.json`:

```json
"auth": {
  "loginTitle": "로그인",
  "signupTitle": "계정 만들기",
  "loginSubtitle": "Thiệp Mừng Online에 다시 오신 것을 환영합니다",
  "signupSubtitle": "웨딩 초대장 만들기를 시작하세요",
  "email": "이메일",
  "password": "비밀번호",
  "pending": "처리 중...",
  "loginSubmit": "로그인",
  "signupSubmit": "가입하기",
  "loginWithGoogle": "Google로 계속하기",
  "signupWithGoogle": "Google로 가입하기",
  "or": "또는",
  "noAccount": "계정이 없으신가요?",
  "haveAccount": "이미 계정이 있으신가요?",
  "oauthError": "Google로 로그인할 수 없습니다. 다시 시도해 주세요."
}
```

- [ ] **Step 4: Add Japanese auth messages**

Add this top-level sibling next to `chrome` in `messages/ja.json`:

```json
"auth": {
  "loginTitle": "ログイン",
  "signupTitle": "アカウント作成",
  "loginSubtitle": "Thiệp Mừng Onlineへようこそ",
  "signupSubtitle": "結婚式招待状の作成を始めましょう",
  "email": "メール",
  "password": "パスワード",
  "pending": "処理中...",
  "loginSubmit": "ログイン",
  "signupSubmit": "登録",
  "loginWithGoogle": "Googleで続行",
  "signupWithGoogle": "Googleで登録",
  "or": "または",
  "noAccount": "アカウントをお持ちでないですか？",
  "haveAccount": "すでにアカウントをお持ちですか？",
  "oauthError": "Googleでログインできませんでした。もう一度お試しください。"
}
```

- [ ] **Step 5: Add Chinese auth messages**

Add this top-level sibling next to `chrome` in `messages/zh.json`:

```json
"auth": {
  "loginTitle": "登录",
  "signupTitle": "创建账户",
  "loginSubtitle": "欢迎回到 Thiệp Mừng Online",
  "signupSubtitle": "开始创建你的婚礼请柬",
  "email": "邮箱",
  "password": "密码",
  "pending": "处理中...",
  "loginSubmit": "登录",
  "signupSubmit": "注册",
  "loginWithGoogle": "使用 Google 继续",
  "signupWithGoogle": "使用 Google 注册",
  "or": "或",
  "noAccount": "还没有账户？",
  "haveAccount": "已有账户？",
  "oauthError": "无法使用 Google 登录。请重试。"
}
```

- [ ] **Step 6: Validate JSON files**

Run:

```bash
node -e 'for (const f of ["messages/vi.json","messages/en.json","messages/ko.json","messages/ja.json","messages/zh.json"]) JSON.parse(require("fs").readFileSync(f,"utf8")); console.log("messages ok")'
```

Expected: PASS and prints `messages ok`.

- [ ] **Step 7: Review messages diff**

```bash
git diff -- messages/vi.json messages/en.json messages/ko.json messages/ja.json messages/zh.json
```

Expected: diff only adds the `auth` namespace to each catalog.

---

### Task 6: Add Google button to auth UI

**Files:**
- Modify: `src/app/(auth)/AuthForm.tsx`

- [ ] **Step 1: Replace `AuthForm` with translated Google SSO UI**

Update `src/app/(auth)/AuthForm.tsx` to:

```tsx
"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

import type { AuthState } from "./actions";

type AuthFormProps = {
  mode: "login" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  oauthError?: string;
};

export function AuthForm({ mode, action, oauthError }: AuthFormProps) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);

  const isLogin = mode === "login";

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow">
      <h1 className="text-center font-heading text-3xl text-foreground">
        {isLogin ? t("loginTitle") : t("signupTitle")}
      </h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {isLogin ? t("loginSubtitle") : t("signupSubtitle")}
      </p>

      <a
        href="/api/auth/signin/google?callbackUrl=/api/auth/google/complete"
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-full border border-input bg-background px-4 py-2.5 font-semibold text-foreground shadow-sm transition hover:bg-muted"
      >
        <span className="flex size-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285f4]">
          G
        </span>
        {isLogin ? t("loginWithGoogle") : t("signupWithGoogle")}
      </a>

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>{t("or")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-foreground">
            {t("email")}
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
            {t("password")}
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
          {pending ? t("pending") : isLogin ? t("loginSubmit") : t("signupSubmit")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isLogin ? (
          <>
            {t("noAccount")} {" "}
            <Link href="/signup" className="font-semibold text-primary hover:underline">
              {t("signupSubmit")}
            </Link>
          </>
        ) : (
          <>
            {t("haveAccount")} {" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              {t("loginSubmit")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS. If `next-intl` reports missing provider context for auth pages, move the auth text object into a plain `src/app/(auth)/auth-copy.ts` helper and remove `useTranslations` from `AuthForm` instead of hardcoding strings.

- [ ] **Step 3: Review UI diff**

```bash
git diff -- src/app/\(auth\)/AuthForm.tsx
```

Expected: diff adds the Google button and translated auth copy usage without removing the email/password form.

---

### Task 7: Show OAuth errors on login page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Update login page to read `authError`**

Update `src/app/(auth)/login/page.tsx` to:

```tsx
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/session";
import { AuthForm } from "../AuthForm";
import { login } from "../actions";

type LoginPageProps = {
  searchParams: Promise<{ authError?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  const { authError } = await searchParams;
  const t = await getTranslations("auth");
  const oauthError = authError === "google" ? t("oauthError") : undefined;

  return <AuthForm mode="login" action={login} oauthError={oauthError} />;
}
```

- [ ] **Step 2: Keep signup page compiling with new prop shape**

Update `src/app/(auth)/signup/page.tsx` to:

```tsx
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
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Review page diff**

```bash
git diff -- src/app/\(auth\)/login/page.tsx src/app/\(auth\)/signup/page.tsx
```

Expected: diff only wires the login OAuth error message and keeps signup behavior unchanged.

---

### Task 8: Configure environment documentation for deployment

**Files:**
- Modify: `docs/deploy-minipc.md`
- Modify: `docs/deploy-payment.md` only if that file already lists production env variables for the same deployment target.

- [ ] **Step 1: Add required OAuth variables to the deployment guide**

In `docs/deploy-minipc.md`, add the new required variables near the existing environment variable section:

```md
- `AUTH_SECRET` — Auth.js secret used for Google OAuth session state.
- `GOOGLE_CLIENT_ID` — OAuth client ID from Google Cloud Console.
- `GOOGLE_CLIENT_SECRET` — OAuth client secret from Google Cloud Console.
```

Also add:

```md
Google OAuth callback URLs must include:

- Local: `http://localhost:3000/api/auth/callback/google`
- Production: `https://<production-domain>/api/auth/callback/google`
```

- [ ] **Step 2: Run a docs-only diff check**

Run:

```bash
git diff -- docs/deploy-minipc.md docs/deploy-payment.md
```

Expected: diff only documents the three new variables and callback URL requirement.

- [ ] **Step 3: Keep docs diff ready for review**

No commit is made unless the user asks for one. Leave the deployment documentation changes in the working tree with the rest of the SSO implementation.

---

### Task 9: Full verification

**Files:**
- No code changes expected.

- [ ] **Step 1: Run account-linking verification script**

Run:

```bash
npx tsx scripts/verify-google-user-linking.mjs
```

Expected: PASS and prints `google user linking verified`.

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run app locally for manual UI verification**

Run:

```bash
npm run dev
```

Expected: server starts successfully. Open `/login` and `/signup` in the browser.

- [ ] **Step 6: Verify login UI manually**

Expected on `/login`:

- Google button is visible.
- Email/password form is still visible.
- Clicking Google navigates to Google OAuth when `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `AUTH_SECRET`, and `NEXTAUTH_URL`/deployment URL are configured.
- Visiting `/login?authError=google` shows the generic Google login error.

- [ ] **Step 7: Verify signup UI manually**

Expected on `/signup`:

- Google signup button is visible.
- Email/password signup form is still visible.
- Existing signup flow still creates a local account and redirects to `/dashboard`.

- [ ] **Step 8: Verify Google account linking manually**

With real Google OAuth credentials configured:

- Sign in with a Google email that does not exist locally: expected result is redirect to `/dashboard`, a new `User` row with that email, and `passwordHash` is `null`.
- Sign in with a Google email matching an existing password account: expected result is redirect to `/dashboard` for the existing user, and existing invitations remain visible.

- [ ] **Step 9: Review final working tree**

Run:

```bash
git status --short
git diff --stat
```

Expected: only Google SSO implementation files, the spec, and this plan are changed. Do not commit unless the user asks for a commit.

---

## Self-review

- Spec coverage: The plan covers Auth.js Google OAuth, existing app session preservation, email-based account linking, UI button/copy, required environment variables, generic OAuth errors, and verification for both new and existing Google users.
- Placeholder scan: No TBD/TODO placeholders remain. Each code-writing step includes exact file contents or exact snippets.
- Type consistency: The helper accepts `prisma.user`, the bridge route imports `auth()` and `createSession()`, and page `searchParams` follows Next.js 16's Promise-based App Router signature.
