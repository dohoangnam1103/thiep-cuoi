import { isAcceptedImageUpload } from "./upload-image-formats";
import { EDITOR_IMAGE_WEBP_QUALITY, MAX_IMAGE_UPLOAD_SOURCE_BYTES } from "./upload-image-limits";

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
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
    const target = canvas;
    const encode = (type: string, quality?: number) => new Promise<Blob | null>(resolve => target.toBlob(resolve, type, quality));
    const blob = await encode("image/webp", EDITOR_IMAGE_WEBP_QUALITY / 100);
    // Unsupported WebP encoders may return PNG. Upload the untouched original
    // and let the server encode WebP, without JPEG/PNG recompression.
    if (!blob || blob.type !== "image/webp" || !blob.size || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${name}.webp`, { type: blob.type, lastModified: file.lastModified });
  } catch {
    // Preserve HEIC/other native-decoder fallbacks and upload error handling.
    return file;
  } finally {
    decoded?.dispose();
    if (canvas) { canvas.width = 0; canvas.height = 0; }
  }
}
