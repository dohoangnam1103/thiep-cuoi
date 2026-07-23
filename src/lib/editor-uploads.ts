import path from "node:path";

const EDITOR_UPLOAD_FILENAME = /^[0-9a-f-]{36}\.webp$/;

export function editorUploadRoot(): string {
  return process.env.EDITOR_UPLOAD_ROOT ??
    path.join(/* turbopackIgnore: true */ process.cwd(), "data", "editor-uploads");
}

export function editorUploadPath(filename: string): string | null {
  if (!EDITOR_UPLOAD_FILENAME.test(filename)) return null;
  return path.join(/* turbopackIgnore: true */ editorUploadRoot(), filename);
}

export function legacyEditorUploadPath(filename: string): string | null {
  if (!EDITOR_UPLOAD_FILENAME.test(filename)) return null;
  return path.join(/* turbopackIgnore: true */ process.cwd(), "public", "uploads", filename);
}

export function editorUploadPublicUrl(filename: string): string {
  return `/uploads/${filename}`;
}
