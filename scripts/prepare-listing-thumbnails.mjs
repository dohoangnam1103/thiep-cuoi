import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Run on the build machine, never in the request path on the small VPS.
// Content-addressed filenames keep browser caches valid across deployments.
const root = process.cwd();
const sourceDir = 'chungdoi/images/template-previews/en/listing';
const outputDir = 'chungdoi/images/template-previews/en/listing-thumbnails';
const widths = [320, 480, 640, 768];
const manifest = {};
let totalBytes = 0;
sharp.concurrency(1);
await mkdir(path.join(root, 'public', outputDir), { recursive: true });
for (const filename of (await readdir(path.join(root, 'public', sourceDir))).filter(name => name.endsWith('.webp')).sort()) {
  const input = await readFile(path.join(root, 'public', sourceDir, filename));
  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Missing dimensions: ${filename}`);
  // Two source-widths cover the 460px card window at every current breakpoint.
  // Keep the exact top composition; only trim content below the visible area.
  const cropHeight = Math.min(metadata.height, metadata.width * 2);
  const version = createHash('sha256').update(input).update('top-2x-webp82-v1').digest('hex').slice(0, 12);
  const stem = `${filename.slice(0, -5)}-${version}`;
  const variants = [];
  const availableWidths = [...new Set([...widths.filter(value => value <= metadata.width), Math.min(metadata.width, 768)])].sort((a, b) => a - b);
  for (const width of availableWidths) {
    const src = `/${outputDir}/${stem}-${width}.webp`;
    const destination = path.join(root, 'public', src);
    if (!existsSync(destination)) {
      const output = await sharp(input)
        .extract({ left: 0, top: 0, width: metadata.width, height: cropHeight })
        .resize({ width }).webp({ quality: 82 }).toBuffer();
      await writeFile(destination, output);
    }
    variants.push({ width, src });
    totalBytes += (await readFile(destination)).length;
  }
  if (!variants.length) throw new Error(`Source too small: ${filename}`);
  manifest[`/${sourceDir}/${filename}`] = { width: metadata.width, height: metadata.height, cropHeight, variants };
}
await writeFile(path.join(root, 'src/data/listing-thumbnails.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared ${Object.keys(manifest).length} thumbnails × up to ${widths.length} sizes, ${(totalBytes / 1024 / 1024).toFixed(2)} MiB total`);
