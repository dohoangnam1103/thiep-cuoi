import assert from "node:assert/strict";
import test from "node:test";

import { parseTrackQuery, toTrackDto } from "./tracks";

test("vi locale includes Vietnamese and global tracks", () => {
  assert.deepEqual(parseTrackQuery(new URLSearchParams("locale=vi")).where, {
    status: "ready",
    market: { in: ["vn", "all"] },
  });
});

test("non-Vietnamese locales include only global tracks", () => {
  assert.deepEqual(parseTrackQuery(new URLSearchParams("locale=en")).where, {
    status: "ready",
    market: "all",
  });
});

test("search trims query and clamps pagination", () => {
  assert.deepEqual(
    parseTrackQuery(
      new URLSearchParams("locale=vi&q=%20Perfect%20&limit=500&offset=-4"),
    ),
    {
      where: {
        status: "ready",
        market: { in: ["vn", "all"] },
        OR: [
          { title: { contains: "Perfect" } },
          { artist: { contains: "Perfect" } },
        ],
      },
      take: 50,
      skip: 0,
    },
  );
});

test("track DTO parses tags and excludes private metadata", () => {
  assert.deepEqual(
    toTrackDto({
      id: "track-1",
      title: "Perfect",
      artist: "Ed Sheeran",
      duration: 263,
      url: "https://cdn.example.com/perfect.mp3",
      tags: '["wedding","english"]',
      market: "all",
      submittedBy: "private-user",
      errorMessage: null,
      youtubeUrl: "https://youtube.com/watch?v=test",
    }),
    {
      id: "track-1",
      title: "Perfect",
      artist: "Ed Sheeran",
      duration: 263,
      url: "https://cdn.example.com/perfect.mp3",
      tags: ["wedding", "english"],
      market: "all",
    },
  );
});

test("track DTO returns no tags for malformed stored JSON", () => {
  assert.deepEqual(
    toTrackDto({
      id: "track-2",
      title: "Song",
      artist: "Artist",
      duration: 120,
      url: "https://cdn.example.com/song.mp3",
      tags: "",
      market: "vn",
    }).tags,
    [],
  );
});
