import { unlink } from "node:fs/promises";
import path from "node:path";

import { test, expect } from "@playwright/test";

import { loginAsUser } from "./helpers/auth";
import { createUser, cleanupUser } from "./helpers/fixtures";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// 1x1 transparent PNG.
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("POST /api/upload", () => {
  test("unauthenticated → 401", async ({ request }) => {
    const res = await request.post("/api/upload", {
      multipart: {
        file: { name: "x.png", mimeType: "image/png", buffer: PNG_BYTES },
      },
    });
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBeTruthy();
  });

  test("authed valid png → 200 + returns /uploads url", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    let savedName: string | undefined;
    try {
      const res = await page.request.post("/api/upload", {
        multipart: {
          file: { name: "x.png", mimeType: "image/png", buffer: PNG_BYTES },
        },
      });
      expect(res.status()).toBe(200);
      const body = (await res.json()) as { url: string };
      expect(body.url).toMatch(/^\/uploads\/[\w-]+\.png$/);
      savedName = body.url.replace("/uploads/", "");
    } finally {
      if (savedName) {
        await unlink(path.join(UPLOAD_DIR, savedName)).catch(() => {});
      }
      cleanupUser(user.id);
    }
  });

  test("authed missing file field → 400", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    try {
      const res = await page.request.post("/api/upload", {
        multipart: { notfile: "hello" },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toBeTruthy();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("authed unsupported type → 415", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    try {
      const res = await page.request.post("/api/upload", {
        multipart: {
          file: { name: "x.txt", mimeType: "text/plain", buffer: Buffer.from("nope") },
        },
      });
      expect(res.status()).toBe(415);
      expect((await res.json()).error).toBeTruthy();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("authed oversize file → 413", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    try {
      // 6MB of zeroed bytes with an allowed mime type → passes type gate, fails size gate.
      const big = Buffer.alloc(6 * 1024 * 1024, 0);
      const res = await page.request.post("/api/upload", {
        multipart: {
          file: { name: "big.png", mimeType: "image/png", buffer: big },
        },
      });
      expect(res.status()).toBe(413);
      expect((await res.json()).error).toBeTruthy();
    } finally {
      cleanupUser(user.id);
    }
  });
});

test.describe("POST /api/ai", () => {
  test("unauthenticated → 401", async ({ request }) => {
    const res = await request.post("/api/ai", { data: { kind: "wish" } });
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBeTruthy();
  });

  test("authed invalid JSON body → 400", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    try {
      const res = await page.request.post("/api/ai", {
        headers: { "content-type": "application/json" },
        data: "not-json{",
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toBeTruthy();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("authed invalid enum value → 400", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    try {
      const res = await page.request.post("/api/ai", {
        data: { kind: "not-a-kind" },
      });
      expect(res.status()).toBe(400);
      expect((await res.json()).error).toBeTruthy();
    } finally {
      cleanupUser(user.id);
    }
  });

  test("authed valid body → 200 stub text (no external key in test env)", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    try {
      const res = await page.request.post("/api/ai", {
        data: { kind: "wish", tone: "warm", groomName: "An", brideName: "Bình" },
      });
      expect(res.status()).toBe(200);
      const body = (await res.json()) as { text: string; source: string };
      expect(body.text.length).toBeGreaterThan(0);
      // No OPENAI_API_KEY/AI_API_KEY in the e2e webServer env → deterministic stub.
      expect(body.source).toBe("stub");
      expect(body.text).toContain("An & Bình");
    } finally {
      cleanupUser(user.id);
    }
  });
});

test.describe("OAuth completion routes", () => {
  test("GET /auth/google/complete without session → redirect /login?authError=google", async ({ request }) => {
    const res = await request.get("/auth/google/complete", { maxRedirects: 0 });
    expect([302, 303, 307]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/login?authError=google");
  });

  test("GET /api/auth/facebook/complete without session → redirect /login?authError=facebook", async ({ request }) => {
    const res = await request.get("/api/auth/facebook/complete", { maxRedirects: 0 });
    expect([302, 303, 307]).toContain(res.status());
    expect(res.headers()["location"]).toContain("/login?authError=facebook");
  });
});
