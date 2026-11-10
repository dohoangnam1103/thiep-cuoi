import { getImageProps } from "next/image";

/** Match the existing optimizer policy; previews and external URLs stay usable. */
function optimizableSource(src: string): boolean {
  return src.startsWith("/") && !src.startsWith("//") && !src.includes("?")
    && /\.(?:webp|jpe?g|png|avif)$/i.test(src);
}

/** A deterministic URL lets the lightbox preload exactly what it will display. */
export function albumPhotoSource(src: string, width: number): string {
  if (!optimizableSource(src)) return src;
  const { props } = getImageProps({ src, alt: "", width, height: width, sizes: `${width}px`, quality: 90 });
  const candidates = (props.srcSet ?? "").split(", ").map(candidate => {
    const [url, size] = candidate.split(" ");
    return { url, width: Number(size?.slice(0, -1)) };
  }).filter(candidate => candidate.width <= 1920);
  return (candidates.find(candidate => candidate.width >= width) ?? candidates.at(-1))?.url ?? src;
}

export function albumPhotoProps(src: string, sizes: string, maxWidth = 1920) {
  if (!optimizableSource(src)) return { src, srcSet: undefined, sizes: undefined };
  const { props } = getImageProps({ src, alt: "", width: maxWidth, height: maxWidth, sizes, quality: 90 });
  const candidates = (props.srcSet ?? "").split(", ").filter(candidate => Number(candidate.split(" ")[1]?.slice(0, -1)) <= maxWidth);
  return { src: albumPhotoSource(src, maxWidth), srcSet: candidates.join(", "), sizes };
}
