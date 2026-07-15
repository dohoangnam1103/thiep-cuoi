import assert from "node:assert/strict";
import test from "node:test";

import { dispatchMusicChange, formatTrackDuration, selectedTrackLabel } from "./music-picker";

test("formats track duration as minutes and padded seconds", () => {
  assert.equal(formatTrackDuration(229), "3:49");
});

test("uses track title and artist for selected library track", () => {
  assert.equal(
    selectedTrackLabel(
      "https://cdn.example.com/perfect.mp3",
      [{ url: "https://cdn.example.com/perfect.mp3", title: "Perfect", artist: "Ed Sheeran" }],
      "Current music",
    ),
    "Perfect — Ed Sheeran",
  );
});

test("keeps legacy music URL visible when no library track matches", () => {
  assert.equal(
    selectedTrackLabel("/chungdoi/music/royal-red.mp3", [], "Current music"),
    "Current music: /chungdoi/music/royal-red.mp3",
  );
});

test("notifies form draft listeners when music changes", () => {
  const events: Event[] = [];
  const field = new EventTarget();
  field.addEventListener("change", (event) => events.push(event));

  dispatchMusicChange(field);

  assert.equal(events.length, 1);
  assert.equal(events[0].bubbles, true);
});
