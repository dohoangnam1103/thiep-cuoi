import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  Referer: "https://chungdoi.com/",
};

async function fetchText(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function downloadBinary(url, destRel) {
  const dest = path.join(ROOT, destRel);
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return destRel;
}

function extractInvitationId(html) {
  const m = html.match(/invitationId\\":\\"([a-z0-9-]+)\\"/) || html.match(/"invitationId":"([a-z0-9-]+)"/);
  return m ? m[1] : null;
}

function extractThemeAssets(html) {
  const re = /\/images\/themes\/([a-z0-9-]+)\/([^"'\\\s)]+\.(?:webp|svg|png|jpg|jpeg))/gi;
  const byFolder = new Map();
  let m;
  while ((m = re.exec(html))) {
    const folder = m[1];
    const file = m[2];
    if (!byFolder.has(folder)) byFolder.set(folder, new Set());
    byFolder.get(folder).add(file);
  }
  // Pick the folder with the most distinct files referenced (main theme folder)
  let bestFolder = null;
  let bestFiles = [];
  for (const [folder, files] of byFolder) {
    if (files.size > bestFiles.length) {
      bestFolder = folder;
      bestFiles = Array.from(files);
    }
  }
  return { folder: bestFolder, files: bestFiles, allFolders: Array.from(byFolder.entries()).map(([f, s]) => [f, Array.from(s)]) };
}

function extractHeadingStyle(html) {
  // The couple-name heading carries the real per-template accent color and
  // decorative font. Two observed shapes on chungdoi.com:
  //   <h1 style="color:#123467;font-family:&quot;DFVN New Eddy&quot;, ...">
  //   <h1 ...><span style="font-family:&quot;SVN-HC Pacifico&quot;, cursive;color:#c32a29;...">
  // so we scan the whole <h1>...</h1> block for the first color: and
  // font-family: declarations regardless of order/ownership.
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const block = h1Match ? h1Match[0] : html;

  const colorMatch = block.match(/color:(#[0-9a-fA-F]{6})/);
  const fontMatch = block.match(/font-family:((?:&quot;|")[^"]*?)"/);

  const primaryColor = colorMatch ? colorMatch[1].toLowerCase() : "#333333";
  const fontFamily = fontMatch
    ? fontMatch[1]
        .replace(/&quot;/g, '"')
        .split(",")[0]
        ?.trim()
        .replace(/"/g, "") ?? null
    : null;

  return { primaryColor, fontFamily };
}

function pick(localized) {
  if (!localized) return "";
  if (typeof localized === "string") return localized;
  return localized.vi ?? localized.en ?? Object.values(localized)[0] ?? "";
}

async function crawlOne(template) {
  const { slug, vnSlug } = template;
  const demoUrl = `https://chungdoi.com/mau-thiep/${vnSlug}/demo`;
  const html = await fetchText(demoUrl);

  const invitationId = extractInvitationId(html);
  if (!invitationId) throw new Error(`invitationId not found for ${slug}`);

  const inviteJson = await fetchJson(`https://api.chungdoi.com/api/invite/${invitationId}`);
  const data = inviteJson?.invitation?.data;
  if (!data) throw new Error(`no invitation data for ${slug} (${invitationId})`);

  let comments = [];
  try {
    const commentsJson = await fetchJson(`https://api.chungdoi.com/api/invite/${invitationId}/comments`);
    comments = Array.isArray(commentsJson?.comments) ? commentsJson.comments : [];
  } catch {
    comments = [];
  }

  let musicUrl = null;
  if (data.musicTrackId) {
    try {
      const trackJson = await fetchJson(`https://api.chungdoi.com/api/music-tracks/${data.musicTrackId}`);
      musicUrl = trackJson?.track?.url ?? null;
    } catch {
      musicUrl = null;
    }
  }

  const theme = extractThemeAssets(html);
  const { primaryColor, fontFamily } = extractHeadingStyle(html);

  // Download theme assets
  const themeAssetPaths = [];
  if (theme.folder) {
    for (const file of theme.files) {
      const remote = `https://chungdoi.com/images/themes/${theme.folder}/${file}`;
      const rel = `public/chungdoi/images/themes/${slug}/${file}`;
      try {
        await downloadBinary(remote, rel);
        themeAssetPaths.push(`/chungdoi/images/themes/${slug}/${file}`);
      } catch (e) {
        console.warn(`  theme asset failed ${remote}: ${e.message}`);
      }
    }
  }

  // Download gallery images (cap at 8)
  const galleryLocal = [];
  const galleryImages = Array.isArray(data.galleryImages) ? data.galleryImages.slice(0, 8) : [];
  for (let i = 0; i < galleryImages.length; i++) {
    const url = galleryImages[i]?.url;
    if (!url) continue;
    const ext = path.extname(new URL(url).pathname) || ".webp";
    const rel = `public/chungdoi/images/gallery/${slug}/photo-${i + 1}${ext}`;
    try {
      await downloadBinary(url, rel);
      galleryLocal.push(`/chungdoi/images/gallery/${slug}/photo-${i + 1}${ext}`);
    } catch (e) {
      console.warn(`  gallery image failed ${url}: ${e.message}`);
    }
  }

  // Download music (dedupe by url handled by caller via return value)
  let musicLocal = null;
  if (musicUrl) {
    const ext = path.extname(new URL(musicUrl).pathname) || ".mp3";
    const rel = `public/chungdoi/music/${slug}${ext}`;
    try {
      await downloadBinary(musicUrl, rel);
      musicLocal = `/chungdoi/music/${slug}${ext}`;
    } catch (e) {
      console.warn(`  music failed ${musicUrl}: ${e.message}`);
    }
  }

  const ceremony = Array.isArray(data.ceremonies) ? data.ceremonies[0] : null;

  return {
    slug,
    invitationId,
    theme: {
      primaryColor,
      fontFamily,
      assetFolder: theme.folder,
      assets: themeAssetPaths,
    },
    couple: {
      brideFullName: pick(data.brideFullName),
      groomFullName: pick(data.groomFullName),
      brideShortName: pick(data.brideShortName),
      groomShortName: pick(data.groomShortName),
      brideFirst: Boolean(data.brideFirst),
      date: data.date ?? "",
      time: data.time ?? "",
      ceremonyDate: data.ceremonyDate ?? data.date ?? "",
      ceremonyTime: data.ceremonyTime ?? "",
      ceremonyHeader: pick(ceremony?.header),
    },
    families: {
      brideFather: data.brideFather ?? "",
      brideMother: data.brideMother ?? "",
      brideAddress: pick(data.brideAddress),
      groomFather: data.groomFather ?? "",
      groomMother: data.groomMother ?? "",
      groomAddress: pick(data.groomAddress),
      brideParentTitle: pick(data.brideParentTitle) || "Mr. & Mrs.",
      groomParentTitle: pick(data.groomParentTitle) || "Mr. & Mrs.",
    },
    venue: {
      address: pick(data.address),
      mapAddress: data.mapAddress ?? "",
      banquetTime: data.banquetTime ?? data.time ?? "",
    },
    schedule: (Array.isArray(data.timelineEvents) ? data.timelineEvents : []).map((ev) => ({
      time: ev.time ?? "",
      label: pick(ev.label),
    })),
    gallery: galleryLocal,
    wishes: comments.slice(0, 12).map((c) => ({
      name: c.name ?? "",
      time: c.timestamp ?? "",
      text: c.message ?? "",
    })),
    bank: {
      brideBankName: data.brideBankName ?? "",
      brideAccountNumber: data.brideAccountNumber ?? "",
      brideAccountName: data.brideAccountName ?? "",
      groomBankName: data.groomBankName ?? "",
      groomAccountNumber: data.groomAccountNumber ?? "",
      groomAccountName: data.groomAccountName ?? "",
    },
    music: musicLocal,
  };
}

function tsLiteral(value, indent = 0) {
  return JSON.stringify(value, null, 2)
    .split("\n")
    .map((line, i) => (i === 0 ? line : "  ".repeat(indent) + line))
    .join("\n");
}

async function main() {
  const templatesSrc = await readFile(path.join(ROOT, "src/data/chungdoi.ts"), "utf8");
  const jsonMatch = templatesSrc.match(/export const templates = (\[[\s\S]*?\]) satisfies/);
  if (!jsonMatch) throw new Error("could not locate templates array in chungdoi.ts");
  const templates = JSON.parse(jsonMatch[1]);

  // Parse the Vietnamese slug map so we can crawl the VN demo pages (which carry
  // the Vietnamese sample personas the /mau-thiep/ routes display).
  const vnMatch = templatesSrc.match(/export const vietnameseTemplateSlugs = (\[[\s\S]*?\]) as const;/);
  if (!vnMatch) throw new Error("could not locate vietnameseTemplateSlugs in chungdoi.ts");
  const vnPairs = JSON.parse(vnMatch[1].replace(/,(\s*\])/g, "$1"));
  const vnBySlug = new Map(vnPairs.map(([src, route]) => [src, route]));
  for (const t of templates) t.vnSlug = vnBySlug.get(t.slug) ?? t.slug;

  const results = {};
  const failures = [];

  for (const template of templates) {
    process.stdout.write(`Crawling ${template.slug}... `);
    try {
      const content = await crawlOne(template);
      results[template.slug] = content;
      console.log(`OK (${content.couple.groomFullName} & ${content.couple.brideFullName})`);
    } catch (e) {
      console.log(`FAILED: ${e.message}`);
      failures.push({ slug: template.slug, error: e.message });
    }
    // gentle pacing to avoid hammering the origin
    await new Promise((r) => setTimeout(r, 300));
  }

  const outPath = path.join(ROOT, "src/data/chungdoi-demo-content.ts");
  const body = `// Auto-generated by scripts/crawl-chungdoi-demo-content.mjs
// Do not hand-edit; re-run the script to refresh.

export type ChungDoiDemoContent = {
  slug: string;
  invitationId: string;
  theme: {
    primaryColor: string;
    fontFamily: string | null;
    assetFolder: string | null;
    assets: string[];
  };
  couple: {
    brideFullName: string;
    groomFullName: string;
    brideShortName: string;
    groomShortName: string;
    brideFirst: boolean;
    date: string;
    time: string;
    ceremonyDate: string;
    ceremonyTime: string;
    ceremonyHeader: string;
  };
  families: {
    brideFather: string;
    brideMother: string;
    brideAddress: string;
    groomFather: string;
    groomMother: string;
    groomAddress: string;
    brideParentTitle: string;
    groomParentTitle: string;
  };
  venue: {
    address: string;
    mapAddress: string;
    banquetTime: string;
  };
  schedule: { time: string; label: string }[];
  gallery: string[];
  wishes: { name: string; time: string; text: string }[];
  bank: {
    brideBankName: string;
    brideAccountNumber: string;
    brideAccountName: string;
    groomBankName: string;
    groomAccountNumber: string;
    groomAccountName: string;
  };
  music: string | null;
};

export const chungdoiDemoContent: Record<string, ChungDoiDemoContent> = ${tsLiteral(results)} satisfies Record<string, ChungDoiDemoContent>;
`;

  await writeFile(outPath, body);
  console.log(`\nWrote ${Object.keys(results).length}/${templates.length} templates to ${outPath}`);
  if (failures.length) {
    console.log(`Failures (${failures.length}):`);
    for (const f of failures) console.log(`  ${f.slug}: ${f.error}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
