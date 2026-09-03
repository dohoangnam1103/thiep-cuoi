import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Read only images already published in the listing's mobile <source> tags.
// Never copy the uploads directory or private database to the build machine.
const origin = process.env.LISTING_THUMBNAIL_ORIGIN;
if (!origin || new URL(origin).protocol !== 'https:') throw new Error('Set LISTING_THUMBNAIL_ORIGIN to the HTTPS preview origin');
async function download(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response;
}
const html = await (await download(new URL('/mau-thiep', origin))).text();
const sources = new Set();
for (const tag of html.match(/<source\b[^>]*>/g) || []) {
  if (!tag.includes('(max-width: 639px)')) continue;
  for (const match of tag.matchAll(/url=%2Fuploads%2F([a-f0-9-]+\.(?:webp|png|jpg|jpeg))/gi)) {
    sources.add(`/uploads/${match[1]}`);
  }
}
// When regenerating against a build already using static mobile variants, the
// existing manifest retains the original public source URLs.
let previous = {};
try { previous = JSON.parse(await readFile('src/data/listing-mobile-thumbnails.json', 'utf8')); }
catch { /* First generation has no manifest yet. */ }
for (const [source, image] of Object.entries(previous)) {
  if (image.variants.some(variant => html.includes(variant.src))) sources.add(source);
}
if (!sources.size) throw new Error('No published mobile thumbnail sources found');
const outputDir = 'chungdoi/images/template-previews/en/mobile-thumbnails';
await mkdir(path.join('public', outputDir), { recursive: true });
const manifest = {};
let bytes = 0;
sharp.concurrency(1);
for (const source of sources) {
  const input = Buffer.from(await (await download(new URL(source, origin))).arrayBuffer());
  const { width, height } = await sharp(input).metadata();
  if (!width || !height) throw new Error(`Missing dimensions: ${source}`);
  const version = createHash('sha256').update(input).update('mobile-webp82-v1').digest('hex').slice(0, 12);
  const stem = `${path.parse(source).name}-${version}`;
  const widths = [...new Set([...[320, 480, 640, 768, 1080].filter(value => value <= width), Math.min(width, 1080)])].sort((a, b) => a - b);
  const variants = [];
  for (const outputWidth of widths) {
    const output = await sharp(input).resize({ width: outputWidth }).webp({ quality: 82 }).toBuffer();
    const src = `/${outputDir}/${stem}-${outputWidth}.webp`;
    await writeFile(path.join('public', src), output);
    variants.push({ width: outputWidth, src });
    bytes += output.length;
  }
  manifest[source] = { width, height, variants };
}
await writeFile('src/data/listing-mobile-thumbnails.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${sources.size} public mobile thumbnails, ${(bytes / 1024 / 1024).toFixed(2)} MiB total`);
