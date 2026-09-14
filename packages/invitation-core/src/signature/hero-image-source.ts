/** Bundled template photos are defaults, not a user's dedicated upload.
 * Old demo seeds persisted them in heroImage and silently overrode new albums.
 * Keep uploaded/external images intact; resolve album defaults at render time.
 */
export function dedicatedHeroImage(value: string | null | undefined): string {
  const url = value?.trim() ?? "";
  return url.startsWith("/chungdoi/images/") ? "" : url;
}
