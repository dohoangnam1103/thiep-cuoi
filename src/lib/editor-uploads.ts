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

/**
 * Checks an editor-upload URL before it is persisted in another record. This
 * keeps those records limited to files served by our upload route instead of
 * accepting arbitrary or traversal-shaped paths.
 */
export function isEditorUploadPublicUrl(value: string): boolean {
  const prefix = "/uploads/";
  if (!value.startsWith(prefix)) return false;
  return EDITOR_UPLOAD_FILENAME.test(value.slice(prefix.length));
}
