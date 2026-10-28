import assert from "node:assert/strict";
import test from "node:test";
import { clampMusicStart, fallbackMusicTitle, musicStartLimit, musicTime, musicWavePeaks, normalizeMusicSearch } from "./editor2-music";

test("music start stays inside the track and leaves a second to hear", () => {
  assert.equal(musicStartLimit(undefined), 0);
  assert.equal(musicStartLimit(180.9), 179);
  assert.equal(clampMusicStart(-5, 180), 0);
  assert.equal(clampMusicStart(999, 180), 179);
  assert.equal(clampMusicStart(42, undefined), 42);
  assert.equal(clampMusicStart(Number.NaN), 0);
});

test("stored media without catalog metadata keeps a readable title", () => {
  assert.equal(fallbackMusicTitle("/chungdoi/music/double-dragon-blue.mp3"), "Double Dragon Blue");
  assert.equal(fallbackMusicTitle("https://cdn.chungdoi.com/music/yt-a79ab65a-b2d.mp3"), "Yt A79ab65a B2d");
  assert.equal(fallbackMusicTitle(""), "");
  assert.equal(musicTime(0), "00:00");
  assert.equal(musicTime(299.8), "04:59");
});

test("waveform peaks are stable for a track and vary by track", () => {
  const first = musicWavePeaks("/chungdoi/music/song-hy-red.mp3");
  assert.deepEqual(first, musicWavePeaks("/chungdoi/music/song-hy-red.mp3"));
  assert.notDeepEqual(first, musicWavePeaks("/chungdoi/music/song-hy-green.mp3"));
  assert.equal(first.length, 72);
  assert.ok(first.every(peak => peak >= 8 && peak <= 48));
});

test("default-track search ignores Vietnamese diacritics", () => {
  assert.equal(normalizeMusicSearch("Thế giới của anh"), "the gioi cua anh");
  assert.equal(normalizeMusicSearch("  ĐỔI   MỚI "), "doi moi");
});
