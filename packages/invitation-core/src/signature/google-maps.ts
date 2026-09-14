const GOOGLE_SHORT_HOSTS = new Set(["maps.app.goo.gl", "goo.gl"]);
const COORDINATE_PAIR_RE = /(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)/;

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
  const match = value.match(COORDINATE_PAIR_RE);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!validCoordinates(latitude, longitude)) return null;
  return `${match[1]},${match[2]}`;
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
    return ["http:", "https:"].includes(url.protocol) && GOOGLE_SHORT_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function coordinatesFromGoogleMapsUrl(value: string): string | null {
  if (!isGoogleMapsUrl(value)) return null;

  const decoded = decodeURIComponent(value);
  const placeCoordinates = decoded.match(/!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/);
  if (placeCoordinates) {
    return coordinatePair(`${placeCoordinates[1]},${placeCoordinates[2]}`);
  }

  const viewportCoordinates = decoded.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (viewportCoordinates) {
    return coordinatePair(`${viewportCoordinates[1]},${viewportCoordinates[2]}`);
  }

  const url = new URL(value.trim());
  for (const key of ["q", "query", "ll", "destination", "daddr"]) {
    const coordinates = coordinatePair(url.searchParams.get(key) ?? "");
    if (coordinates) return coordinates;
  }
  return null;
}
