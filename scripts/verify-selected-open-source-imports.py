#!/usr/bin/env python3
"""Fail closed when imported game entrypoints reference missing local files."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import sys

ROOT = Path(__file__).resolve().parents[1] / "public" / "arcade" / "hosted"
GAMES = {
    "a-dark-room": "LICENSE.md",
    "evolution-of-trust": "LICENSE",
}

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("src"):
            self.paths.append(attrs["src"])
        if tag == "link" and attrs.get("href") and attrs.get("rel") in ("stylesheet", "icon", "shortcut icon", "image_src"):
            self.paths.append(attrs["href"])

failures = []
for game, license_name in GAMES.items():
    base = ROOT / game
    if not (base / license_name).is_file():
        failures.append(f"{game}: missing upstream license {license_name}")
        continue
    index = base / "index.html"
    if not index.is_file():
        failures.append(f"{game}: missing index.html")
        continue
    html = index.read_text(encoding="utf-8")
    parser = Links()
    parser.feed(html)
    for ref in parser.paths:
        if ref.startswith(("http://", "https://", "//", "data:", "#")):
            if ref.startswith(("http://", "https://", "//")) and "googletagmanager" in ref:
                failures.append(f"{game}: remote analytics still present: {ref}")
            continue
        path = urlsplit(ref).path
        if not path or path.endswith("/"):
            continue
        resolved = (base / path).resolve()
        if not resolved.is_relative_to(base.resolve()) or not resolved.is_file():
            failures.append(f"{game}: missing or unsafe local resource {ref}")
    print(f"{game}: checked {len(parser.paths)} entrypoint references")
if failures:
    print("\n".join(failures), file=sys.stderr)
    sys.exit(1)
print("Selected-game entrypoint checks passed (browser gameplay and assets loaded dynamically remain unverified).")
