const MASTER_HOSTNAME = "thiepmungonline.com";

const LOOPBACK_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
]);

export function resolveSite2Url(
  value: string | undefined,
  nodeEnv: string,
): string {
  if (!value) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for site 2");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL");
  }
  if (nodeEnv === "production") {
    if (url.protocol !== "https:") {
      throw new Error("site 2 production requires an HTTPS origin");
    }
    if (LOOPBACK_HOSTNAMES.has(url.hostname)) {
      throw new Error("site 2 production must not use a loopback origin");
    }
    if (
      url.hostname === MASTER_HOSTNAME ||
      url.hostname.endsWith(`.${MASTER_HOSTNAME}`)
    ) {
      throw new Error("site 2 must not reuse the master hostname");
    }
  }
  return url.origin;
}
