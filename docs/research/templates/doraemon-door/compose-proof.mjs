import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const cutoutDirectory = path.join(currentDirectory, "concepts", "cutouts");
const outputPath = path.join(
  currentDirectory,
  "concepts",
  "doraemon-wedding-cast-proof-v1.png",
);

const canvasWidth = 1920;
const canvasHeight = 1200;

const background = Buffer.from(`
  <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#dff7ff"/>
        <stop offset="0.7" stop-color="#f5fbff"/>
        <stop offset="1" stop-color="#fff8ed"/>
      </linearGradient>
      <linearGradient id="portal" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#a9e8ff"/>
        <stop offset="1" stop-color="#fff6cf"/>
      </linearGradient>
      <filter id="softShadow" x="-20%" y="-20%" width="140%" height="150%">
        <feGaussianBlur stdDeviation="18"/>
      </filter>
    </defs>

    <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#sky)"/>

    <g fill="#ffffff" opacity="0.72">
      <ellipse cx="210" cy="155" rx="125" ry="42"/>
      <ellipse cx="310" cy="140" rx="88" ry="55"/>
      <ellipse cx="1620" cy="175" rx="120" ry="40"/>
      <ellipse cx="1715" cy="155" rx="82" ry="52"/>
    </g>

    <ellipse cx="960" cy="1122" rx="775" ry="72" fill="#c99872" opacity="0.16" filter="url(#softShadow)"/>

    <path d="M520 1070V390A440 440 0 0 1 1400 390V1070Z" fill="#ee6f99" stroke="#b83f6d" stroke-width="18"/>
    <path d="M595 1040V405A365 365 0 0 1 1325 405V1040Z" fill="url(#portal)" stroke="#fff3f7" stroke-width="14"/>

    <g fill="#ffffff" opacity="0.8">
      <ellipse cx="825" cy="390" rx="98" ry="32"/>
      <ellipse cx="900" cy="375" rx="63" ry="42"/>
      <ellipse cx="1115" cy="510" rx="98" ry="31"/>
      <ellipse cx="1190" cy="493" rx="62" ry="40"/>
    </g>

    <g fill="none" stroke="#ffffff" stroke-linecap="round" opacity="0.72">
      <path d="M730 600c105-78 355-78 460 0" stroke-width="7" stroke-dasharray="2 28"/>
      <path d="M774 668c83-56 289-56 372 0" stroke-width="5" stroke-dasharray="2 24"/>
    </g>

    <g fill="#7f3152">
      <text x="960" y="58" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="31" font-weight="700" letter-spacing="7">DORAEMON WEDDING CAST</text>
      <text x="960" y="91" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="600" letter-spacing="4" opacity="0.68">CONCEPT 01 · ANYWHERE DOOR</text>
    </g>
  </svg>
`);

const characterSpecs = [
  {
    fileName: "jaian-best-man-v1.png",
    height: 760,
    centerX: 278,
    bottomY: 1142,
  },
  {
    fileName: "suneo-best-man-v1.png",
    height: 730,
    centerX: 1640,
    bottomY: 1140,
  },
  {
    fileName: "nobita-groom-v1.png",
    height: 860,
    centerX: 720,
    bottomY: 1142,
  },
  {
    fileName: "shizuka-bride-v2.png",
    height: 970,
    centerX: 1170,
    bottomY: 1144,
  },
  {
    fileName: "doraemon-ring-bearer-v1.png",
    height: 405,
    centerX: 955,
    bottomY: 1158,
  },
];

const composites = [];

for (const spec of characterSpecs) {
  const inputPath = path.join(cutoutDirectory, spec.fileName);
  const buffer = await sharp(inputPath)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ height: spec.height, fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer();
  const metadata = await sharp(buffer).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read dimensions for ${spec.fileName}`);
  }

  composites.push({
    input: buffer,
    left: Math.round(spec.centerX - metadata.width / 2),
    top: Math.round(spec.bottomY - metadata.height),
  });
}

await sharp(background)
  .composite(composites)
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log(outputPath);
