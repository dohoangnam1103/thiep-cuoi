#!/usr/bin/env python3
from __future__ import annotations

import sys
from html.parser import HTMLParser
from urllib.parse import urlparse


class CanonicalParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() != "link":
            return
        values = {key.lower(): value for key, value in attrs}
        rel = (values.get("rel") or "").lower().split()
        href = values.get("href")
        if "canonical" in rel and href:
            self.hrefs.append(href)


if len(sys.argv) != 2:
    raise SystemExit("Usage: canonical-path-from-html.py <public-url>")

public_url = urlparse(sys.argv[1])
parser = CanonicalParser()
parser.feed(sys.stdin.read())

if len(parser.hrefs) != 1:
    raise SystemExit(f"Expected exactly one canonical URL, found {len(parser.hrefs)}")

canonical = urlparse(parser.hrefs[0])
if (canonical.scheme, canonical.netloc) != (public_url.scheme, public_url.netloc):
    raise SystemExit("Canonical URL points outside the configured public origin")
if not canonical.path.startswith("/") or canonical.query or canonical.fragment:
    raise SystemExit("Canonical URL must contain one absolute path without query or fragment")

print(canonical.path)
