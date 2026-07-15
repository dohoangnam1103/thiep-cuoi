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
