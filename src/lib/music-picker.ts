export type TrackLabel = {
  url: string;
  title: string;
  artist: string;
};

export type MusicPickerMessages = {
  label: string;
  dialogTitle: string;
  choose: string;
  change: string;
  remove: string;
  searchPlaceholder: string;
  loading: string;
  empty: string;
  loadMore: string;
  currentMusic: string;
  preview: string;
  stopPreview: string;
  select: string;
  close: string;
  error: string;
};

export function dispatchMusicChange(target: EventTarget) {
  target.dispatchEvent(new Event("change", { bubbles: true }));
}

export function formatTrackDuration(duration: number) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.max(0, duration % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function selectedTrackLabel(
  value: string,
  tracks: TrackLabel[],
  currentMusicLabel: string,
) {
  const selected = tracks.find((track) => track.url === value);
  return selected
    ? `${selected.title} — ${selected.artist}`
    : `${currentMusicLabel}: ${value}`;
}
