import type { BrowserContext } from "@playwright/test";
import { SignJWT } from "jose";

// Must match the webServer env SESSION_SECRET in playwright.config.ts.
const SESSION_SECRET = "e2e-session-secret-do-not-use-in-prod";
const encodedKey = new TextEncoder().encode(SESSION_SECRET);
const PORT = Number(process.env.E2E_PORT ?? 3100);

async function sign(payload: Record<string, string>): Promise<string> {
  const expiresAt = new Date(Date.now() + 60 * 60 * 24 * 7 * 1000);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(encodedKey);
}

async function setCookie(context: BrowserContext, name: string, value: string) {
  await context.addCookies([
    {
      name,
      value,
      domain: "127.0.0.1",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    },
  ]);
}

/** Forge a user session cookie so the context is logged in as `userId`. */
export async function loginAsUser(context: BrowserContext, userId: string): Promise<void> {
  const token = await sign({ userId });
  await setCookie(context, "session", token);
}

/** Forge an admin session cookie so the context is logged in as `adminId`. */
export async function loginAsAdmin(context: BrowserContext, adminId: string): Promise<void> {
  const token = await sign({ adminId });
  await setCookie(context, "admin_session", token);
}

export const SEEDED_ADMIN = { email: "admin@e2e.test", password: "admin123456" };
export const SEEDED_USER = { email: "user@e2e.test", password: "user123456" };
