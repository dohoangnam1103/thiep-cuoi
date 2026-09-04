"use client";

import { Music2, Pause, Play, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
};

export function SlideshowMusicPicker({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const selected = tracks.find((track) => track.url === value);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ locale: "vi", q: query, limit: "30", offset: "0" });
      void fetch(`/api/tracks?${params}`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("tracks request failed");
          return response.json() as Promise<{ tracks: Track[] }>;
        })
        .then((result) => setTracks(result.tracks))
        .catch((error: unknown) => {
          if ((error as Error).name !== "AbortError") setTracks([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function close() {
    audioRef.current?.pause();
    setPlaying(null);
    dialogRef.current?.close();
  }

  async function toggle(url: string) {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing === url && !audio.paused) {
      audio.pause();
      setPlaying(null);
      return;
    }
    audio.src = url;
    try {
      await audio.play();
      setPlaying(url);
    } catch {
      setPlaying(null);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm font-medium text-white/75">
        <Music2 aria-hidden="true" size={16} strokeWidth={1.75} />
        Nhạc nền
      </div>
      <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-3">
        <p className="truncate text-sm text-white/80">{selected ? `${selected.title} · ${selected.artist}` : value ? "Nhạc đã chọn" : "Chưa chọn nhạc"}</p>
        {!disabled ? (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => dialogRef.current?.showModal()} className="flex-1 rounded-full border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/8">
              {value ? "Đổi bài" : "Chọn từ thư viện"}
            </button>
            {value ? <button type="button" onClick={() => onChange("")} className="rounded-full px-3 py-2 text-xs text-white/45 hover:text-white">Bỏ nhạc</button> : null}
          </div>
        ) : null}
      </div>

      <dialog ref={dialogRef} onClose={close} className="m-auto max-h-[82dvh] w-[min(42rem,calc(100%-2rem))] overflow-hidden rounded-2xl border border-white/15 bg-[#171714] p-0 text-white shadow-2xl backdrop:bg-black/70">
        <div className="flex max-h-[82dvh] flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <h2 className="font-semibold">Chọn nhạc nền</h2>
            <button type="button" onClick={close} aria-label="Đóng" className="grid size-9 place-items-center rounded-full hover:bg-white/10"><X size={18} /></button>
          </header>
          <label className="relative m-4 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên bài hát hoặc ca sĩ" className="h-11 w-full rounded-xl border border-white/12 bg-white/5 pl-10 pr-3 text-sm outline-none focus:border-[#d8ff3e]/60" />
          </label>
          <div className="min-h-56 flex-1 overflow-y-auto px-3 pb-4">
            {loading && !tracks.length ? <p className="py-10 text-center text-sm text-white/40">Đang tải thư viện…</p> : tracks.length ? (
              <ul className="space-y-1">
                {tracks.map((track) => (
                  <li key={track.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/6">
                    <button type="button" onClick={() => void toggle(track.url)} aria-label="Nghe thử" className="grid size-9 place-items-center rounded-full border border-white/15 text-[#d8ff3e]">
                      {playing === track.url ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
                    </button>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{track.title}</p><p className="truncate text-xs text-white/40">{track.artist}</p></div>
                    <button type="button" onClick={() => { onChange(track.url); close(); }} className="rounded-full bg-[#d8ff3e] px-3 py-1.5 text-xs font-semibold text-black">Chọn</button>
                  </li>
                ))}
              </ul>
            ) : <p className="py-10 text-center text-sm text-white/40">Không tìm thấy bài hát.</p>}
          </div>
        </div>
      </dialog>
      <audio ref={audioRef} preload="none" onEnded={() => setPlaying(null)} />
    </div>
  );
}
