import { readFileSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const CHUNK = process.argv[2] || "/tmp/chunk-40afd290.js";
const data = readFileSync(CHUNK, "utf8");

function extractObject(str, i) {
  let depth = 0;
  let inStr = null;
  for (let j = i; j < str.length; j++) {
    const c = str[j];
    if (inStr) {
      if (c === "\\") { j++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return str.slice(i, j + 1); }
  }
  return null;
}

// A sandbox that resolves any undefined identifier / property access to a
// sentinel object. Used because some configs reference webpack asset-module
// variables (e.g. `m.flower`) for decoration image srcs, which we cannot
// resolve to real filenames — we substitute a sentinel and drop those srcs.
const ASSET_SENTINEL = "__ASSET_VAR__";
function makeProxy() {
  const handler = {
    get(_t, prop) {
      if (prop === Symbol.toPrimitive || prop === "toString" || prop === Symbol.toStringTag) {
        return () => ASSET_SENTINEL;
      }
      return ASSET_SENTINEL;
    },
  };
  return new Proxy(function () {}, handler);
}

function evalLiteral(raw) {
  const vars = "abcdefghijklmnopqrstuvwxyz".split("");
  const proxy = makeProxy();
  // eslint-disable-next-line no-new-func
  const fn = new Function(...vars, "return (" + raw + ")");
  return fn(...vars.map(() => proxy));
}

// Webpack module boundaries: NUMBER:(args)=>{ | NUMBER:function
const bounds = [];
for (const m of data.matchAll(/(\d{4,7}):(?:\([a-z,]*\)=>|function)/g)) {
  bounds.push({ pos: m.index, id: m[1] });
}
function moduleOf(pos) {
  let prev = null;
  for (const b of bounds) {
    if (b.pos <= pos) prev = b;
    else break;
  }
  return prev ? prev.id : null;
}

// Text range of each module (boundary -> next boundary), keyed by module id.
const moduleText = {};
for (let i = 0; i < bounds.length; i++) {
  const start = bounds[i].pos;
  const end = i + 1 < bounds.length ? bounds[i + 1].pos : data.length;
  if (!moduleText[bounds[i].id]) moduleText[bounds[i].id] = data.slice(start, end);
}

// Build key -> "/images/themes/..." asset map for a module (from `key:"path"` pairs).
function assetPairsFor(modId) {
  const text = moduleText[modId] ?? "";
  const pairs = {};
  for (const m of text.matchAll(/([A-Za-z_$][\w$]*):"(\/images\/themes\/[^"]+)"/g)) {
    pairs[m[1]] = m[2];
  }
  return pairs;
}

function balancedSlice(str, openIdx, open, close) {
  let depth = 0;
  let inStr = null;
  for (let j = openIdx; j < str.length; j++) {
    const c = str[j];
    if (inStr) {
      if (c === "\\") { j++; continue; }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === open) depth++;
    else if (c === close) { depth--; if (depth === 0) return str.slice(openIdx, j + 1); }
  }
  return null;
}

// Parse the cardImages array from a raw config literal, resolving both literal
// srcs and asset-variable references (e.g. `m.flower`) against the module map.
function parseDecorations(rawConfig, assetPairs) {
  const key = rawConfig.indexOf("cardImages:[");
  if (key < 0) return [];
  const arrStart = rawConfig.indexOf("[", key);
  const arrText = balancedSlice(rawConfig, arrStart, "[", "]");
  if (!arrText) return [];

  const images = [];
  let idx = 0;
  while ((idx = arrText.indexOf("{", idx)) !== -1) {
    const objText = balancedSlice(arrText, idx, "{", "}");
    if (!objText) break;
    idx += objText.length;

    let src = null;
    const litMatch = objText.match(/src:"([^"]+)"/);
    if (litMatch) {
      src = litMatch[1];
    } else {
      const varMatch = objText.match(/src:[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)/);
      if (varMatch) src = assetPairs[varMatch[1]] ?? null;
    }
    if (!src || !src.startsWith("/images/themes/")) continue;

    const classMatch = objText.match(/className:"([^"]+)"/);
    images.push({
      remote: src,
      className: classMatch ? classMatch[1] : "",
      flyOnOpen: /flyOnOpen:!0/.test(objText),
    });
  }
  return images;
}

// Configs bucketed by module
const configByModule = {};
for (const m of data.matchAll(/\{theme:\{background:/g)) {
  const mod = moduleOf(m.index);
  const raw = extractObject(data, m.index);
  if (mod && raw && !configByModule[mod]) configByModule[mod] = raw;
}

// themeId per module
const result = {};
const missing = [];
for (const m of data.matchAll(/themeId:[A-Za-z]="([a-z_0-9]+)"/g)) {
  const tid = m[1];
  const slug = tid.replace(/_/g, "-");
  const mod = moduleOf(m.index);
  const raw = mod ? configByModule[mod] : null;
  if (!raw) { missing.push(slug); continue; }
  let obj;
  try { obj = evalLiteral(raw); } catch (e) { missing.push(slug + " (parse:" + e.message + ")"); continue; }
  const cardImages = parseDecorations(raw, assetPairsFor(mod));
  result[slug] = {
    theme: {
      background: obj.theme?.background,
      cardBg: obj.theme?.cardBg,
      textPrimary: obj.theme?.textPrimary,
      textSecondary: obj.theme?.textSecondary,
      accent: obj.theme?.accent,
      dividerFrom: obj.theme?.dividerFrom,
      dividerTo: obj.theme?.dividerTo,
      buttonBg: obj.theme?.buttonBg,
      buttonText: obj.theme?.buttonText,
      guestBoxBg: obj.theme?.guestBoxBg,
      guestBoxBorder: obj.theme?.guestBoxBorder,
      particleColors: Array.isArray(obj.theme?.particleColors)
        ? obj.theme.particleColors.filter((col) => typeof col === "string")
        : [],
      particleType: typeof obj.theme?.particleType === "string" ? obj.theme.particleType : "happiness",
    },
    fonts: {
      couple: typeof obj.fonts?.couple === "string" ? obj.fonts.couple : null,
      ampersand: typeof obj.fonts?.ampersand === "string" ? obj.fonts.ampersand : null,
    },
    sealType: typeof obj.decorations?.sealType === "string" ? obj.decorations.sealType : null,
    decorations: { cardImages },
  };
}

console.log("mapped:", Object.keys(result).length, "missing:", missing);

// ---- Fallback: map configs in modules that lack a themeId default, by their
// decoration asset folder (some templates, e.g. co-ba-red, are built without a
// themeId default param). ----
const contentSrc2 = readFileSync("src/data/chungdoi-demo-content.ts", "utf8");
const folderToSlug = {};
for (const em of contentSrc2.matchAll(/"slug":\s*"([a-z0-9-]+)",\s*"invitationId"[\s\S]*?"assetFolder":\s*"([a-z0-9-]+)"/g)) {
  if (!(em[2] in folderToSlug)) folderToSlug[em[2]] = em[1];
}
const mappedModules = new Set();
for (const m of data.matchAll(/themeId:[A-Za-z]="([a-z_0-9]+)"/g)) {
  mappedModules.add(moduleOf(m.index));
}
for (const m of data.matchAll(/\{theme:\{background:/g)) {
  const mod = moduleOf(m.index);
  if (!mod || mappedModules.has(mod)) continue;
  const raw = extractObject(data, m.index);
  if (!raw) continue;
  const pairs = assetPairsFor(mod);
  const cardImages = parseDecorations(raw, pairs);
  // determine folder from decorations or module asset refs
  let folder = null;
  const firstSrc = cardImages[0]?.remote ?? Object.values(pairs)[0] ?? "";
  const fm = firstSrc.match(/\/images\/themes\/([a-z0-9-]+)\//);
  if (fm) folder = fm[1];
  const slug = folder ? folderToSlug[folder] : null;
  if (!slug || result[slug]) continue;
  let obj;
  try { obj = evalLiteral(raw); } catch { continue; }
  result[slug] = {
    theme: {
      background: obj.theme?.background,
      cardBg: obj.theme?.cardBg,
      textPrimary: obj.theme?.textPrimary,
      textSecondary: obj.theme?.textSecondary,
      accent: obj.theme?.accent,
      dividerFrom: obj.theme?.dividerFrom,
      dividerTo: obj.theme?.dividerTo,
      buttonBg: obj.theme?.buttonBg,
      buttonText: obj.theme?.buttonText,
      guestBoxBg: obj.theme?.guestBoxBg,
      guestBoxBorder: obj.theme?.guestBoxBorder,
      particleColors: Array.isArray(obj.theme?.particleColors) ? obj.theme.particleColors.filter((c) => typeof c === "string") : [],
      particleType: typeof obj.theme?.particleType === "string" ? obj.theme.particleType : "happiness",
    },
    fonts: {
      couple: typeof obj.fonts?.couple === "string" ? obj.fonts.couple : null,
      ampersand: typeof obj.fonts?.ampersand === "string" ? obj.fonts.ampersand : null,
    },
    sealType: typeof obj.decorations?.sealType === "string" ? obj.decorations.sealType : null,
    decorations: { cardImages },
  };
  console.log("  fallback-mapped", slug, "via folder", folder);
}
console.log("total mapped:", Object.keys(result).length);

// ---- Manual overrides for templates whose module is merged with others in the
// bundle (auto-mapping cannot isolate them). co-ba-red lives in a shared module. ----
const MANUAL_OVERRIDES = {
  "co-ba-red": {
    theme: {
      background: "linear-gradient(165deg, #4a3428 0%, #352518 45%, #241a12 100%)",
      cardBg: "linear-gradient(to bottom right, #f8f3e0, #efe6d0, #f8f3e0)",
      textPrimary: "#542e08",
      textSecondary: "rgba(84, 46, 8, 0.88)",
      accent: "#c32a29",
      dividerFrom: "transparent",
      dividerTo: "rgba(84, 46, 8, 0.35)",
      buttonBg: "#c32a29",
      buttonText: "#f8f3e0",
      guestBoxBg: "rgba(84, 46, 8, 0.06)",
      particleColors: ["#CC0033", "#B80030", "#FF0040", "#AA0028"],
      particleType: "confetti",
    },
    fonts: { couple: null, ampersand: null },
    sealType: null,
    decorations: {
      cardImages: [
        {
          remote: "/images/themes/coba-red/cho-ben-thanh.webp",
          className: "w-[115%] max-w-none left-1/2 top-[calc(12%_-_30px)] -translate-x-1/2 opacity-20",
          flyOnOpen: true,
        },
      ],
    },
  },
};
for (const [slug, cfg] of Object.entries(MANUAL_OVERRIDES)) {
  if (!result[slug]) {
    result[slug] = cfg;
    console.log("  applied manual override:", slug);
  }
}

// ---- Download decoration assets from their real source folders ----
const ROOT = process.cwd();
const HEADERS = { "User-Agent": "Mozilla/5.0", Referer: "https://chungdoi.com/" };

async function downloadBinary(remotePath, destRel) {
  const url = `https://chungdoi.com${remotePath}`;
  const dest = path.join(ROOT, destRel);
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(String(res.status));
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

function localDecorPath(remote) {
  const rest = remote.replace(/^\/images\/themes\//, "");
  const safe = decodeURIComponent(rest).replace(/\s+/g, "-");
  return `/chungdoi/images/themes/_decor/${safe}`;
}

let dl = 0;
let dlFail = 0;
const seen = new Set();
for (const slug of Object.keys(result)) {
  for (const img of result[slug].decorations.cardImages) {
    const remote = img.remote;
    const local = localDecorPath(remote);
    img.src = local;
    delete img.remote;
    const destRel = "public" + local;
    if (seen.has(destRel)) continue;
    seen.add(destRel);
    try {
      await downloadBinary(remote, destRel);
      dl++;
    } catch (e) {
      dlFail++;
      console.warn("  decor fail", remote, e.message);
    }
  }
}
console.log(`decoration assets downloaded: ${dl}, failed: ${dlFail}`);

// ---- Emit TS data file ----
const header = `// Auto-generated by scripts/extract-theme-configs.mjs
// Per-template visual design tokens reverse-engineered from chungdoi.com's demo bundle.
// Do not hand-edit; re-run the script to refresh.

export type ChungDoiCardImage = {
  src: string;
  className: string;
  flyOnOpen: boolean;
};

export type ChungDoiThemeConfig = {
  theme: {
    background: string;
    cardBg: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    dividerFrom: string;
    dividerTo: string;
    buttonBg: string;
    buttonText: string;
    guestBoxBg: string;
    guestBoxBorder?: string | null;
    particleColors: string[];
    particleType: string;
  };
  fonts: { couple: string | null; ampersand: string | null };
  sealType: string | null;
  decorations: { cardImages: ChungDoiCardImage[] };
};

export const chungdoiThemeConfig: Record<string, ChungDoiThemeConfig> = ${JSON.stringify(result, null, 2)};
`;
writeFileSync(path.join(ROOT, "src/data/chungdoi-theme-config.ts"), header);
writeFileSync("/tmp/theme-configs.json", JSON.stringify(result, null, 2));
console.log("wrote src/data/chungdoi-theme-config.ts");
