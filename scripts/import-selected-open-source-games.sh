#!/usr/bin/env bash
# Reproducible local vendor script. Run from repository root after reviewing upstream code and assets.
set -euo pipefail
cd "$(dirname "$0")/.."
for cmd in git python3; do command -v "$cmd" >/dev/null || { echo "Missing $cmd" >&2; exit 1; }; done
if [[ ! "${ADR_COMMIT:-}" =~ ^[0-9a-f]{40}$ || ! "${TRUST_COMMIT:-}" =~ ^[0-9a-f]{40}$ || ! "${SPACEHUGGERS_COMMIT:-}" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Set ADR_COMMIT, TRUST_COMMIT, and SPACEHUGGERS_COMMIT to audited 40-character commit hashes before importing." >&2
  exit 1
fi
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
vendor() {
  local name="$1" remote="$2" ref="$3" source="$work/$name" target="public/arcade/hosted/$name"
  git clone --quiet --filter=blob:none "$remote" "$source"
  git -C "$source" checkout --quiet --detach "$ref"
  local sha
  sha="$(git -C "$source" rev-parse HEAD)"
  if [[ "$sha" != "$ref" ]]; then
    echo "Unexpected upstream SHA for $name: $sha (expected $ref)" >&2; exit 1
  fi
  mkdir -p "$target"
  cp -a "$source/." "$target/"
  rm -rf "$target/.git" "$target/.github" "$target/node_modules"
  printf '%s\n' "$remote @ $sha" > "$target/UPSTREAM.txt"
  echo "Imported $name from $sha"
}
# For an auditable import, replace latest with an inspected full commit SHA.
vendor "a-dark-room" "https://github.com/doublespeakgames/adarkroom.git" "$ADR_COMMIT"
vendor "evolution-of-trust" "https://github.com/ncase/trust.git" "$TRUST_COMMIT"
vendor "space-huggers" "https://github.com/KilledByAPixel/SpaceHuggers.git" "$SPACEHUGGERS_COMMIT"
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
PY
echo "Import staged. Review bundled third-party licenses, run tests, and inspect changes before commit."
