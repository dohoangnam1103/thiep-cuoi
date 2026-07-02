import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ORIGIN = "https://chungdoi.com";
const OUT_PUBLIC = path.join(process.cwd(), "public", "chungdoi");
const OUT_DATA = path.join(process.cwd(), "src", "data", "chungdoi.ts");

const staticAssets = [
  "/images/en/banner_hero.webp",
  "/images/en/hero/hero-1.webp",
  "/images/en/hero/hero-2.webp",
  "/icon.png",
  "/icon-v2.png?v=3",
  "/icon-512-v2.png?v=3",
  "/og-home-banner.webp",
  "/fonts/Pattaya-Regular.woff",
  "/fonts/HelveticaNeueLight.otf",
  "/fonts/HelveticaNeueRoman.otf",
  "/fonts/FzAghita.ttf",
  "/fonts/1FTV-VIP-Signora-Regular.otf",
];

const newSlugs = new Set([
  "song-hy-red",
  "song-hy-green",
  "dragon-phoenix-v3-red",
  "chateau-blue",
  "brocade-flower-red",
  "crystal-floral-blue",
  "chateau-green",
  "baroque-gold",
  "qasr-green",
  "qasr-gold",
]);

function decodeHtml(value = "") {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x27;", "'")
    .replaceAll("&quot;", "\"")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&mdash;", "-")
    .replaceAll("&ndash;", "-")
    .replaceAll("&rsquo;", "'")
    .replaceAll("&lsquo;", "'")
    .replaceAll("&ldquo;", "\"")
    .replaceAll("&rdquo;", "\"");
}

function cleanText(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function displayNameFromSlug(slug) {
  return slug
    .split("-")
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1)))
    .join(" ")
    .replace("Song Hy", "Double Happiness")
    .replace("Nhat Binh", "Nhat Binh")
    .replace("Hoa Tinh", "Love Art")
    .replace("Co Ba", "Co Ba")
    .replace("Qasr", "Qasr");
}

function categoryFor(name, slug) {
  const lower = `${name} ${slug}`.toLowerCase();
  if (lower.includes("dragon") || lower.includes("phoenix") || lower.includes("happiness") || lower.includes("nhat")) {
    return "Traditional";
  }
  if (lower.includes("floral") || lower.includes("leaf") || lower.includes("garden") || lower.includes("blossom")) {
    return "Floral";
  }
  if (lower.includes("royal") || lower.includes("chateau") || lower.includes("qasr") || lower.includes("baroque") || lower.includes("brocade")) {
    return "Royal";
  }
  if (lower.includes("chibi") || lower.includes("love") || lower.includes("minimalism") || lower.includes("co ba")) {
    return "Modern";
  }
  return "Signature";
}

function colorFor(name, slug) {
  const lower = `${name} ${slug}`.toLowerCase();
  if (lower.includes("green")) return "Green";
  if (lower.includes("blue")) return "Blue";
  if (lower.includes("gold")) return "Gold";
  if (lower.includes("brown")) return "Brown";
  if (lower.includes("white")) return "White";
  if (lower.includes("pink")) return "Pink";
  if (lower.includes("black")) return "Black";
  if (lower.includes("red")) return "Red";
  return "Mixed";
}

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GET ${url} failed: ${response.status}`);
  return response.text();
}

async function fetchOk(url) {
  const response = await fetch(url, { method: "HEAD" });
  return response.ok;
}

function localPathFor(remotePath) {
  const url = new URL(remotePath, ORIGIN);
  const clean = url.pathname.replace(/^\/+/, "");
  return `/chungdoi/${clean}`;
}

async function download(remotePath) {
  const url = new URL(remotePath, ORIGIN);
  const output = path.join(OUT_PUBLIC, url.pathname.replace(/^\/+/, ""));
  await mkdir(path.dirname(output), { recursive: true });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Download ${url} failed: ${response.status}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(output, buffer);
  return output;
}

function extractImagePaths(html) {
  return [
    ...new Set(
      [...html.matchAll(/\/images\/template-previews\/en\/(?:listing|portrait|landscape)\/[^"'\\\s,)]+/g)]
        .map((match) => match[0].replace(/\\+$/g, "").replace(/&amp;.*/, ""))
        .filter((src) => src.endsWith(".webp")),
    ),
  ];
}

function extractHighlights(text) {
  const highlightBlock = text.match(/Template Highlights\s+(.+?)\s+About\s+/)?.[1] ?? "";
  return highlightBlock
    .split(/(?=[A-Z][a-z]+(?:\s|:))/)
    .map((item) => item.trim())
    .filter((item) => item.length > 18)
    .slice(0, 3);
}

async function main() {
  await mkdir(OUT_PUBLIC, { recursive: true });

  const sitemap = await fetchText(`${ORIGIN}/sitemap.xml`);
  const templateUrls = [
    ...new Set(
      [...sitemap.matchAll(/<loc>(https:\/\/chungdoi\.com\/en\/templates\/[^<]+)<\/loc>/g)].map((match) => match[1]),
    ),
  ];

  const templates = [];
  const assets = new Set(staticAssets);

  for (const url of templateUrls) {
    const slug = url.split("/").pop();
    const html = await fetchText(url);
    const text = cleanText(
      html
        .replace(/<script[\s\S]*?<\/script>/g, " ")
        .replace(/<style[\s\S]*?<\/style>/g, " "),
    );
    const h1 = cleanText(html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "");
    const metaDescription = decodeHtml(html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
    const title = decodeHtml(html.match(/<title>(.*?)<\/title>/)?.[1] ?? "");
    const imagePaths = extractImagePaths(html);
    const primaryLandscape = imagePaths.find((src) => src.includes("/landscape/"));
    const primaryPortrait = imagePaths.find((src) => src.includes("/portrait/"));
    const baseName = path.basename(primaryLandscape || primaryPortrait || `${slug}.webp`);
    const listingCandidate = `/images/template-previews/en/listing/${baseName}`;
    const listing = (await fetchOk(`${ORIGIN}${listingCandidate}`)) ? listingCandidate : primaryPortrait || primaryLandscape;
    const name =
      cleanText(h1.replace(/\s*Template\s*-.+$/i, "").replace(/\s*Wedding Invitation Template.+$/i, "")) ||
      displayNameFromSlug(slug);

    for (const src of [listing, primaryPortrait, primaryLandscape]) {
      if (src) assets.add(src);
    }

    templates.push({
      slug,
      name,
      title,
      description: metaDescription,
      category: categoryFor(name, slug),
      color: colorFor(name, slug),
      isNew: newSlugs.has(slug),
      highlights: extractHighlights(text),
      listing: localPathFor(listing),
      portrait: primaryPortrait ? localPathFor(primaryPortrait) : localPathFor(listing),
      landscape: primaryLandscape ? localPathFor(primaryLandscape) : localPathFor(listing),
      sourceUrl: url,
    });
  }

  let completed = 0;
  for (const asset of assets) {
    try {
      await download(asset);
      completed += 1;
      if (completed % 20 === 0) console.log(`downloaded ${completed}/${assets.size}`);
    } catch (error) {
      console.warn(`skip asset ${asset}: ${error.message}`);
    }
  }

  const data = `export type ChungDoiTemplate = {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  color: string;
  isNew: boolean;
  highlights: string[];
  listing: string;
  portrait: string;
  landscape: string;
  sourceUrl: string;
};

export const templates = ${JSON.stringify(templates, null, 2)} satisfies ChungDoiTemplate[];

export const templateCategories = ["All", ...Array.from(new Set(templates.map((template) => template.category)))] as const;
export const templateColors = ["All", ...Array.from(new Set(templates.map((template) => template.color)))] as const;
`;

  await mkdir(path.dirname(OUT_DATA), { recursive: true });
  await writeFile(OUT_DATA, data);
  console.log(`wrote ${templates.length} templates and ${assets.size} assets`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
