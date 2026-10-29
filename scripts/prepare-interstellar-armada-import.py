#!/usr/bin/env python3
"""Prepare a locally checked-out Interstellar Armada tree for commercial-site review.

Run against a pinned upstream checkout, NEVER against production.
Preserves GPL and CC-BY notices; removes upstream CC-BY-NC collision sample
and replaces it with a generated original, silent placeholder.
"""
from pathlib import Path
import argparse
import shutil
import wave

parser = argparse.ArgumentParser()
parser.add_argument("upstream", type=Path)
parser.add_argument("destination", type=Path)
args = parser.parse_args()
source = args.upstream.resolve()
dest = args.destination.resolve()
if not (source / "LICENSE.txt").is_file() or not (source / "license/sfx-license.txt").is_file():
    parser.error("Upstream licensing notices not found; aborting.")
if dest == source or source in dest.parents or dest in source.parents:
    parser.error("Source and destination must be separate directories.")
if dest.exists():
    parser.error("Destination already exists; refusing overwrite.")
license_text = (source / "license/sfx-license.txt").read_text()
needle = "spacecraft/collision.ogg"
if needle not in license_text or "License: CC BY-NC 4.0" not in license_text:
    parser.error("Expected upstream noncommercial collision sound attribution missing; re-audit upstream.")
shutil.copytree(source, dest, ignore=shutil.ignore_patterns(".git", "node_modules", ".github"))
collision = dest / "data/sfx/spacecraft/collision.ogg"
if not collision.is_file():
    shutil.rmtree(dest)
    parser.error("Expected noncommercial collision asset missing; aborting.")
collision.unlink()
# The original .ogg is intentionally not shipped. Do not silently rename WAV to OGG.
# A game-code change to reference this WAV is REQUIRED before publishing.
replacement = dest / "data/sfx/spacecraft/collision-ashfall-placeholder.wav"
with wave.open(str(replacement), "wb") as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(22050)
    audio.writeframes(b"\0\0" * 2205)
(dest / "ASHFALL-LICENSE-REVIEW.txt").write_text(
    "Source: https://github.com/PB2204/Interstellar-Armada\n"
    "Code GPL-3.0, graphics/music CC BY 4.0, see LICENSE.txt and license/.\n"
    "Excluded data/sfx/spacecraft/collision.ogg (CC BY-NC 4.0).\n"
    "Original silent WAV placeholder: data/sfx/spacecraft/collision-ashfall-placeholder.wav.\n"
    "NOT READY TO DEPLOY: update collision references, audit all licenses,\n"
    "test WebGL gameplay, retain attribution and GPL source availability.\n"
)
print("Prepared licensing review copy, not a playable build:", dest)
