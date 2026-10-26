import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import sharp from "sharp";
import { getTranslations } from "next-intl/server";

import {
  OG_DATE_FONT,
  resolveOgNameLines,
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

function fallbackImage(fontData: Buffer, family: string, label: string) {
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
        {label}
      </div>
    ),
    { ...size, fonts: [{ name: family, data: fontData, style: "normal", weight: 400 }] },
  );
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const invitation = await loadPublished(slug);
  const t = await getTranslations({ locale: "vi", namespace: "publicInvitation.metadata" });
  // Lora-Regular.ttf trong bộ asset là variable font. Parser font của
  // @vercel/og hiện lỗi ở bảng fvar ("reading '256'"), làm stream ảnh trả 502.
  // Viaoda Libre là font tĩnh, có đủ dấu tiếng Việt và đã được kiểm tra qua
  // ImageResponse; chỉ dùng làm fallback render OG, không đổi font trong thiệp.
  const fallbackFont = { family: "Viaoda Libre", file: "ViaodaLibre-Regular.ttf" };
  const fallbackFontData = await loadFont(fallbackFont.file);

  if (!invitation?.content) {
    return fallbackImage(fallbackFontData, fallbackFont.family, t("siteName"));
  }

  const { content } = invitation;
  const nameLines = resolveOgNameLines(content);
  const date = resolveOgDate(content.date);
  const dateFontData = await loadFont(OG_DATE_FONT.file);
  let font = resolveOgFont(invitation.templateId);
  const theme = resolveOgTheme(invitation.templateId, content.primaryColor);

  // Mọi template chưa có font OG riêng trước đây đều rơi về Lora. Chặn file
  // không tương thích tại biên render để cả thiệp cũ lẫn fallback 404 đều có ảnh.
  if (font.file === "Lora-Regular.ttf") {
    font = { ...fallbackFont };
  }

  let fontData: Buffer;
  try {
    fontData = await loadFont(font.file);
  } catch {
    fontData = fallbackFontData;
    font = { ...fallbackFont };
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
            padding: "40px 56px",
            borderRadius: 28,
            background: theme.cardBg,
            width: 1000,
            height: 550,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontFamily: font.family,
              lineHeight: 1.1,
              color: theme.textPrimary,
              textAlign: "center",
              width: "100%",
            }}
          >
            {nameLines.map((name, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  fontSize: name === "&" ? 48 : Math.min(88, 1200 / Math.max(Array.from(name).length, 1)),
                  whiteSpace: "nowrap",
                  lineHeight: name === "&" ? 1.2 : 1.25,
                }}
              >
                {name}
              </div>
            ))}
          </div>
          {date ? (
            <div
              style={{
                marginTop: 32,
                fontFamily: OG_DATE_FONT.family,
                fontSize: 44,
                letterSpacing: 3,
                lineHeight: 1.25,
                color: theme.textSecondary,
              }}
            >
              {date}
            </div>
          ) : null}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: font.family, data: fontData, style: "normal", weight: 400 },
        { name: OG_DATE_FONT.family, data: dateFontData, style: "normal", weight: 400 },
      ],
    },
  );
}
