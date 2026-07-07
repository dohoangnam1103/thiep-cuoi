import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pub = join(root, "public");
const R = (p) => join(root, p);

// read raw source (avoid TS import); pull JSON-ish via regex where needed
const themeSrc = readFileSync(R("src/data/chungdoi-theme-config.ts"), "utf8");
const dataSrc = readFileSync(R("src/data/chungdoi.ts"), "utf8");
const demoSrc = readFileSync(R("src/data/chungdoi-demo-content.ts"), "utf8");
const cssSrc = readFileSync(R("src/app/globals.css"), "utf8");

// declared font families in @font-face
const declaredFonts = new Set(
  [...cssSrc.matchAll(/font-family:\s*"([^"]+)"/g)].map((m) => m[1].trim())
);

// helper: which template slug owns a char offset in theme-config
const slugAt = (src, idx) => {
  const before = src.slice(0, idx);
  const matches = [...before.matchAll(/^ {2}"([a-z0-9-]+)":\s*\{/gm)];
  return matches.length ? matches[matches.length - 1][1] : "(unknown)";
};

const report = {}; // slug -> {missing:[], placeholders:[], fontMissing:[]}
const ensure = (slug) => (report[slug] ??= { missing: [], placeholders: [], fontMissing: [] });

// 1) all /chungdoi/... paths across the three data files
for (const [label, src] of [["theme", themeSrc], ["data", dataSrc], ["demo", demoSrc]]) {
  for (const m of src.matchAll(/"(\/chungdoi\/[^"]+?)"/g)) {
    const p = m[1];
    const slug = label === "theme" ? slugAt(src, m.index) : "(file:" + label + ")";
    if (!existsSync(join(pub, p))) ensure(slug).missing.push(`[${label}] ${p}`);
  }
}

// data.ts + demo.ts: map paths to their template slug by scanning blocks
const mapFileBySlug = (src, pathRe) => {
  const blocks = [...src.matchAll(/"slug":\s*"([a-z0-9-]+)"|"([a-z0-9-]+)":\s*\{/g)];
  // fallback: for demo/data use nearest preceding slug marker
  for (const m of src.matchAll(pathRe)) {
    const before = src.slice(0, m.index);
    const s = [...before.matchAll(/"slug":\s*"([a-z0-9-]+)"|^\s{2,4}"([a-z0-9-]+)":\s*\{/gm)].pop();
    const slug = s ? s[1] || s[2] : "(unknown)";
    const p = m[1];
    if (!existsSync(join(pub, p))) ensure(slug).missing.push(p);
  }
};
mapFileBySlug(dataSrc, /"(\/chungdoi\/[^"]+?)"/g);
mapFileBySlug(demoSrc, /"(\/chungdoi\/[^"]+?)"/g);

// 2) unresolved placeholders in theme-config
for (const m of themeSrc.matchAll(/__ASSET_VAR__/g)) {
  ensure(slugAt(themeSrc, m.index)).placeholders.push("__ASSET_VAR__ at char " + m.index);
}

// 3) font families (couple + ampersand) referenced vs declared
const generic = ["serif", "sans-serif", "cursive", "Baskerville", "Times New Roman", "Georgia", "Arial", "Helvetica", "Helvetica Neue", "Playfair Display", "Dancing Script", "The Nautigal"];
for (const key of ["couple", "ampersand"]) {
  const re = new RegExp(`"${key}":\\s*"((?:\\\\"|[^"])*)"`, "g");
  for (const m of themeSrc.matchAll(re)) {
    const slug = slugAt(themeSrc, m.index);
    const val = m[1].replace(/\\"/g, '"');
    if (val.includes("__ASSET_VAR__")) continue; // already flagged
    const first = val.split(",")[0].replace(/"/g, "").trim();
    if (first && !declaredFonts.has(first) && !generic.includes(first)) {
      ensure(slug).fontMissing.push(`${key} font "${first}" not in @font-face`);
    }
  }
}

// print
const slugs = Object.keys(report).sort();
if (!slugs.length) { console.log("OK — no asset issues found."); process.exit(0); }
let total = 0;
for (const s of slugs) {
  const r = report[s];
  const n = r.missing.length + r.placeholders.length + r.fontMissing.length;
  if (!n) continue;
  total += n;
  console.log(`\n### ${s}  (${n} issue${n>1?"s":""})`);
  r.missing.forEach((x) => console.log("  MISSING FILE: " + x));
  r.placeholders.forEach((x) => console.log("  PLACEHOLDER : " + x));
  r.fontMissing.forEach((x) => console.log("  FONT        : " + x));
}
console.log(`\n=== TOTAL ISSUES: ${total} ===`);
