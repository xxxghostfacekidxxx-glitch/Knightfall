#!/usr/bin/env python3
"""Add verified staged game routes to the arcade catalog; safe to rerun."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
catalog = root / "public/arcade-30-games.html"
html = catalog.read_text(encoding="utf-8")
games = [
    ("a-dark-room", "A Dark Room", "Survival", "MPL 2.0", "doublespeakgames/adarkroom",
     "A minimalist survival adventure. Gather supplies, explore, and uncover a strange story."),
    ("evolution-of-trust", "The Evolution of Trust", "Strategy", "CC0", "ncase/trust",
     "Interactive game theory about cooperation, betrayal, and why trust matters."),
]
cards = []
for slug, title, category, license_name, upstream, desc in games:
    assert (root / "public/arcade/hosted" / slug / "index.html").is_file(), slug
    assert (root / "public/arcade/hosted" / slug / "UPSTREAM.txt").is_file(), slug
    route = f"/arcade/hosted/{slug}/index.html"
    cards.append(
        f'<article class="game" data-category="{category}"><div class="meta">'
        f'<span>OPEN SOURCE · LOCALLY HOSTED</span><span>{license_name}</span></div>'
        f'<h2>{title}</h2><p>{desc}</p><div class="license">'
        f'Original authors credited · License and source retained</div>'
        f'<div class="actions"><a class="play" href="{route}">Play {title}</a>'
        f'<a class="source" href="https://github.com/{upstream}" target="_blank" '
        f'rel="noopener noreferrer">Original source</a></div></article>'
    )
if all(f'href="/arcade/hosted/{slug}/index.html"' in html for slug, *_ in games):
    print("Catalog routes already exist; no change.")
    raise SystemExit(0)
if any(f'href="/arcade/hosted/{slug}/index.html"' in html for slug, *_ in games):
    raise SystemExit("Only one selected game present; manual catalog review required")
needle = '<section id="grid" class="grid" aria-label="All locally playable games">'
assert needle in html
html = html.replace(needle, needle + "\n" + "\n".join(cards), 1)
# Existing count is a legacy hard-coded total; update only if all markers agree.
match = re.search(r'<div id="count" class="count" aria-live="polite">(\d+) CABINETS</div>', html)
if match:
    n = int(match.group(1))
    html = html.replace(match.group(0), match.group(0).replace(str(n), str(n + 2)), 1)
html = re.sub(
    r'<section aria-label="Selected open-source imports pending gameplay verification".*?</section>\\s*',
    '<section aria-label="Advanced games in development"><h2>Advanced games in development</h2>'
    '<p>Kaetram (#22) and OpenFront (#24) require multiplayer backends. '
    'Space Huggers (#26) requires redistribution clearance. '
    'Interstellar Armada (#28) requires licensed audio and WebGL validation.</p></section>',
    html, count=1, flags=re.S
)
catalog.write_text(html, encoding="utf-8")
print("Added two selected game routes to staging catalog.")
