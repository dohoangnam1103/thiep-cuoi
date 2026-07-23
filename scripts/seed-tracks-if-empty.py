#!/usr/bin/env python3
"""Seed the production Track table once without overwriting managed data."""

from __future__ import annotations

import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
from typing import Any


TRACK_COLUMNS = (
    "id",
    "title",
    "artist",
    "duration",
    "url",
    "tags",
    "status",
    "youtubeUrl",
    "submittedBy",
    "errorMessage",
    "market",
    "reviewedAt",
    "addedAt",
)


def normalize_datetime(value: Any, field: str, track_id: str) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError(f"{track_id}: {field} must be a string or null")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"{track_id}: invalid {field}") from error
    return parsed.isoformat(timespec="milliseconds")


def load_tracks(path: Path) -> list[tuple[Any, ...]]:
    raw_tracks = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw_tracks, list) or not raw_tracks:
        raise ValueError("tracks seed must be a non-empty JSON array")

    rows: list[tuple[Any, ...]] = []
    seen_ids: set[str] = set()
    for index, raw_track in enumerate(raw_tracks):
        if not isinstance(raw_track, dict):
            raise ValueError(f"track at index {index} must be an object")

        track_id = raw_track.get("id")
        if not isinstance(track_id, str) or not track_id:
            raise ValueError(f"track at index {index} has an invalid id")
        if track_id in seen_ids:
            raise ValueError(f"duplicate track id: {track_id}")
        seen_ids.add(track_id)

        for field in ("title", "artist", "url", "status", "market"):
            if not isinstance(raw_track.get(field), str) or not raw_track[field]:
                raise ValueError(f"{track_id}: invalid {field}")
        if not isinstance(raw_track.get("duration"), int) or raw_track["duration"] <= 0:
            raise ValueError(f"{track_id}: invalid duration")

        tags = raw_track.get("tags")
        if not isinstance(tags, list) or not all(isinstance(tag, str) for tag in tags):
            raise ValueError(f"{track_id}: tags must be a string array")

        rows.append(
            (
                track_id,
                raw_track["title"],
                raw_track["artist"],
                raw_track["duration"],
                raw_track["url"],
                json.dumps(tags, ensure_ascii=False, separators=(",", ":")),
                raw_track["status"],
                raw_track.get("youtubeUrl"),
                raw_track.get("submittedBy"),
                raw_track.get("errorMessage"),
                raw_track["market"],
                normalize_datetime(raw_track.get("reviewedAt"), "reviewedAt", track_id),
                normalize_datetime(raw_track.get("addedAt"), "addedAt", track_id),
            )
        )

    return rows


def seed_if_empty(database_path: Path, tracks_path: Path) -> None:
    rows = load_tracks(tracks_path)
    connection = sqlite3.connect(database_path, timeout=10)
    try:
        connection.execute("PRAGMA busy_timeout = 10000")
        table_exists = connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'Track'"
        ).fetchone()
        if not table_exists:
            raise RuntimeError("Track table does not exist; run migrations first")

        existing_count = connection.execute('SELECT COUNT(*) FROM "Track"').fetchone()[0]
        if existing_count:
            print(f"tracks_seed_skipped=1 existing_tracks={existing_count}")
            return

        placeholders = ", ".join("?" for _ in TRACK_COLUMNS)
        columns = ", ".join(f'"{column}"' for column in TRACK_COLUMNS)
        with connection:
            connection.executemany(
                f'INSERT INTO "Track" ({columns}) VALUES ({placeholders})',
                rows,
            )

        inserted_count = connection.execute('SELECT COUNT(*) FROM "Track"').fetchone()[0]
        if inserted_count != len(rows):
            raise RuntimeError(
                f"Track seed verification failed: expected {len(rows)}, found {inserted_count}"
            )
        print(f"tracks_seeded={inserted_count}")
    finally:
        connection.close()


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(
            "usage: seed-tracks-if-empty.py <database-path> <tracks-json-path>"
        )
    seed_if_empty(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()
