import { templatePreviewVersion } from "@/data/template-preview-version";

export function templatePreviewUrl(source: string): string {
  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}v=${templatePreviewVersion}`;
}
