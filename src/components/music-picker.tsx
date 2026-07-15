"use client";

import { Music, Pause, Play, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  dispatchMusicChange,
  formatTrackDuration,
  selectedTrackLabel,
  type MusicPickerMessages,
  type TrackLabel,
} from "@/lib/music-picker";

type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  tags: string[];
  market: string;
};

type MusicPickerProps = {
  defaultValue?: string;
  initialTrack?: TrackLabel | null;
  locale: string;
  messages: MusicPickerMessages;
};

const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

function MusicSearchInput({
  locale,
  placeholder,
  onSearch,
}: {
  locale: string;
  placeholder: string;
  onSearch: (query: string) => void;
}) {
  const [value, setValue] = useState("");
  const composingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  function scheduleSearch(nextValue: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(nextValue);
      timerRef.current = null;
    }, SEARCH_DELAY_MS);
  }

  return (
    <label className="relative block" data-form-draft-ignore>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        lang={locale}
        autoComplete="off"
        enterKeyHint="search"
        onCompositionStart={() => {
          composingRef.current = true;
          if (timerRef.current) clearTimeout(timerRef.current);
        }}
        onCompositionEnd={(event) => {
          composingRef.current = false;
          const nextValue = event.currentTarget.value;
          setValue(nextValue);
          scheduleSearch(nextValue);
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setValue(nextValue);
          if (!composingRef.current && !(event.nativeEvent as InputEvent).isComposing) {
            scheduleSearch(nextValue);
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-ring"
      />
    </label>
  );
}

export function MusicPicker({
  defaultValue = "",
  initialTrack = null,
  locale,
  messages,
}: MusicPickerProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicInputRef = useRef<HTMLInputElement | null>(null);
  const mountedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const [selectedTrack, setSelectedTrack] = useState<TrackLabel | null>(initialTrack);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [query, setQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const onSearch = useCallback((nextQuery: string) => setQuery(nextQuery), []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (musicInputRef.current) dispatchMusicChange(musicInputRef.current);
  }, [value]);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({
          locale,
          q: query.trim(),
          limit: String(PAGE_SIZE),
          offset: "0",
        });
        const response = await fetch(`/api/tracks?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("tracks request failed");
        const data = (await response.json()) as { tracks: Track[]; total: number };
        setTracks(data.tracks);
        setTotal(data.total);
      } catch (requestError) {
        if ((requestError as Error).name !== "AbortError") {
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => {
      controller.abort();
    };
  }, [locale, open, query]);

  function stopPreview() {
    audioRef.current?.pause();
    setPlayingUrl(null);
  }

  async function togglePreview(url: string) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playingUrl === url && !audio.paused) {
      stopPreview();
      return;
    }

    audio.src = url;
    try {
      await audio.play();
      setPlayingUrl(url);
    } catch {
      setPlayingUrl(null);
    }
  }

  async function loadMore() {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        locale,
        q: query.trim(),
        limit: String(PAGE_SIZE),
        offset: String(tracks.length),
      });
      const response = await fetch(`/api/tracks?${params}`);
      if (!response.ok) throw new Error("tracks request failed");
      const data = (await response.json()) as { tracks: Track[]; total: number };
      setTracks((current) => [...current, ...data.tracks]);
      setTotal(data.total);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const selectedLabel = value
    ? selectedTrackLabel(
        value,
        selectedTrack ? [selectedTrack] : tracks,
        messages.currentMusic,
      )
    : messages.remove;

  return (
    <div>
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {messages.label}
      </span>
      <input ref={musicInputRef} id="music" type="hidden" name="music" value={value} />
      <div className="rounded-xl border border-border bg-background p-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Music className="size-5" aria-hidden />
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
            {selectedLabel}
          </p>
          {value ? (
            <button
              type="button"
              onClick={() => void togglePreview(value)}
              className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition hover:bg-muted"
              aria-label={playingUrl === value ? messages.stopPreview : messages.preview}
            >
              {playingUrl === value ? (
                <Pause className="size-4" aria-hidden />
              ) : (
                <Play className="size-4 fill-current" aria-hidden />
              )}
            </button>
          ) : null}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            {value ? messages.change : messages.choose}
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => {
                stopPreview();
                setValue("");
                setSelectedTrack(null);
              }}
              className="rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              {messages.remove}
            </button>
          ) : null}
        </div>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => {
          setOpen(false);
          stopPreview();
        }}
        onCancel={() => setOpen(false)}
        className="m-auto max-h-[85dvh] w-[min(42rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/55"
      >
        <div className="flex max-h-[85dvh] flex-col">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-lg font-bold">{messages.dialogTitle}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label={messages.close}
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="border-b border-border p-4">
            <MusicSearchInput
              locale={locale}
              placeholder={messages.searchPlaceholder}
              onSearch={onSearch}
            />
          </div>

          <div className="min-h-52 flex-1 overflow-y-auto p-3">
            {error ? (
              <p className="px-3 py-10 text-center text-sm text-destructive">{messages.error}</p>
            ) : !tracks.length && loading ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">{messages.loading}</p>
            ) : !tracks.length ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">{messages.empty}</p>
            ) : (
              <ul className="space-y-1">
                {tracks.map((track) => {
                  const playing = playingUrl === track.url;
                  return (
                    <li key={track.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/70">
                      <button
                        type="button"
                        onClick={() => void togglePreview(track.url)}
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-background text-primary transition hover:border-primary"
                        aria-label={playing ? messages.stopPreview : messages.preview}
                      >
                        {playing ? (
                          <Pause className="size-4" aria-hidden />
                        ) : (
                          <Play className="size-4 fill-current" aria-hidden />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{track.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {track.artist} · {formatTrackDuration(track.duration)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setValue(track.url);
                          setSelectedTrack(track);
                          stopPreview();
                          setOpen(false);
                        }}
                        className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                      >
                        {messages.select}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {!error && tracks.length < total ? (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={() => void loadMore()}
                  disabled={loading}
                  className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                >
                  {loading ? messages.loading : messages.loadMore}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </dialog>

      <audio ref={audioRef} preload="none" onEnded={() => setPlayingUrl(null)} />
    </div>
  );
}
