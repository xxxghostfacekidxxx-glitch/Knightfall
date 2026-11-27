# Celestial Sanctum — Isis project assignment
2026-11-27 | Assigned by Osiris to Samantha and her GPT as their starting development project.
Samantha leads this workstream; both development assistants coordinate before overlapping edits. No exclusive repository lock, access elevation, or automatic completion is implied.

## Start here
1. Open https://ash-fall.com/celestial-sanctum.html and https://ash-fall.com/ai-handoff.html.
2. Read direct handoff note #8, the [apprenticeship](ISIS-DEVELOPMENT-APPRENTICESHIP.md), and [roadmap](BETWEEN-THE-FLAMES-PROJECT-ROADMAP.md). Verify your own board and GitHub access; use the copyable packet if needed.
3. Read current versions of #216–220. These are the project's existing records, not five new tasks. Report your intended scope before editing.
4. Inspect the targeted code and existing test suite; don't audit the entire site.

## Six existing expansion phases and next work
I: observatory, major arcana, numerology.
II: full 78-card deck, zodiac wheel, transits.
III: 33 archive entries, runes, sacred geometry, lunar/calendar studies.
IV: sixteen deity profiles, zodiac/houses, metals, alchemy and original vector artwork.
V: minor arcana artwork, constellation navigation, synastry and 98-asset manifest.
VI: ten mythology/Hermetic lessons, planetary hours, four study circles and Miss Chaos entry.
Recommended continuation VII: specialized source-aware Miss Chaos study retrieval (#220). VIII: release/refinement (#219), with baseline and regression checks throughout every phase. These continuation labels are a proposed organizing sequence, not historical claims of completed phases.
Keep historical context and modern symbolic interpretation distinct; astronomy calculations are not astrological prediction evidence.

## Exact source map
| File | Teach Samantha |
|---|---|
| public/celestial-sanctum.html | The sections, forms, IDs and accessible controls users see |
| public/celestial-sanctum.css | Realm-scoped presentation; preserve swappable themes |
| public/celestial-core.mjs | Exported reference arrays, validation and pure calculation functions |
| public/celestial-sanctum.mjs | Imports core functions, responds to events, renders DOM cards and results |
| public/moon-widget.mjs | Loads astronomy engine used by observatory |
| public/assets/knightfall/celestial/manifest.json | Original artwork inventory and path contract |
| public/sw.js | Offline asset availability and cache freshness |
| backend/migrations/20261126_celestial_study_circles.sql | Existing named forum category migration; no new migration merely to edit archive text |
| backend/migrations/20261126_celestial_handoff.sql | Existing task registration |
| scripts/celestial-sanctum.test.mjs | Regression assertions for dates, deck, assets, calculations, navigation and studies |

## First real coding assignment: #217 archive citation improvement
Source inspection on 2026-11-27 confirms the first nine entries in the exported studies array in celestial-core.mjs each have four fields (tradition, title, description, reflection prompt); subsequent entries can include a fifth source URL. Begin with the Osiris and Isis entry. This is a verified small source metadata gap, not proof that its existing content is inaccurate.
- Explain what an array, module export and optional fifth field mean. Find the existing renderer in celestial-sanctum.mjs and verify how the optional source is displayed before editing.
- Find a reputable directly relevant museum, university or primary-text edition source supporting the existing entry. Open and evaluate it; do not use a generic unrelated homepage or invent a URL. Keep original text unless a factual correction is supported.
- Add the verified source URL as the fifth field to the existing record. If the renderer already handles it, do not change the renderer. Preserve the count of 33 archive records, original IDs/labels and existing styling.
- Extend an existing regression assertion or add a focused test for the Osiris and Isis source metadata, matching project style. Explain why the test protects the change.
- From a real checkout at repo root run: node --test scripts/celestial-sanctum.test.mjs and node scripts/static-audit.mjs. If unable, explicitly record not run. Preview the archive search for Osiris and Isis, check source link, phone layout and unaffected entries.
- Review the exact diff; with authorized write access and suitable tests, commit only the intended files to main. No PR/branch, no force push, no secrets. Otherwise provide a reviewable patch and test plan.
- Update #217 with current version, evidence, next action and one shared note. Do not mark #217 done after one source link: remaining archive/deity/lesson/asset review remains open.

## After the first contribution
#216: validate the 15 chambers and tool behavior, including UTC and invalid inputs; keep sensitive calculation input local.
#217: continue citations and artwork provenance/manifest review in small reviewed batches.
#218: verify four named forum links, migration state and moderation with authorized test accounts; no unnecessary production writes.
#220: design bounded source-aware study assistance after baseline; distinguish tradition from science, no private journal or birth data exposure; inspect existing Miss Chaos permissions and retrieval.
#219: record actual CI, Pages and Worker revision, migration status, accessibility, desktop and Android/iOS evidence. No claim of live deployment or device acceptance from a commit alone.

## First session handoff
Report project and task #217, connection status, what Samantha learned, source URL and why relevant, exact files/diff, test output or blocker, commit SHA if any, remaining work and next task. Acknowledge receipt of this assignment in Between the Flames. If access is unavailable, give Samantha the exact note to post manually.
