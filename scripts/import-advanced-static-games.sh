#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
fetch_source(){
 local name="$1" repo="$2" sha="$3"
 git init -q "$work/$name"
 git -C "$work/$name" remote add origin "https://github.com/$repo.git"
 git -C "$work/$name" fetch --quiet --depth 1 origin "$sha"
 git -C "$work/$name" checkout --quiet --detach FETCH_HEAD
 test "$(git -C "$work/$name" rev-parse HEAD)" = "$sha"
}
fetch_source armada PB2204/Interstellar-Armada fd3804acfec7862d77f157202aa0b5df93d71043
fetch_source browserquest mozilla/BrowserQuest af32d247cac3495ca430d0effbb88dd5f3250b2c
fetch_source openfront openfrontio/OpenFrontIO c2cf2ce65f74ac91859f68a84aec89aeda5722ee
python3 scripts/advanced-games/prepare-armada.py "$work/armada" public/arcade/hosted/interstellar-armada
python3 scripts/advanced-games/prepare-browserquest.py "$work/browserquest" public/arcade/hosted/browserquest-solo scripts/advanced-games
node scripts/advanced-games/build-browserquest.mjs "$work/browserquest" public/arcade/hosted/browserquest-solo
python3 scripts/advanced-games/prepare-openfront.py "$work/openfront"
(cd "$work/openfront" && npm ci --ignore-scripts --no-audit --no-fund && npm run build-prod)
mkdir -p public/arcade/hosted/openfront-solo
cp -a "$work/openfront/static/." public/arcade/hosted/openfront-solo/
cp "$work/openfront/"{LICENSE,LICENSE-ASSETS,LICENSING.md,KNIGHTFALL-CHANGES.md} public/arcade/hosted/openfront-solo/
python3 scripts/advanced-games/source-archive.py "$work/openfront" public/arcade/hosted/openfront-solo/source.zip
# BrowserQuest source includes original server and the local transport build inputs.
mkdir -p "$work/browserquest/knightfall"
cp scripts/advanced-games/{bq-worker.cjs,bq-socket.js,build-browserquest.mjs,prepare-browserquest.py} "$work/browserquest/knightfall/"
python3 scripts/advanced-games/source-archive.py "$work/browserquest" public/arcade/hosted/browserquest-solo/source.zip
python3 scripts/advanced-games/source-archive.py public/arcade/hosted/interstellar-armada public/arcade/hosted/interstellar-armada/source.zip
for entry in 'interstellar-armada PB2204/Interstellar-Armada fd3804acfec7862d77f157202aa0b5df93d71043' 'browserquest-solo mozilla/BrowserQuest af32d247cac3495ca430d0effbb88dd5f3250b2c' 'openfront-solo openfrontio/OpenFrontIO c2cf2ce65f74ac91859f68a84aec89aeda5722ee'; do
 read -r slug repo sha <<< "$entry"
 printf 'https://github.com/%s @ %s\n' "$repo" "$sha" > "public/arcade/hosted/$slug/UPSTREAM.txt"
done
python3 scripts/advanced-games/catalog.py
