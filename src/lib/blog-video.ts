export type NormalizedBlogVideo =
  | { type: "youtube"; src: string; videoId: string }
  | { type: "mp4"; src: string };

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function youtubeId(url: URL): string | null {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");

  if (hostname === "youtu.be") {
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  }

  if (hostname !== "youtube.com" && hostname !== "youtube-nocookie.com") {
    return null;
  }

  if (url.pathname === "/watch") {
    return url.searchParams.get("v");
  }

  const [kind, id] = url.pathname.split("/").filter(Boolean);
  return kind === "embed" ? id ?? null : null;
}

export function normalizeBlogVideoUrl(value: string): NormalizedBlogVideo | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  const id = youtubeId(url);
  if (id && YOUTUBE_ID.test(id)) {
    return {
      type: "youtube",
      videoId: id,
      src: `https://www.youtube-nocookie.com/embed/${id}`,
    };
  }

  if (
    url.protocol === "https:"
    && url.pathname.toLowerCase().endsWith(".mp4")
    && !url.username
    && !url.password
  ) {
    return { type: "mp4", src: url.toString() };
  }

  return null;
}
