import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const routeSource = await readFile("src/data/template-route-slugs.ts", "utf8");
const slugs = [...routeSource.matchAll(/\["([^"]+)", "([^"]+)"\]/g)].map((match) => match[1]);
const envelopeStemOverrides = {
  "dragon-phoenix-red": "dragon_phoenix",
  "dragon-phoenix-green": "dragon_phoenix",
  "dragon-phoenix-blue": "dragon_phoenix",
  "dragon-phoenix-black": "dragon_phoenix",
  "dragon-phoenix-v2-red": "dragon_phoenix_v2",
  "dragon-phoenix-v3-red": "dragon_phoenix_v3",
  "royal-red": "royal",
  "royal-blue": "royal",
  "royal-green": "royal",
};
const giftboxes = {
  "chateau-green": ["dragon_phoenix_v2", "glass_garden_green", "saraya_gold", "qasr_gold", "chateau_blue", "spring_garden_red", "spring_garden_green"],
  "glass-garden-green": ["saraya_gold", "jasmine_white", "double_phoenix_red", "baroque_gold", "boho_floral_pink", "brocade_flower_red", "chateau_green"],
};
const headers = { Referer: "https://chungdoi.com/", "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" };

async function download(url, target) {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, Buffer.from(await response.arrayBuffer()));
  console.log(`${target} <- ${url}`);
}

for (const slug of slugs) {
  if (slug === "maroon-love") continue;
  if (slug in giftboxes) {
    await download(`https://chungdoi.com/images/giftbox/${slug.replaceAll("-", "_")}.webp`, `public/chungdoi/images/giftbox/${slug}/box.webp`);
    for (const stem of giftboxes[slug]) await download(`https://chungdoi.com/images/giftbox/mini/${stem}.webp`, `public/chungdoi/images/giftbox/mini/${stem}.webp`);
    continue;
  }
  const stem = envelopeStemOverrides[slug] ?? slug.replaceAll("-", "_");
  await download(`https://chungdoi.com/images/envelope/${stem}.webp`, `public/chungdoi/images/giftbox/${slug}/envelope.webp`);
}
