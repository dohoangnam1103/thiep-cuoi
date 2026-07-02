import { mkdir, writeFile, access } from "node:fs/promises";
import { dirname, join } from "node:path";

const ROOT = process.cwd();

const THEME = "https://chungdoi.com/images/themes/songphung-red";
const CDN = "https://cdn.chungdoi.com";

// [remoteUrl, localPath]
const assets = [
  // Theme graphics
  [`${THEME}/Phuong.webp`, "public/chungdoi/images/themes/songphung-red/Phuong.webp"],
  [`${THEME}/Phuong 2.webp`, "public/chungdoi/images/themes/songphung-red/Phuong 2.webp"],
  [`${THEME}/Phuong line.webp`, "public/chungdoi/images/themes/songphung-red/Phuong line.webp"],
  [`${THEME}/HOA.webp`, "public/chungdoi/images/themes/songphung-red/HOA.webp"],
  [`${THEME}/CHU HY.webp`, "public/chungdoi/images/themes/songphung-red/CHU HY.webp"],
  [`${THEME}/NENGIAY.jpg`, "public/chungdoi/images/themes/songphung-red/NENGIAY.jpg"],
  // Wedding photos (6)
  [`${CDN}/uploads/0c628506-48ac-4928-9d7a-d1993cbacb64.jpg`, "public/chungdoi/images/album/photo-1.jpg"],
  [`${CDN}/uploads/db130511-df54-4198-ae03-b83cc54e2fb9.jpg`, "public/chungdoi/images/album/photo-2.jpg"],
  [`${CDN}/uploads/cd19eb76-f419-45f2-afd4-63548c426ca6.jpg`, "public/chungdoi/images/album/photo-3.jpg"],
  [`${CDN}/uploads/921195dd-b62c-4ce3-9ecb-f529de5d26b5.jpg`, "public/chungdoi/images/album/photo-4.jpg"],
  [`${CDN}/uploads/dee11faa-d859-4885-8429-c132a30410f2.jpg`, "public/chungdoi/images/album/photo-5.jpg"],
  [`${CDN}/uploads/a5a2e813-3cb0-458d-9a1a-6e56493ca291.jpg`, "public/chungdoi/images/album/photo-6.jpg"],
  // Music
  [`${CDN}/music/perfect-ed-sheeran.mp3`, "public/chungdoi/music/perfect-ed-sheeran.mp3"],
  // Missing wedding font
  ["https://chungdoi.com/fonts/Fz_Qellia_Fix.ttf", "public/chungdoi/fonts/Fz_Qellia_Fix.ttf"],
];

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

async function download([url, rel]) {
  const dest = join(ROOT, rel);
  await mkdir(dirname(dest), { recursive: true });
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Referer: "https://chungdoi.com/",
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return `OK  ${rel} (${(buf.length / 1024).toFixed(1)} KB)`;
}

async function run() {
  const results = [];
  // batch of 4
  for (let i = 0; i < assets.length; i += 4) {
    const batch = assets.slice(i, i + 4);
    const settled = await Promise.allSettled(batch.map(download));
    settled.forEach((s, idx) => {
      if (s.status === "fulfilled") results.push(s.value);
      else results.push(`ERR ${batch[idx][0]} -> ${s.reason.message}`);
    });
  }
  console.log(results.join("\n"));
}

run();
