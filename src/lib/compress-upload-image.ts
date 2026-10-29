import { isAcceptedImageUpload } from "./upload-image-formats";
import { EDITOR_IMAGE_MAX_EDGE, EDITOR_IMAGE_WEBP_QUALITY, MAX_IMAGE_UPLOAD_SOURCE_BYTES } from "./upload-image-limits";

const MIN_COMPRESSION_BYTES = 64 * 1024;
const MAX_DECODED_PIXELS = 60_000_000;

type DecodedImage = {
  source: CanvasImageSource;
  width: number;
  height: number;
  dispose: () => void;
};

async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, dispose: () => bitmap.close() };
    } catch { /* Try the browser's image element decoder, including native HEIC support. */ }
  }
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  const dispose = () => { image.onload = null; image.onerror = null; image.removeAttribute("src"); URL.revokeObjectURL(url); };
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image could not be decoded"));
      image.src = url;
    });
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, dispose };
  } catch (error) { dispose(); throw error; }
}

/** Reduce bytes before the network request; the server still validates every upload. */
export async function compressUploadImage(file: File): Promise<File> {
  if (typeof document === "undefined" || file.size < MIN_COMPRESSION_BYTES
    || file.size > MAX_IMAGE_UPLOAD_SOURCE_BYTES
    || file.type.toLowerCase() === "image/gif" || /\.gif$/i.test(file.name)
    || !isAcceptedImageUpload(file, ["jpeg", "png", "webp"])) return file;
  // Small WebPs are already cheap to transfer; avoid another lossy generation.
  if ((file.type.toLowerCase() === "image/webp" || /\.webp$/i.test(file.name)) && file.size <= 512 * 1024) return file;

  let decoded: DecodedImage | undefined;
  let canvas: HTMLCanvasElement | undefined;
  try {
    decoded = await decodeImage(file);
    const { width, height } = decoded;
    if (!width || !height || width * height > MAX_DECODED_PIXELS) return file;
    const scale = Math.min(1, EDITOR_IMAGE_MAX_EDGE / width, EDITOR_IMAGE_MAX_EDGE / height);
    canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
    const target = canvas;
    const encode = (type: string, quality?: number) => new Promise<Blob | null>(resolve => target.toBlob(resolve, type, quality));
    let blob = await encode("image/webp", EDITOR_IMAGE_WEBP_QUALITY / 100);
    // WebKit may return PNG for WebP. Still reduce upload bytes on these browsers,
    // preserving transparency and letting the server produce the final WebP.
    if (blob?.type !== "image/webp") {
      const pixels = context.getImageData(0, 0, target.width, target.height).data;
      let transparent = false;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] < 255) { transparent = true; break; }
      }
      const type = transparent ? "image/png" : "image/jpeg";
      if (blob?.type !== type) blob = await encode(type, .86);
    }
    if (!blob || !blob.size || blob.size >= file.size) return file;
    const extension = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" }[blob.type];
    if (!extension) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${name}.${extension}`, { type: blob.type, lastModified: file.lastModified });
  } catch {
    // Preserve HEIC/other native-decoder fallbacks and upload error handling.
    return file;
  } finally {
    decoded?.dispose();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
