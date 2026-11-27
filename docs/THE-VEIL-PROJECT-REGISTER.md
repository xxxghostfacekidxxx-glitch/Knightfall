# The Veil — project register and expansion plan
Updated November 27, 2026 (America/Chicago). Canonical assignments: https://ash-fall.com/ai-handoff.html. Source evidence is from current main; no production or specialist acceptance implied.

## Scope and information architecture
The Veil is the umbrella for independent historical, religious, mythological and occult reference collections. Kemet is a dedicated civilization archive. Grimoire Archives is an independent occult research collection. Modern religions, historical practices, fictional mythology and original Knightfall spirituality remain explicitly labeled; existing separate realms retain their identities. Use a searchable reference-library model, not compulsory courses, membership or initiation. New collections are proposed unless source implementation is explicitly noted.

## Kemet: recovered implementation and continuation
Source inspection: public/egyptian-civilization.json contains 371 unique civilization records in 14 categories; public/egyptian-mythology-archive.json contains 264 unique mythology records in eight categories. All 635 records have resolvable internal source keys (not proof every external citation supports the claim). All 371 civilization record IDs occur exactly once across the five dedicated room pages; none missing.
| Room | File | Records |
|---|---|---:|
| Royal Archives | kemet-royal-archives.html | 100 |
| House of Life | kemet-house-of-life.html | 140 |
| Temple Archives | kemet-temple-archives.html | 25 |
| Museum of Kemet | kemet-museum.html | 91 |
| Library of Alexandria | kemet-research-library.html | 15 |

Civilization categories: history/dynasties 40; society/government/law 26; daily life/agriculture/economy 28; medicine/anatomy/healing 31; mathematics/measurement/accounting 27; astronomy/calendars/timekeeping 27; engineering/technology/material science 28; language/writing/literature 27; religion/magic/occult reception 25; archaeology/evidence/legacy 15; monuments/sites 25; primary sources/artifacts 22; dynastic register 34; art/visual culture 16.
Mythology: gods/goddesses 104; Cult of Set 20; myth/cosmology 27; afterlife/spirits 21; sacred texts 21; sacred geography 25; symbols/practices 37; later reception 9. The illustrated Hall of Gods is a separate presentation of existing deity data, not an additional 16 counted records. Theban Alphabet Studio supports 23-glyph encoding/decoding, keyboard, portable tokens and self-contained SVG export after glyph retrieval. It is a Renaissance substitution cipher, not ancient Egyptian script or translation.

Kemet phases (recovered source milestones, then proposed expansions):
K1 source-present: independent hub, mythology archive, Cult of Set and Hall of Gods.
K2 source-present: civilization database and five rooms, subject navigation, primary-object references, JSON downloads.
K3 source-present: Theban alphabet studio with explicit historical boundary.
K4 proposed: deeper citation review, chronology timeline, geographic site atlas and dynastic relationships; trace disputed dates and regional variation.
K5 proposed: medicine papyri and historical practice, mathematics worked examples, calendrical and astronomical instruments, engineering and materials; evidence-first diagrams, no unsafe medical guidance.
K6 proposed: Egyptian language lab (hieroglyphic signs, transliteration, hieratic/demotic/Coptic history), original text excerpts where rights allow, distinguish transcription from translation; Theban remains separate.
K7 proposed: artifact gallery with museum accession numbers, licensed images, maps, archaeology and preservation, daily life, Nubia and neighboring interactions, women, labor and trade.
K8 proposed: religious texts, local cults, priesthood and temple economy, funerary sources and comparative later reception (Thelema, Satanism, Temple of Set, Hermetica); avoid collapsing modern traditions into antiquity.
K9 verification: node --test scripts/kemet-civilization.test.mjs scripts/veil-navigation.test.mjs; static audit; external citation and image rights checks; browser, mobile, keyboard, offline and deployment. Do not close on inventory counts alone.

## Grimoire Archives: current and planned
Source files public/grimoire-archives.html/.css/.js, scripts/grimoire-archives.test.mjs. Current 117 records: 22 textual references, 72 Goetic profiles with ranks/legions/themes, nine angelic studies, fourteen ceremonial studies. Seven externally hosted seal previews; other seals are links. Search and rank filter. Internal counts and anchors previously checked; exact external links, primary-source accuracy, rights, Node suite and production remain unverified.
G1 manuscript library #232: expand public-domain and licensed edition links, compare Greater/Lesser Key, Urilia (modern copyrighted text, summary/reference only), Weyer, Collin de Plancy, Agrippa, Arbatel, Heptameron, Abramelin, Grimorium Verum, Grand Grimoire, Dee, Enoch, Liber O. Add reading guides and edition metadata, not invented ancient origins.
G2 spirit encyclopedia #233: verify each Goetic rank, count, spelling, alias and seal against editions; add alternate traditions, named angels, archangels, Watchers, fallen angels and cross-reference hierarchy provenance.
G3 ceremonial study #234: source-specific invocation/evocation, angel/demon summoning and dismissal, banishing, pentagram/hexagram, circles, pentacles and prayers; compare manuscripts and later ritual systems, distinguish claims from evidence and avoid physical harm.
G4 release #235: test, link/license verification, mobile, accessibility and deployment.
G5 proposed: complete licensed seal gallery, local optimized assets, artwork provenance and manifest, Artwork Vault integration; exact historical reproductions vs original interpretations.
G6 proposed: interactive Solomonic planetary pentacle gallery, seal viewer with source-specific labels and comparison, accessible zoom, inscriptions and variants.
G7 proposed: Enochian records and alphabet reference, Dee/Kelley manuscript chronology, safe visual transliteration tools, compare later Golden Dawn systems.
G8 proposed: comparative angelic/infernal hierarchies, non-Goetic traditions and cross-text relationships; no universal invented hierarchy.
G9 proposed: annotated public-domain ceremonial text reader with citations, chapter anchors, variants, glossary and contextual notes.
G10 proposed: bounded source-aware occult research assistant, grounded references, no private data leakage or unverified supernatural claims.

## Additional Veil expansion (proposed)
V1 world mythology collections: Mesopotamia, Greece/Rome, Norse, Celtic, African, Asian and Indigenous traditions with appropriate regional specificity and consultation.
V2 world religions: primary sources, chronology, lived practice, intra-tradition diversity and neutral comparison.
V3 Western esoteric history: Hermeticism, alchemy, Rosicrucianism, Golden Dawn, Thelema, modern Satanisms, Temple of Set and related movements. Clearly distinguish history from later interpretation.
V4 witchcraft and mysticism: historical accusations, folk traditions, contemporary Wicca and other living traditions, comparative contemplative practices, historical source boundaries.
V5 shared research infrastructure: collection-specific search, stable IDs, citation catalog and rights fields, cross-links, glossary, chronology, accessible mobile/offline rendering; no unnecessary migration. Research drafts and moderation reviewed before publication.
V6 release and acceptance: verify each route, assets, thematic isolation, browser/device behavior and accessibility.

## Date integrity
D1 CURRENT_TIMESTAMP is UTC. On Nov 27 2026, note #10 stored 07:04:39 UTC = 01:04:39 CST; note #1 is Nov 18. Preserve original database history. Board source now displays permanent note IDs and America/Chicago plus UTC timestamps; packet labels canonical UTC and note IDs. Historical dates inside note bodies are not creation dates. Test date parsing, DST and midnight rollover, verify deployed UI independently. Report actual server time in new handoffs, not copied old date headers.
