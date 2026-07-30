#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const canvas = { width: 1024, height: 1536 };
const workDir = path.join(root, "tmp/ivory-signature");
const themeDir = path.join(root, "public/chungdoi/images/themes/_decor/ivory-signature");
const giftDir = path.join(root, "public/chungdoi/images/giftbox/ivory-signature");
const colors = { ivory: "#f4f0e8", light: "#fbf8f0", olive: "#66705a", navy: "#172437", gold: "#b6a074" };
const svg = (body, size = canvas) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">${body}</svg>`;
const paper = `<defs><linearGradient id="paper" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors.light}"/><stop offset="1" stop-color="${colors.ivory}"/></linearGradient><pattern id="grain" width="37" height="41" patternUnits="userSpaceOnUse"><circle cx="7" cy="11" r="1" fill="${colors.navy}" opacity=".035"/><circle cx="29" cy="31" r=".8" fill="${colors.gold}" opacity=".08"/></pattern></defs><rect width="1024" height="1536" fill="url(#paper)"/><rect width="1024" height="1536" fill="url(#grain)"/><path d="M92 78H932V1458H92Z" fill="none" stroke="${colors.gold}" stroke-width="2" opacity=".48"/><path d="M116 102H908" stroke="${colors.navy}" stroke-width="1" opacity=".34"/>`;
const layers = [
  { id: "navy-liner", body: `<path d="M164 96H860V414L512 532 164 414Z" fill="${colors.navy}"/><path d="M192 124H832" stroke="${colors.gold}" stroke-width="3" opacity=".8"/>` },
  { id: "ivory-card", body: `<g><rect x="270" y="126" width="484" height="318" rx="12" fill="${colors.light}" stroke="${colors.gold}" stroke-width="4"/><rect x="292" y="148" width="440" height="274" rx="6" fill="none" stroke="${colors.navy}" stroke-width="2" opacity=".48"/><path d="M400 324C400 246 448 196 512 196s112 50 112 128" fill="none" stroke="${colors.olive}" stroke-width="5" opacity=".7"/></g>` },
  { id: "olive-pocket", body: `<path d="M146 350L512 548 878 350V568H146Z" fill="${colors.olive}"/><path d="M146 350L512 548 878 350" fill="none" stroke="${colors.gold}" stroke-width="5"/><path d="M174 532H850" stroke="${colors.navy}" stroke-width="2" opacity=".55"/>` },
  { id: "champagne-seal", body: `<g><circle cx="512" cy="442" r="70" fill="${colors.gold}" stroke="${colors.light}" stroke-width="7"/><circle cx="512" cy="442" r="51" fill="${colors.olive}" stroke="${colors.navy}" stroke-width="3"/><path d="M482 458C498 420 526 410 548 426M476 430C498 468 528 476 552 452" fill="none" stroke="${colors.light}" stroke-width="6" stroke-linecap="round"/></g>` },
];

await Promise.all([mkdir(workDir, { recursive: true }), mkdir(themeDir, { recursive: true }), mkdir(giftDir, { recursive: true })]);
const platePath = path.join(workDir, "plate.png");
await sharp(Buffer.from(svg(paper))).png().toFile(platePath);
const renderedLayers = [];
for (const layer of layers) { const filePath = path.join(workDir, `layer-${layer.id}.png`); await sharp(Buffer.from(svg(layer.body))).ensureAlpha().png().toFile(filePath); renderedLayers.push({ ...layer, filePath }); }
await sharp(platePath).composite(renderedLayers.map(({ filePath }) => ({ input: filePath }))).webp({ quality: 94 }).toFile(path.join(themeDir, "artwork.webp"));
const gift = svg(`<path d="M55 92L210 18 365 92V248H55Z" fill="${colors.olive}" stroke="${colors.gold}" stroke-width="8"/><path d="M55 92L210 190 365 92" fill="none" stroke="${colors.gold}" stroke-width="7"/><path d="M55 248L168 152M365 248L252 152" stroke="${colors.navy}" stroke-width="5" opacity=".75"/><circle cx="210" cy="174" r="34" fill="${colors.gold}"/><path d="M190 184c12-30 31-32 43-13m-45-2c13 27 32 29 46 10" fill="none" stroke="${colors.navy}" stroke-width="5" stroke-linecap="round"/>`, { width: 420, height: 300 });
await sharp(Buffer.from(gift)).webp({ lossless: true }).toFile(path.join(giftDir, "envelope.webp"));
process.stdout.write(`ivory-signature assets generated\n  npm run templates:prepare-opening-assets -- --slug ivory-signature --plate ${path.relative(root, platePath)} ${renderedLayers.map(({ id, filePath }) => `--layer ${id}=${path.relative(root, filePath)}`).join(" ")}\n`);
