const GOOGLE_SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);
const COORDINATE_PAIR_RE = /^(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/;
const LOCATION_QUERY_KEYS = ["destination", "daddr", "query", "q"] as const;
export const MAX_GOOGLE_MAPS_URL_LENGTH = 1_200;

function isGoogleHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (GOOGLE_SHORT_HOSTS.has(host)) return true;
  const labels = host.split(".");
  const googleIndex = labels.lastIndexOf("google");
  if (googleIndex < 0) return false;
  const suffix = labels.slice(googleIndex + 1);
  return (
    suffix.length >= 1 &&
    suffix.length <= 2 &&
    suffix.every((label) => /^[a-z]{2,}$/.test(label))
  );
}

function validCoordinates(latitude: number, longitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function coordinatePair(value: string): string | null {
  const match = value.trim().match(COORDINATE_PAIR_RE);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!validCoordinates(latitude, longitude)) return null;
  return `${match[1]},${match[2]}`;
}

function mapTextQuery(value: string): string | null {
  const url = new URL(value.trim());
  for (const key of LOCATION_QUERY_KEYS) {
    const query = url.searchParams.get(key)?.trim() ?? "";
    if (query) return query;
  }

  const place = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/i)?.[1];
  if (!place) return null;
  try {
    const query = decodeURIComponent(place.replace(/\+/g, " ")).trim();
    return query || null;
  } catch {
    return place.replace(/\+/g, " ").trim() || null;
  }
}

export function isGoogleMapsUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol) || !isGoogleHost(url.hostname)) return false;
    const hostname = url.hostname.toLowerCase();
    return (
      GOOGLE_SHORT_HOSTS.has(hostname) ||
      hostname.startsWith("maps.google.") ||
      url.pathname.startsWith("/maps")
    );
  } catch {
    return false;
  }
}

export function isGoogleMapsShortUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol)
      && !url.username && !url.password && !url.port
      && GOOGLE_SHORT_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export type DetectedMapLocation =
  | { type: "address"; value: string }
  | { type: "google-maps"; value: string; coordinates: string | null };

/** Detects whether a venue field contains a normal address or a Google Maps link. */
export function detectMapLocation(value: string | null | undefined): DetectedMapLocation {
  const trimmed = value?.trim() ?? "";
  if (!isGoogleMapsUrl(trimmed)) return { type: "address", value: trimmed };
  return {
    type: "google-maps",
    value: trimmed,
    coordinates: coordinatesFromGoogleMapsUrl(trimmed),
  };
}

/** Returns the most precise query available for a map embed or directions link. */
export function mapLocationQuery(value: string | null | undefined): string {
  const location = detectMapLocation(value);
  if (location.type === "address") return location.value;
  return location.coordinates ?? mapTextQuery(location.value) ?? location.value;
}

export function coordinatesFromGoogleMapsUrl(value: string): string | null {
  if (!isGoogleMapsUrl(value)) return null;

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    // URL parsing below still gives us a usable query when a pasted link has
    // an incomplete percent escape.
  }
  const placeCoordinates = decoded.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)(?=[!/?&#]|$)/);
  if (placeCoordinates) {
    return coordinatePair(`${placeCoordinates[1]},${placeCoordinates[2]}`);
  }

  const url = new URL(value.trim());
  for (const key of LOCATION_QUERY_KEYS) {
    const query = url.searchParams.get(key)?.trim();
    if (query) return coordinatePair(query);
  }
  const viewportCoordinates = decoded.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?=[,/?&#]|$)/);
  if (viewportCoordinates) {
    const coordinates = coordinatePair(`${viewportCoordinates[1]},${viewportCoordinates[2]}`);
    if (coordinates) return coordinates;
  }
  return coordinatePair(url.searchParams.get("ll") ?? "");
}
