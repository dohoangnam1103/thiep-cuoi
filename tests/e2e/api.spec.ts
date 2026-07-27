import { readFile, unlink } from "node:fs/promises";
import path from "node:path";

import { test, expect } from "@playwright/test";

import { loginAsAdmin, loginAsUser, SEEDED_ADMIN } from "./helpers/auth";
import { getDb } from "./helpers/db";
import { createUser, cleanupUser } from "./helpers/fixtures";

const UPLOAD_DIR = path.join(process.cwd(), "tests", "e2e", ".data", "editor-uploads");
const VALID_PNG_PATH = path.join(process.cwd(), "public", "chungdoi", "icon.png");
const VALID_HEIC_PATH = path.join(process.cwd(), "tests", "fixtures", "sample.heic");

// 1x1 transparent PNG.
const PNG_BYTES = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

test.describe("POST /api/upload", () => {
  test("admin session can upload an editor image", async ({ context, page }) => {
    const row = getDb()
      .prepare("SELECT id FROM Admin WHERE email = ?")
      .get(SEEDED_ADMIN.email) as { id: string } | undefined;
    if (!row) throw new Error("seeded admin not found in test.db");

    await loginAsAdmin(context, row.id);
    let savedName: string | undefined;
    try {
      const res = await page.request.post("/api/upload", {
        multipart: {
          file: { name: "admin.png", mimeType: "image/png", buffer: await readFile(VALID_PNG_PATH) },
        },
      });
      expect(res.status()).toBe(200);
      const body = (await res.json()) as { url: string };
      expect(body.url).toMatch(/^\/uploads\/[\w-]+\.webp$/);
      savedName = body.url.replace("/uploads/", "");
    } finally {
      if (savedName) {
        await unlink(path.join(UPLOAD_DIR, savedName)).catch(() => {});
      }
    }
  });

  test("unauthenticated → 401", async ({ request }) => {
    const res = await request.post("/api/upload", {
      multipart: {
        file: { name: "x.png", mimeType: "image/png", buffer: PNG_BYTES },
      },
    });
    expect(res.status()).toBe(401);
    expect((await res.json()).error).toBeTruthy();
  });

  test("authed valid png → 200 + returns a directly readable /uploads url", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    let savedName: string | undefined;
    try {
      const res = await page.request.post("/api/upload", {
        multipart: {
          file: { name: "x.png", mimeType: "image/png", buffer: await readFile(VALID_PNG_PATH) },
        },
      });
      expect(res.status()).toBe(200);
      const body = (await res.json()) as { url: string };
      expect(body.url).toMatch(/^\/uploads\/[\w-]+\.webp$/);
      savedName = body.url.replace("/uploads/", "");

      const uploaded = await page.request.get(body.url);
      expect(uploaded.status()).toBe(200);
      expect(uploaded.headers()["content-type"]).toBe("image/webp");
      expect(Number(uploaded.headers()["content-length"])).toBeGreaterThan(0);
    } finally {
      if (savedName) {
        await unlink(path.join(UPLOAD_DIR, savedName)).catch(() => {});
      }
      cleanupUser(user.id);
    }
  });

  test("authed valid HEIC → 200 + stores a readable WebP", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    let savedName: string | undefined;
    try {
      const res = await page.request.post("/api/upload", {
        multipart: {
          file: { name: "iphone-photo.HEIC", mimeType: "image/heic", buffer: await readFile(VALID_HEIC_PATH) },
        },
      });
      expect(res.status()).toBe(200);
      const body = (await res.json()) as { url: string };
      expect(body.url).toMatch(/^\/uploads\/[\w-]+\.webp$/);
      savedName = body.url.replace("/uploads/", "");

      const uploaded = await page.request.get(body.url);
      expect(uploaded.status()).toBe(200);
      expect(uploaded.headers()["content-type"]).toBe("image/webp");
      expect(Number(uploaded.headers()["content-length"])).toBeGreaterThan(0);
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

test.describe("POST /api/template-suggestions", () => {
  test("accepts a HEIF reference image and stores it as WebP", async ({ context, page }) => {
    const user = createUser();
    await loginAsUser(context, user.id);
    let savedPath: string | undefined;
    try {
      const res = await page.request.post("/api/template-suggestions", {
        multipart: {
          description: "Mẫu thiệp dùng ảnh tham khảo từ iPhone",
          notifyWhenAvailable: "false",
          referenceImage: {
            name: "reference-image.heif",
            mimeType: "image/heif",
            buffer: await readFile(VALID_HEIC_PATH),
          },
        },
      });
      expect(res.status()).toBe(201);
      const body = (await res.json()) as { suggestion: { id: string } };
      const row = getDb()
        .prepare("SELECT referenceImageUrl FROM TemplateSuggestion WHERE id = ?")
        .get(body.suggestion.id) as { referenceImageUrl: string };
      expect(row.referenceImageUrl).toMatch(/^\/uploads\/[\w-]+\.webp$/);
      savedPath = path.join(UPLOAD_DIR, row.referenceImageUrl.replace("/uploads/", ""));

      const uploaded = await page.request.get(row.referenceImageUrl);
      expect(uploaded.status()).toBe(200);
      expect(uploaded.headers()["content-type"]).toBe("image/webp");
    } finally {
      if (savedPath) await unlink(savedPath).catch(() => {});
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
