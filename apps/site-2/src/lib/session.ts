import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const SITE2_SESSION_COOKIE = "site2_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey(): Uint8Array {
  const secretKey = process.env.SESSION_SECRET;
  if (!secretKey) {
    throw new Error("SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secretKey);
}

type SessionPayload = {
  userId: string;
};

export async function createSite2Session(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SITE2_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSite2Session(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SITE2_SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function destroySite2Session(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SITE2_SESSION_COOKIE);
}
