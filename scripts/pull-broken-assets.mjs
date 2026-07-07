// Download prod theme assets for the templates our local clone is missing.
// Reads /tmp/scan.json (prod scan). For each target route, pulls every asset
// from https://chungdoi.com/images/themes/<dir>/<file> into
// public/chungdoi/images/themes/_decor/<dir>/<file>.
import { readFileSync, mkdirSync, existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";

const ROOT = "/Users/namdo/Documents/learning/clone/public/chungdoi/images/themes/_decor";
const BASE = "https://chungdoi.com/images/themes";
const HEADERS = { Referer: "https://chungdoi.com/", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };

const ROUTES = new Set([
  "hoa-tinh-do", "lau-dai-xanh", "thanhcung-xanh", "gam-hoa-do",
  "hoa-thuy-tinh-lam", "vuonkinh-xanh", "hoang-gia-vang", "hoa-moc-nau",
  "thanhcung-vang", "long-phung-v2-do", "long-phung-v3-do",
  "thanh-diep-xanh", "anh-dao-hong",
]);

const prod = JSON.parse(readFileSync("/tmp/scan.json", "utf8"));
const targets = prod.filter((p) => ROUTES.has(p.route) && p.assets?.length);

let ok = 0, skip = 0, fail = 0;
for (const t of targets) {
  for (const rel of t.assets) {
    // rel is URL-encoded like "love-art/bride%20frame.webp"
    const decoded = decodeURIComponent(rel);
    const dest = join(ROOT, decoded);
    if (existsSync(dest)) { skip++; continue; }
    const url = `${BASE}/${rel}`;
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) { fail++; console.error(`FAIL ${res.status} ${url}`); continue; }
      const buf = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      ok++;
      console.error(`ok ${decoded} (${buf.length}b)`);
    } catch (e) {
      fail++;
      console.error(`ERR ${url} ${String(e).slice(0, 80)}`);
    }
  }
}
console.log(`\ndownloaded=${ok} skipped=${skip} failed=${fail}`);
