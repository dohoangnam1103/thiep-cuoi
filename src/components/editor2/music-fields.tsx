"use client";

import { Music2, Pause, Play, RotateCcw, RotateCw, Search } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { clampMusicStart, fallbackMusicTitle, musicStartLimit, musicTime, musicWavePeaks, normalizeMusicSearch } from "@/lib/editor2-music";
import { DEFAULT_INVITATION_MUSIC, DEFAULT_INVITATION_MUSIC_ARTIST, DEFAULT_INVITATION_MUSIC_TITLE } from "@/lib/invitation-music";

type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
};

const DEFAULT_TRACK: Track = {
  id: "editor2-default-music",
  title: DEFAULT_INVITATION_MUSIC_TITLE,
  artist: DEFAULT_INVITATION_MUSIC_ARTIST,
  duration: 263,
  url: DEFAULT_INVITATION_MUSIC,
};

type MusicPatch = {
  music?: string;
  musicEnabled?: boolean;
  musicStartAt?: number;
  musicTitle?: string;
  musicArtist?: string;
};

export function Editor2MusicFields({ value, title, artist, startAt, enabled, onChange }: {
  value: string;
  title: string;
  artist: string;
  startAt: number;
  enabled: boolean;
  onChange: (patch: MusicPatch) => void;
}) {
  const t = useTranslations("editor2");
  const selectedAudio = useRef<HTMLAudioElement>(null);
  const auditionAudio = useRef<HTMLAudioElement>(null);
  const pendingSeek = useRef<number | null>(null);
  const appliedDefault = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [auditionUrl, setAuditionUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState(false);
  const [audioError, setAudioError] = useState("");
  const displayTitle = title.trim() || (value ? fallbackMusicTitle(value) : t("musicNoTrack"));
  const peaks = musicWavePeaks(value || "editor2-music");
  const maximum = musicStartLimit(duration);
  const start = clampMusicStart(startAt, duration);
  const defaultMatches = !query.trim()
    || normalizeMusicSearch(`${DEFAULT_TRACK.title} ${DEFAULT_TRACK.artist}`).includes(normalizeMusicSearch(query));
  const visibleTracks = defaultMatches ? [DEFAULT_TRACK, ...tracks.filter(track => track.url !== DEFAULT_TRACK.url)] : tracks;

  function stopAudio() {
    selectedAudio.current?.pause();
    auditionAudio.current?.pause();
    setAuditionUrl(null);
  }

  // Opening an unconfigured invitation starts from the site-wide default song.
  useEffect(() => {
    if (value || appliedDefault.current) return;
    appliedDefault.current = true;
    onChange({ music: DEFAULT_INVITATION_MUSIC, musicTitle: DEFAULT_INVITATION_MUSIC_TITLE, musicArtist: DEFAULT_INVITATION_MUSIC_ARTIST, musicStartAt: 0 });
  }, [value, onChange]);

  useEffect(() => {
    const audio = selectedAudio.current;
    if (!audio) return;
    audio.pause();
    setPlaying(false);
    setDuration(0);
    setAudioError("");
    pendingSeek.current = null;
    if (!value) {
      audio.removeAttribute("src");
      audio.load();
      return;
    }
    audio.src = value;
    audio.load();
    return () => audio.pause();
  }, [value]);

  useEffect(() => () => {
    selectedAudio.current?.pause();
    auditionAudio.current?.pause();
  }, []);

  useEffect(() => {
    if (listOpen) return;
    auditionAudio.current?.pause();
    setAuditionUrl(null);
  }, [listOpen]);

  useEffect(() => {
    if (!listOpen) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setListError(false);
      try {
        const params = new URLSearchParams({ locale: "vi", q: query.trim(), limit: "20", offset: "0" });
        const response = await fetch(`/api/tracks?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error("tracks request failed");
        const data = await response.json() as { tracks: Track[] };
        setTracks(data.tracks);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setListError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query ? 280 : 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [listOpen, query]);

  function playFrom(seconds: number) {
    const audio = selectedAudio.current;
    if (!audio || !value) return;
    if (audio.getAttribute("src") !== value) {
      audio.src = value;
      audio.load();
    }
    setAudioError("");
    const next = clampMusicStart(seconds, audio.duration || duration || undefined);
    pendingSeek.current = next;
    if (audio.readyState >= 1) {
      audio.currentTime = next;
      pendingSeek.current = null;
    }
    void audio.play().catch(() => setAudioError(t("musicAudioError")));
  }

  function toggle() {
    const audio = selectedAudio.current;
    if (!audio || !value) return;
    if (!audio.paused) { audio.pause(); return; }
    playFrom(start);
  }

  function choose(track: Track) {
    stopAudio();
    onChange({ music: track.url, musicTitle: track.title, musicArtist: track.artist, musicStartAt: 0 });
    setListOpen(false);
    setQuery("");
    setAudioError("");
  }

  function toggleAudition(track: Track) {
    const audio = auditionAudio.current;
    if (!audio) return;
    if (auditionUrl === track.url && !audio.paused) { audio.pause(); setAuditionUrl(null); return; }
    audio.src = track.url;
    void audio.play().then(() => setAuditionUrl(track.url)).catch(() => setAuditionUrl(null));
  }

  function nudge(delta: number) {
    const next = clampMusicStart(start + delta, duration);
    onChange({ musicStartAt: next });
    playFrom(next);
  }

  function changeStart(event: ChangeEvent<HTMLInputElement>) {
    const next = Number(event.currentTarget.value);
    onChange({ musicStartAt: next });
    const audio = selectedAudio.current;
    if (audio && !audio.paused) audio.currentTime = clampMusicStart(next, audio.duration || duration || undefined);
  }

  function commitStart(event: { currentTarget: HTMLInputElement; key?: string }) {
    if (event.key !== undefined && !/^(Arrow|Home|End|Page)/.test(event.key)) return;
    playFrom(Number(event.currentTarget.value));
  }

  return <div className="e2-music">
    <label className="e2-checkbox"><input type="checkbox" checked={enabled} onChange={event => onChange({ musicEnabled: event.target.checked })} />{t("musicAutoPlay")}</label>

    <div className="e2-music-current">
      <button type="button" className="e2-button e2-music-play" disabled={!value} onClick={toggle}
        aria-label={t(playing ? "musicPause" : "musicPlay")}>
        {playing ? <Pause size={17} aria-hidden /> : <Play size={17} aria-hidden />}
      </button>
      <div className="e2-music-copy">
        <strong>{displayTitle}</strong>
        <span>{value ? artist.trim() || t("musicDefaultArtist") : t("musicNoTrackHint")}</span>
      </div>
      <button type="button" className="e2-button" onClick={() => setListOpen(open => !open)} aria-expanded={listOpen}>
        {value ? t("musicChange") : t("musicChoose")}
      </button>
    </div>

    {value && <>
      <div className="e2-music-start">
        <span>{t("musicStartFrom")} <strong>{musicTime(start)}</strong></span>
        <span>{duration ? musicTime(duration) : ""}</span>
      </div>
      <div className="e2-music-wave">
        <svg viewBox="0 0 288 48" preserveAspectRatio="none" aria-hidden="true">
          {peaks.map((peak, index) => <rect key={index} x={index * 4} y={(48 - Math.max(3, peak)) / 2} width="2.5" height={Math.max(3, peak)} rx="1.25" />)}
        </svg>
        <input type="range" min={0} max={maximum || 1} step={1} value={start} disabled={!maximum}
          aria-label={t("musicStartFrom")} onChange={changeStart}
          onPointerUp={event => commitStart({ currentTarget: event.currentTarget })}
          onKeyUp={event => commitStart({ currentTarget: event.currentTarget, key: event.key })} />
      </div>
      <div className="e2-music-seek">
        <button type="button" className="e2-button e2-music-nudge" aria-label={t("musicNudgeBack", { seconds: 5 })} disabled={!maximum || start === 0} onClick={() => nudge(-5)}>
          <RotateCcw size={15} aria-hidden />{t("musicNudgeSeconds", { seconds: 5 })}
        </button>
        <p className="e2-description">{duration ? t("musicHelp") : t("musicDurationHint")}</p>
        <button type="button" className="e2-button e2-music-nudge" aria-label={t("musicNudgeForward", { seconds: 5 })} disabled={!maximum || start >= maximum} onClick={() => nudge(5)}>
          {t("musicNudgeSeconds", { seconds: 5 })}<RotateCw size={15} aria-hidden />
        </button>
      </div>
    </>}

    {listOpen && <div className="e2-music-picker">
      <label className="e2-field"><span>{t("musicSearch")}</span>
        <span className="e2-music-search">
          <Search size={16} aria-hidden />
          <input type="search" value={query} placeholder={t("musicSearch")} aria-label={t("musicSearch")} onChange={event => setQuery(event.target.value)} />
        </span>
      </label>
      {listError ? <p className="e2-error" role="alert">{t("musicListError")}</p>
        : visibleTracks.length === 0 ? <p className="e2-description">{loading ? t("musicLoading") : t("musicEmpty")}</p>
          : <ul className="e2-music-tracks">
            {visibleTracks.map(track => <li key={track.id} className="e2-music-track" data-selected={track.url === value || undefined}>
              <button type="button" className="e2-button e2-icon-button e2-music-track-play" aria-label={t(auditionUrl === track.url ? "musicPause" : "musicPlay")}
                onClick={() => toggleAudition(track)}>{auditionUrl === track.url ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}</button>
              <button type="button" className="e2-music-track-select" onClick={() => choose(track)}>
                <span><strong>{track.title}</strong><span>{track.artist || t("musicDefaultArtist")} · {musicTime(track.duration)}</span></span>
                {track.url === value && <Music2 size={16} aria-hidden />}
              </button>
            </li>)}
          </ul>}
    </div>}

    {audioError && <p className="e2-error" role="alert">{audioError}</p>}
    <audio ref={selectedAudio} preload="metadata" aria-hidden="true"
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onLoadedMetadata={event => {
        const audio = event.currentTarget;
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
        if (pendingSeek.current !== null) {
          audio.currentTime = clampMusicStart(pendingSeek.current, audio.duration);
          pendingSeek.current = null;
        }
      }}
      onError={() => { setPlaying(false); setAudioError(t("musicAudioError")); }} />
    <audio ref={auditionAudio} preload="none" aria-hidden="true" onEnded={() => setAuditionUrl(null)} onError={() => setAuditionUrl(null)} />
  </div>;
}
