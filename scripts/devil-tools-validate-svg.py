#!/usr/bin/env python3
"""Validate first-party Knightfall SVG source without third-party dependencies.

Run python3 scripts/devil-tools-validate-svg.py
Exit nonzero on malformed SVG, duplicate IDs, embedded scripts or missing viewBox.
Warnings for descriptive metadata are reported without rejecting intentionally simple game sprites.
"""
from collections import Counter
from pathlib import Path
import xml.etree.ElementTree as ET
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SEARCH = (
    "public/assets/devil-tools",
    "public/assets/arcade",
    "public/assets/monster-sprites",
    "public/assets/miss-chaos",
    "public/icons",
    "public/branding",
    "public/admin-offline",
    "public/arcade/hosted/crypt-pairs/sprites",
)
SVG_NS = "http://www.w3.org/2000/svg"
files = sorted({f for folder in SEARCH for f in (ROOT / folder).rglob("*.svg")})
failures, warnings = [], []

for file in files:
    short = str(file.relative_to(ROOT))
    try:
        tree = ET.parse(file)
    except ET.ParseError as error:
        failures.append(f"{short}: invalid XML: {error}")
        continue
    root = tree.getroot()
    if root.tag != f"{{{SVG_NS}}}svg":
        failures.append(f"{short}: invalid SVG namespace or missing svg root")
        continue
    if not root.attrib.get("viewBox"):
        failures.append(f"{short}: viewBox is missing")
    ids = [element.attrib["id"] for element in root.iter() if element.attrib.get("id")]
    duplicate = sorted(key for key, count in Counter(ids).items() if count > 1)
    if duplicate:
        failures.append(f"{short}: duplicate ids: {', '.join(duplicate)}")
    if any(element.tag.endswith("}script") or element.tag.endswith("}foreignObject")
           or element.tag in {"script", "foreignObject"} for element in root.iter()):
        failures.append(f"{short}: embedded script or foreignObject")
    if any(key.lower().startswith("on") for element in root.iter() for key in element.attrib):
        failures.append(f"{short}: executable event handler")
    for element in root.iter():
        for key, value in element.attrib.items():
            if key.endswith("}href") or key == "href":
                if re.match(r"(?i)(?:https?:)?//", value):
                    failures.append(f"{short}: external embedded href")
                elif value.startswith("data:") and not re.match(
                    r"^data:image/(?:png|jpeg|webp);base64,[a-zA-Z0-9+/=]+$", value
                ):
                    failures.append(f"{short}: unsupported or active embedded data URI")
    title = root.find(f"{{{SVG_NS}}}title")
    desc = root.find(f"{{{SVG_NS}}}desc")
    if title is None or not (title.text or "").strip():
        warnings.append(f"{short}: missing accessible title")
    if desc is None or not (desc.text or "").strip():
        warnings.append(f"{short}: missing accessible description")

print(f"Validated {len(files)} SVG assets: {len(failures)} blockers, {len(warnings)} metadata advisories")
for problem in failures:
    print("ERROR:", problem)
for problem in warnings[:25]:
    print("NOTE:", problem)
if len(warnings) > 25:
    print(f"... {len(warnings)-25} additional advisory warnings")
sys.exit(1 if failures else 0)
