# Chaos Forge: free maker research, opt-in image construction analysis and 3D studio

Implemented 2026-11-18. This is a prototype workshop, not an automatic garment manufacturing pipeline.

## Site surfaces
- /chaos-forge.html: image uploader, click/tap contour tracing, signed-in photo analysis, editable parametric cutting templates, inch-scaled downloadable SVG blueprint and JSON cut/assembly list; native 3D canvas and OBJ export/import plus STL import.
- /miss-chaos.html: launch link, regular model-tools can search public libraries.
- /devil-tools.html, homepage: launch links. 
- /api/chaos/forge/analyze: authenticated POST; verifies known origin, max bytes, image base64 data URI. Users must click Analyze; input is not persisted. One fixed AI provider model: @cf/moondream/moondream3.1-9B-A2B. Rate limit 4 requests per signed-in user per 60 minutes. AI model allocation is shared with the rest of Knightfall, not an unlimited free resource. When quota is exhausted, local drafting remains available.
- /api/chaos/resources?source=met|polyhaven|wikidata&q=<topic>[&type=models|textures|hdris]: authenticated, bounded live source lookup; no arbitrary upstream URLs and no private user data sent to catalogs.

## Public free libraries and licensing
- The Met Collection API: https://metmuseum.github.io/ (no key); use v1.1 paginated search, filter returned object.isPublicDomain=true; open data CC0, but not every item image is public domain.
- Poly Haven API: https://polyhaven.com/our-api (no key; free), model/texture/HDRI metadata and CC0 assets. The site displays the required "Powered by Poly Haven" credit near live API results. Poly Haven live API ToS is distinct from the CC0 license of assets.
- Wikidata search API: https://www.wikidata.org/w/api.php (no key); CC0 structured data, links to source entities; individual claims should be checked.
- Existing Wikipedia tool uses fixed Wikipedia endpoint. Use only public topics, not member personal data.
- Smithsonian Open Access: https://www.si.edu/openaccess (CC0 data/media where available); direct public API requires a free API key, so currently link-only, not integrated.
- FreeSewing: https://freesewing.org for proper measurement-driven garments. Seamly2D for precise pattern CAD, Inkscape for SVG edits, FreeCAD for CAD, Blender for advanced 3D.

## Three.js engine
Reuse the existing MIT-licensed Three.js r149 bundle at /arcade/hosted/pikkuautot-city/three.min.js; the existing source retains the original Three.js copyright/license header. Do not remove or fork it without a license audit. This lab uses new original code on top.

## Pattern and model accuracy
- Templates: tote, pouch, apron, gathered skirt, open cardboard box net, photo-traced silhouette. These are starting templates only; not professionally graded garment blocks.
- Body measurements are user-supplied. Perspective/photo distortion, stitching/fit/drape, material thickness and hidden surfaces cannot be recovered exactly from one photograph.
- SVG exports carry physical inch units and a 1×0.5 inch calibration rectangle; print at actual size, verify scale, and tile externally if a printer requires small pages.
- 3D renderer produces illustrative parametric meshes, not tested fitted clothes or a photogrammetric scan. OBJ/STL import and OBJ export are local to the browser; GLB/glTF importing or CAD manufacturing precision is future work.
- File images / 3D models are not saved to the Knightfall backend. AI requests send a downscaled JPEG only after the user clicks "Analyze". API logs may still contain typical metadata; no image content is logged by this handler.
- On Android devices without WebGL, page must render an explicit fallback rather than a black screen.
- User-supplied image and imported model licensing remains their responsibility; CC0 catalog results are clearly labeled.

## Automated tests
- node --test scripts/chaos-forge-core.test.mjs backend/chaos-resources.test.mjs backend/src/chaos-forge-vision.test.mjs
- node --check public/chaos-forge.js
- node scripts/chaos-forge-browser.mjs with a localhost http.server running for the public directory and Playwright Chromium available.

## Future upgrades
1. Editable polygon geometry with drag-point movement, curve/spline tracing and undo history; tracing correction and perspective measurement.
2. Full garment fitting and seam matching, darts, notches, grainlines, fabric consumption and grading; consider using FreeSewing rather than pretending to infer from a selfie.
3. GLB/glTF load/export with locally vendored module loader, UV/textures, Blender handoff and texture visualization.
4. Optional paid or controlled image-to-3D provider only after verifying costs and licenses; keep base lab free.
