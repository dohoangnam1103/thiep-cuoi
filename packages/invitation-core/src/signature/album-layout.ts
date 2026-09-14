export type AlbumLayout = "grid" | "mosaic" | "coverflow";

export function normalizeAlbumLayout(value: string | null | undefined): AlbumLayout {
  return value === "mosaic" || value === "coverflow" ? value : "grid";
}
