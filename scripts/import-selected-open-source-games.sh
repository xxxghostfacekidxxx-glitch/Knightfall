#!/usr/bin/env bash
# Reproducible local vendor script. Run from repository root after reviewing upstream code and assets.
set -euo pipefail
cd "$(dirname "$0")/.."
for cmd in git python3 tar; do command -v "$cmd" >/dev/null || { echo "Missing $cmd" >&2; exit 1; }; done
if [[ ! "${ADR_COMMIT:-}" =~ ^[0-9a-f]{40}$ || ! "${TRUST_COMMIT:-}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Set ADR_COMMIT and TRUST_COMMIT to audited 40-character commit hashes before importing." >&2
  exit 1
fi
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
vendor() {
  local name="$1" remote="$2" ref="$3"
  local source="$work/$name" target="public/arcade/hosted/$name"
  git clone --quiet --filter=blob:none "$remote" "$source"
  git -C "$source" checkout --quiet --detach "$ref"
  local sha
  sha="$(git -C "$source" rev-parse HEAD)"
  if [[ "$sha" != "$ref" ]]; then
    echo "Unexpected upstream SHA for $name: $sha (expected $ref)" >&2; exit 1
  fi
  mkdir -p "$target"
  # Export tracked files only: never copy upstream .git history or untracked build outputs.
  git -C "$source" archive --format=tar HEAD | tar -xf - -C "$target"
  rm -rf "$target/.github" "$target/node_modules"
  printf '%s\n' "$remote @ $sha" > "$target/UPSTREAM.txt"
  echo "Imported $name from $sha"
}
# Import only pinned, full upstream commit IDs supplied by the staging workflow.
vendor "a-dark-room" "https://github.com/doublespeakgames/adarkroom.git" "$ADR_COMMIT"
vendor "evolution-of-trust" "https://github.com/ncase/trust.git" "$TRUST_COMMIT"
python3 - <<'PY'
from pathlib import Path
adr=Path("public/arcade/hosted/a-dark-room/index.html")
html=adr.read_text()
# Use the bundled jQuery copy; remove the upstream analytics beacon.
html=html.replace('https://ajax.googleapis.com/ajax/libs/jquery/1.10.1/jquery.min.js','lib/jquery.min.js')
import re
html=re.sub(r'<script>\s*if\(!window\.jQuery\).*?</script>', '', html, flags=re.S)
html=re.sub(r'<script[^>]*src="https://www\.googletagmanager\.com/gtag/js[^"]*"[^>]*></script>', '', html)
html=re.sub(r'<script>\s*window\.dataLayer.*?</script>', '', html, flags=re.S)
html=html.replace('<body>', '<body><nav style="padding:10px;background:#15111a"><a style="color:#a8ff48" href="/arcade-30-games.html">← Chaos Cartridge</a> · <a style="color:#ff5edb" href="LICENSE.md">MPL 2.0</a></nav>', 1)
adr.write_text(html)
trust=Path("public/arcade/hosted/evolution-of-trust/index.html")
html=trust.read_text()
html=html.replace('<body>', '<body><nav style="position:relative;z-index:100;padding:10px;background:#15111a"><a style="color:#a8ff48" href="/arcade-30-games.html">← Chaos Cartridge</a> · <a style="color:#ff5edb" href="LICENSE">CC0</a></nav>', 1)
trust.write_text(html)
# Upstream's effects include BY-NC and Sampling+ material. Substitute the
# explicitly credited CC0 coin-get effect for every non-music effect so no
# restricted recording remains in this commercial site's distributed copy.
sounds=trust.parent / "assets/sounds"
cc0=(sounds / "coin_get.mp3").read_bytes()
for sound in sounds.glob("*.mp3"):
    if sound.name not in {"bg_music.mp3", "coin_get.mp3"}:
        sound.write_bytes(cc0)
(trust.parent / "KNIGHTFALL-CHANGES.md").write_text(
    "# Knightfall hosting changes\n\n"
    "All non-music sound effects are replaced with the CC0 coin-get recording "
    "by plasterbrain credited in README.md. The original restricted effect "
    "recordings are not distributed in this copy. Music remains Komiku's "
    "CC0 Bleu. Upstream credits and library notices are retained.\n"
)

PY
echo "Import staged. Review bundled third-party licenses, run tests, and inspect changes before commit."
