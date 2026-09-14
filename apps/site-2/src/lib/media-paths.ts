import path from "node:path";

// All site-2 uploads live under the mounted data root (container:
// /app/data, host: /srv/chungdoi-site2/data). Nothing may reference the
// master media directories (/srv/thiepmungonline, public/chungdoi/uploads).

export function resolveMediaRoot(dataRoot: string): string {
  return path.posix.join(dataRoot, "media");
}

export function resolveUploadsRoot(dataRoot: string): string {
  return path.posix.join(resolveMediaRoot(dataRoot), "uploads");
}

/**
 * Resolve a user-supplied relative path under a root directory. Throws on
 * absolute input or `..` traversal so routes can never escape the data root.
 */
export function resolveMediaPath(root: string, unsafeRelative: string): string {
  if (path.posix.isAbsolute(unsafeRelative) || path.win32.isAbsolute(unsafeRelative)) {
    throw new Error("media path must be relative");
  }
  const normalized = path.posix.normalize(unsafeRelative);
  if (normalized === ".." || normalized.startsWith("../") || normalized.startsWith("..\\")) {
    throw new Error("media path must not traverse outside the media root");
  }
  const resolved = path.posix.join(root, normalized);
  const rootWithSep = root.endsWith("/") ? root : `${root}/`;
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw new Error("media path must stay inside the media root");
  }
  return resolved;
}

export function getDataRoot(): string {
  return process.env.SITE2_DATA_ROOT ?? "/app/data";
}
