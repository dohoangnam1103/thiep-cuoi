# Dynamic OG Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sinh ảnh OG động (1200×630 PNG) cho mỗi trang thiệp publish, mang tên cặp đôi + ngày cưới, màu/font/hoa văn khớp template.

**Architecture:** Một file `opengraph-image.tsx` theo chuẩn App Router Next 16 render bằng `ImageResponse` (Satori). Logic thuần (tên, ngày, font, màu theme) tách ra `src/lib/og-image.ts` để unit-test bằng `node:test`. Hàm `loadPublished` tách ra lib dùng chung cho cả `page.tsx` và route ảnh. Hoa văn `.webp` convert PNG in-memory bằng `sharp` tại request-time (Node runtime).

**Tech Stack:** Next.js 16 (App Router), `next/og` ImageResponse/Satori, `sharp` (webp→png), Prisma/SQLite, `tsx --test` cho unit test.

---

## File Structure

- **Create** `src/lib/og-image.ts` — helper thuần: `resolveCoupleNames`, `resolveOgDate`, `resolveOgFont`, `resolveOgTheme`. Không I/O, không JSX.
- **Create** `src/lib/og-image.test.ts` — unit test cho 4 helper trên.
- **Create** `src/lib/published-invitation.ts` — chứa `loadPublished` (di từ page.tsx sang) + type suy ra, dùng chung.
- **Create** `src/app/thiep/[slug]/opengraph-image.tsx` — route ảnh: load data, đọc font, convert decor, trả `ImageResponse`. Không unit-test (I/O), verify bằng build + thủ công.
- **Modify** `src/app/thiep/[slug]/page.tsx` — bỏ hàm `loadPublished` nội bộ, import từ lib mới; bỏ phần `images` thủ công trong `generateMetadata`.

---

## Task 1: Helper tên cặp đôi + ngày

**Files:**
- Create: `src/lib/og-image.ts`
- Test: `src/lib/og-image.test.ts`

- [ ] **Step 1: Viết test thất bại**

```ts
// src/lib/og-image.test.ts
import assert from "node:assert/strict";
import test from "node:test";

import { resolveCoupleNames, resolveOgDate } from "@/lib/og-image";

test("resolveCoupleNames dùng shortName, thứ tự theo brideFirst", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "Linh",
      groomShortName: "Nam",
      brideFullName: "Nguyễn Thùy Linh",
      groomFullName: "Trần Hoài Nam",
      brideFirst: false,
    }),
    "Nam & Linh",
  );
});

test("resolveCoupleNames fallback fullName khi thiếu shortName", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "",
      groomShortName: "",
      brideFullName: "Nguyễn Thùy Linh",
      groomFullName: "Trần Hoài Nam",
      brideFirst: true,
    }),
    "Nguyễn Thùy Linh & Trần Hoài Nam",
  );
});

test("resolveCoupleNames bỏ vế trống, không để '& '", () => {
  assert.equal(
    resolveCoupleNames({
      brideShortName: "Linh",
      groomShortName: "",
      brideFullName: "",
      groomFullName: "",
      brideFirst: true,
    }),
    "Linh",
  );
});

test("resolveOgDate trả nguyên chuỗi user nhập, trim", () => {
  assert.equal(resolveOgDate("  20.12.2026  "), "20.12.2026");
});

test("resolveOgDate trả chuỗi rỗng khi trống", () => {
  assert.equal(resolveOgDate(""), "");
  assert.equal(resolveOgDate("   "), "");
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `npx tsx --test src/lib/og-image.test.ts`
Expected: FAIL — `Cannot find module '@/lib/og-image'`.

- [ ] **Step 3: Viết implementation tối thiểu**

```ts
// src/lib/og-image.ts
export type OgCoupleContent = {
  brideShortName: string;
  groomShortName: string;
  brideFullName: string;
  groomFullName: string;
  brideFirst: boolean;
};

export function resolveCoupleNames(content: OgCoupleContent): string {
  const bride = content.brideShortName || content.brideFullName;
  const groom = content.groomShortName || content.groomFullName;
  const first = content.brideFirst ? bride : groom;
  const second = content.brideFirst ? groom : bride;
  return [first, second].filter(Boolean).join(" & ");
}

export function resolveOgDate(date: string): string {
  return date.trim();
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `npx tsx --test src/lib/og-image.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/og-image.ts src/lib/og-image.test.ts
git commit -m "feat(og): helper resolve couple names + date"
```

---

## Task 2: Helper chọn font theo template

**Files:**
- Modify: `src/lib/og-image.ts`
- Test: `src/lib/og-image.test.ts`

Bối cảnh: `chungdoiThemeConfig[templateId].fonts.couple` là chuỗi CSS font-stack như `"Fz Aghita", "Baskerville", serif`. Cần lấy family đầu, map ra file trong `public/chungdoi/fonts/`. Có 6 family được dùng; còn lại (null / không map được) → Lora.

- [ ] **Step 1: Viết test thất bại**

```ts
// Thêm vào src/lib/og-image.test.ts
import { resolveOgFont } from "@/lib/og-image";

test("resolveOgFont map template có font riêng (song-hy-green → Fz Aghita)", () => {
  const f = resolveOgFont("song-hy-green");
  assert.equal(f.family, "Fz Aghita");
  assert.equal(f.file, "FzAghita.ttf");
});

test("resolveOgFont fallback Lora khi template không tồn tại", () => {
  const f = resolveOgFont("khong-co-template-nay");
  assert.equal(f.family, "Lora");
  assert.equal(f.file, "Lora-Regular.ttf");
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `npx tsx --test src/lib/og-image.test.ts`
Expected: FAIL — `resolveOgFont is not exported` / `is not a function`.

- [ ] **Step 3: Viết implementation**

```ts
// Thêm vào src/lib/og-image.ts
import { chungdoiThemeConfig } from "@/data/chungdoi-theme-config";

const FONT_FILE_BY_FAMILY: Record<string, string> = {
  "Fz Aghita": "FzAghita.ttf",
  "Fz Qellia": "Fz_Qellia_Fix.ttf",
  "UNI Chu truyen thong": "UNI_Chu_truyen_thong.ttf",
  "DFVN New Eddy": "DFVN-NewEddy-Regular.otf",
  Pattaya: "Pattaya-Regular.woff",
  "1FTV VIP Signora": "1FTV-VIP-Signora-Regular.otf",
};

const FALLBACK_FONT = { family: "Lora", file: "Lora-Regular.ttf" };

function firstFontFamily(stack: string | null | undefined): string | null {
  if (!stack) return null;
  const match = stack.match(/^\s*"?([^",]+)"?/);
  return match ? match[1].trim() : null;
}

export function resolveOgFont(templateId: string): { family: string; file: string } {
  const family = firstFontFamily(chungdoiThemeConfig[templateId]?.fonts.couple);
  if (family && FONT_FILE_BY_FAMILY[family]) {
    return { family, file: FONT_FILE_BY_FAMILY[family] };
  }
  return { ...FALLBACK_FONT };
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `npx tsx --test src/lib/og-image.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/og-image.ts src/lib/og-image.test.ts
git commit -m "feat(og): map template font sang file cho Satori"
```

---

## Task 3: Helper resolve màu theme + danh sách decor

**Files:**
- Modify: `src/lib/og-image.ts`
- Test: `src/lib/og-image.test.ts`

Bối cảnh: layout A vẽ card `cardBg` ở giữa nền `background`. Phải lấy `theme.textPrimary`/`textSecondary` (màu chữ dành cho card, tương phản với cardBg) — KHÔNG đặt chữ thẳng lên background. Template không có trong config → fallback theo `primaryColor` (giống `resolveTokens` trong `chungdoi-demo.tsx`).

- [ ] **Step 1: Viết test thất bại**

```ts
// Thêm vào src/lib/og-image.test.ts
import { resolveOgTheme } from "@/lib/og-image";

test("resolveOgTheme lấy token từ config (double-phoenix-red)", () => {
  const t = resolveOgTheme("double-phoenix-red", "#c8102e");
  assert.equal(t.textPrimary, "#710001");
  assert.equal(t.cardBg, "rgba(255, 240, 231, 0.95)");
  assert.ok(t.background.startsWith("linear-gradient"));
  assert.ok(Array.isArray(t.decor));
});

test("resolveOgTheme fallback theo primaryColor khi không có config", () => {
  const t = resolveOgTheme("khong-co", "#123456");
  assert.equal(t.background, "linear-gradient(to bottom right, #123456, #123456)");
  assert.equal(t.cardBg, "rgba(255, 250, 244, 0.96)");
  assert.equal(t.textPrimary, "#123456");
  assert.deepEqual(t.decor, []);
});

test("resolveOgTheme fallback primaryColor trống → màu mặc định", () => {
  const t = resolveOgTheme("khong-co", "");
  assert.equal(t.textPrimary, "#710001");
});
```

- [ ] **Step 2: Chạy test để xác nhận fail**

Run: `npx tsx --test src/lib/og-image.test.ts`
Expected: FAIL — `resolveOgTheme is not a function`.

- [ ] **Step 3: Viết implementation**

```ts
// Thêm vào src/lib/og-image.ts
export type OgDecor = { src: string; className: string };

export type OgTheme = {
  background: string;
  cardBg: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  decor: OgDecor[];
};

export function resolveOgTheme(templateId: string, primaryColor: string): OgTheme {
  const cfg = chungdoiThemeConfig[templateId];
  if (cfg) {
    return {
      background: cfg.theme.background,
      cardBg: cfg.theme.cardBg,
      textPrimary: cfg.theme.textPrimary,
      textSecondary: cfg.theme.textSecondary,
      accent: cfg.theme.accent,
      decor: cfg.decorations.cardImages.map((img) => ({
        src: img.src,
        className: img.className,
      })),
    };
  }
  const accent = primaryColor || "#710001";
  return {
    background: `linear-gradient(to bottom right, ${accent}, ${accent})`,
    cardBg: "rgba(255, 250, 244, 0.96)",
    textPrimary: accent,
    textSecondary: accent,
    accent,
    decor: [],
  };
}
```

- [ ] **Step 4: Chạy test để xác nhận pass**

Run: `npx tsx --test src/lib/og-image.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/og-image.ts src/lib/og-image.test.ts
git commit -m "feat(og): resolve theme token + decor list cho card"
```

---

## Task 4: Tách `loadPublished` ra lib dùng chung

**Files:**
- Create: `src/lib/published-invitation.ts`
- Modify: `src/app/thiep/[slug]/page.tsx` (bỏ hàm nội bộ dòng 20-38, thêm import)

Bối cảnh: `loadPublished` + `isExpired` hiện là hàm nội bộ trong `page.tsx:20-38`. Route ảnh cần dùng lại `loadPublished`. Tách nó ra lib để tránh page→page import. `isExpired` chỉ page.tsx dùng — để nguyên trong page.tsx.

- [ ] **Step 1: Tạo lib mới**

```ts
// src/lib/published-invitation.ts
import { prisma } from "@/lib/prisma";

export async function loadPublished(slug: string) {
  return prisma.invitation.findFirst({
    where: { slug, status: "published" },
    include: {
      content: true,
      schedule: true,
      gallery: true,
      wishes: { orderBy: { createdAt: "desc" } },
      rsvpQuestions: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
    },
  });
}

export type PublishedInvitation = NonNullable<Awaited<ReturnType<typeof loadPublished>>>;
```

- [ ] **Step 2: Cập nhật page.tsx — thêm import, bỏ hàm nội bộ**

Trong `src/app/thiep/[slug]/page.tsx`:

Thêm vào khối import (cạnh `import { prisma } from "@/lib/prisma";`):

```ts
import { loadPublished } from "@/lib/published-invitation";
```

Xóa toàn bộ hàm `loadPublished` nội bộ (dòng ~27-38, khối `async function loadPublished(slug: string) { ... }`). Giữ nguyên `isExpired`. Nếu sau khi xóa mà `import { prisma }` không còn chỗ dùng nào khác trong page.tsx thì xóa luôn dòng import `prisma` (kiểm tra bằng typecheck ở step 3).

- [ ] **Step 3: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS, không lỗi "loadPublished redeclared" hay "unused prisma".

- [ ] **Step 4: Commit**

```bash
git add src/lib/published-invitation.ts src/app/thiep/[slug]/page.tsx
git commit -m "refactor(thiep): tách loadPublished ra lib dùng chung"
```

---

## Task 5: Route `opengraph-image.tsx`

**Files:**
- Create: `src/app/thiep/[slug]/opengraph-image.tsx`

Bối cảnh: đọc font bằng `readFile`; convert decor `.webp`→PNG bằng `sharp` in-memory, nhúng data URI; nếu 1 decor lỗi thì bỏ qua decor đó (không fail cả ảnh). Đặt tối đa 4 decor ở 4 góc, opacity thấp. Style toàn bộ inline (Satori không nhận Tailwind). `params` là Promise (Next 16).

- [ ] **Step 1: Tạo file route**

```tsx
// src/app/thiep/[slug]/opengraph-image.tsx
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import sharp from "sharp";

import {
  resolveCoupleNames,
  resolveOgDate,
  resolveOgFont,
  resolveOgTheme,
} from "@/lib/og-image";
import { loadPublished } from "@/lib/published-invitation";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Thiệp cưới | Thiệp Mừng Online";

const FONT_DIR = join(process.cwd(), "public", "chungdoi", "fonts");
const PUBLIC_DIR = join(process.cwd(), "public");
const CORNERS = [
  { top: -40, left: -40 },
  { top: -40, right: -40 },
  { bottom: -40, left: -40 },
  { bottom: -40, right: -40 },
] as const;

async function loadFont(file: string): Promise<Buffer> {
  return readFile(join(FONT_DIR, file));
}

async function decorToPngDataUri(src: string): Promise<string | null> {
  try {
    const webp = await readFile(join(PUBLIC_DIR, src));
    const png = await sharp(webp).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

function fallbackImage(fontData: Buffer, family: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(to bottom right, #710001, #450001)",
          color: "#FFF0E7",
          fontFamily: family,
          fontSize: 72,
        }}
      >
        Thiệp Mừng Online
      </div>
    ),
    { ...size, fonts: [{ name: family, data: fontData, style: "normal", weight: 400 }] },
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invitation = await loadPublished(slug);
  const fallbackFontData = await loadFont("Lora-Regular.ttf");

  if (!invitation?.content) {
    return fallbackImage(fallbackFontData, "Lora");
  }

  const { content } = invitation;
  const names = resolveCoupleNames(content);
  const date = resolveOgDate(content.date);
  const font = resolveOgFont(invitation.templateId);
  const theme = resolveOgTheme(invitation.templateId, content.primaryColor);

  let fontData: Buffer;
  try {
    fontData = await loadFont(font.file);
  } catch {
    fontData = fallbackFontData;
    font.family = "Lora";
  }

  const decorUris = (
    await Promise.all(theme.decor.slice(0, 4).map((d) => decorToPngDataUri(d.src)))
  ).filter((uri): uri is string => uri !== null);

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.background,
          overflow: "hidden",
        }}
      >
        {decorUris.map((uri, i) => (
          <img
            key={i}
            src={uri}
            width={280}
            height={280}
            style={{ position: "absolute", opacity: 0.18, ...CORNERS[i] }}
          />
        ))}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 72px",
            borderRadius: 28,
            background: theme.cardBg,
            maxWidth: 900,
          }}
        >
          <div
            style={{
              fontFamily: font.family,
              fontSize: 92,
              lineHeight: 1.1,
              color: theme.textPrimary,
              textAlign: "center",
            }}
          >
            {names}
          </div>
          {date ? (
            <div style={{ marginTop: 24, fontSize: 40, color: theme.textSecondary }}>
              {date}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: font.family, data: fontData, style: "normal", weight: 400 }] },
  );
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS. Nếu lỗi `<img src>` kiểu string thì OK (data URI là string hợp lệ). Nếu lỗi `Buffer` không gán được vào `fonts[].data`, đổi `readFile(...)` → `new Uint8Array(await readFile(...))`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS, không lỗi. Route `/thiep/[slug]/opengraph-image` xuất hiện trong danh sách routes.

- [ ] **Step 4: Verify thủ công trên dev**

Run: `npm run dev` (nền), rồi mở lần lượt (thay `<slug>` bằng slug thiệp published thật trong DB — lấy 1 slug bằng `npx tsx -e "import{prisma}from'./src/lib/prisma';prisma.invitation.findFirst({where:{status:'published'},select:{slug:true}}).then(r=>{console.log(r?.slug);process.exit(0)})"`):
- `http://localhost:3000/thiep/<slug>/opengraph-image` — ảnh render, tên + ngày đúng, màu khớp template.
- Test 1 thiệp template có font riêng (vd song-hy-green) và 1 thiệp thiếu `date` (dòng ngày ẩn).

Expected: ảnh PNG 1200×630 hiển thị, không lỗi 500. Nếu decor không hiện cũng chấp nhận (đã fallback bỏ qua), nhưng nền + card + chữ phải đúng.

- [ ] **Step 5: Commit**

```bash
git add src/app/thiep/[slug]/opengraph-image.tsx
git commit -m "feat(thiep): OG image động render bằng ImageResponse"
```

---

## Task 6: Bỏ `images` thủ công trong generateMetadata + verify cuối

**Files:**
- Modify: `src/app/thiep/[slug]/page.tsx` (`generateMetadata`, dòng ~75-97)

Bối cảnh: Next tự chèn `og:image`/`twitter:image` từ `opengraph-image.tsx`. Phải bỏ `images` thủ công để tránh trùng.

- [ ] **Step 1: Sửa generateMetadata**

Trong `generateMetadata`, xóa 2 dòng tính ảnh gallery:

```ts
  const firstPhoto = invitation.gallery[0]?.url;
  const images = firstPhoto ? [firstPhoto] : undefined;
```

Trong object `openGraph`, xóa dòng `images,`. Trong object `twitter`, xóa dòng `images,`. Giữ nguyên `title`, `description`, `url`, `siteName`, `type`, `card`.

- [ ] **Step 2: Verify typecheck**

Run: `npm run typecheck`
Expected: PASS, không lỗi "images is declared but never read".

- [ ] **Step 3: Verify og:image tag xuất hiện**

Run: `npm run dev` (nếu chưa chạy), rồi:

```bash
curl -s "http://localhost:3000/thiep/<slug>" | grep -o 'og:image[^>]*'
```

Expected: có `og:image`, `og:image:width` content 1200, `og:image:height` content 630 (do Next tự chèn từ opengraph-image), và KHÔNG còn trỏ tới URL ảnh gallery cũ.

- [ ] **Step 4: Full check**

Run: `npm run check`
Expected: lint + typecheck + typecheck:tests + test:unit (gồm 10 test og-image) + build đều PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/thiep/[slug]/page.tsx
git commit -m "feat(thiep): để Next tự chèn og:image từ opengraph-image route"
```

---

## Self-Review Notes

- **Spec coverage:** kiến trúc file (Task 5) ✓ · luồng data + fallback (Task 5) ✓ · font map + fallback Lora (Task 2, 5) ✓ · decor webp→png sharp in-memory + bỏ qua khi lỗi (Task 5) ✓ · layout card thuần theme (Task 3 màu + Task 5 JSX) ✓ · tên/ngày (Task 1) ✓ · bỏ images thủ công (Task 6) ✓ · runtime nodejs (Task 5) ✓.
- **Điều chỉnh so với spec:** spec ngầm định đặt chữ trên `background`; plan vẽ card `cardBg` ở giữa vì `textPrimary` nhiều template là màu chữ-trên-card (tối), đặt thẳng lên background tối sẽ mất chữ. Đây là làm đúng tinh thần "card thuần theme".
- **Type consistency:** `resolveOgFont` trả `{family,file}` dùng nhất quán ở Task 5. `resolveOgTheme` trả `OgTheme{background,cardBg,textPrimary,textSecondary,accent,decor}` khớp Task 5. `loadPublished` 1 nguồn (Task 4).
- **Ngoài phạm vi:** không làm layout B/C, không pre-convert đĩa, không cache lúc publish — đúng spec.
