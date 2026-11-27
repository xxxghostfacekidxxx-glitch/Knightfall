# Miss Chaos — experience recovery and development roadmap
Updated November 27, 2026, America/Chicago. User reported target-audience feedback: UI was disliked and character vibe felt off. Treat this as an urgent usability/identity problem, not a failure to be solved by more glow effects alone. No reviewer approval or live deployment is claimed.

## Phase 1 — chat-first experience (source implemented)
- Full chat: character-led welcome, four conversation prompts that stage text (never automatically send), assistant message portraits, readable rounded bubbles, calmer typography, responsive composer, mobile history/settings disclosure, collapsed creative/research tools, compact privacy disclosure retaining full text.
- Keep existing history, draft restoration, streaming, memory, attachments, voice, radar, astrology, and authorization routes. No account permission changes.
- Floating chat: coordinated surfaces, composer, chat bubbles, typography, settings, existing docking and obstruction handling. Partner dashboard retains its own layout with bounded shared avatar/welcome styles.
- Bubblegum Havoc: optional pink/plum/soft-green theme with original abstract SVG, available from full chat, dock, realm and profile. Retain saved preferences and existing themes. Do not overwrite original portrait.
- Conversation voice: inviting alternative-culture companion, match user energy, occasional specific humor, no compulsory task intake or forced insults/flirting. Preserve serious-mode support and truthful capability boundaries.
- Files: public/miss-chaos.html, miss-chaos.js, miss-chaos-experience.css, miss-chaos-presence.js, miss-chaos-realm.html, profile-edit.html, samantha-chaos.html, realm-theme-engine.css, nav.js, assets/knightfall/miss-chaos/bubblegum-realm.svg, backend/chaos-voice.mjs.
- Tests: syntax checked committed full chat, dock and nav; source structural checks passed for unique IDs, theme selectors, CSS braces, disclosures. Added scripts/miss-chaos-experience.test.mjs and wired existing Miss Chaos workflow. Full CI, live browser rendering and feedback not verified.

## Phase 2 — character art and expression
Review existing portrait with consenting feedback; propose distinct original expressions, idle/typing/reply cues, high-quality asset exports and theme-specific frames. Use approved existing portrait until new identity reviewed; reduced-motion support, no excessive flashing, no heavy animation loops. Improve voice and optional personality controls without implying real human identity or dependence.

## Phase 3 — conversational quality and reliability
Test casual greetings, short conversation, humor, creative brainstorming, supportive/serious responses, long task execution, error recovery, streaming, memory ownership and private mode boundaries. Measure latency and failure paths. Keep optional features discoverable but avoid clutter, inaccessible links and repeated canned openers. Relevant tools must be actually available.

## Phase 4 — audience acceptance and release
Check 320/360/390/430px widths, desktop, Android and iOS with keyboard open, history, new chat, welcome actions, long replies, copy/listen, voice/attachments, all theme settings, memo and dock interactions, reduced motion, readable contrast, existing authorization. Compare before/after with target audience; collect specific UI and character feedback. No claim that any reviewer likes it until they confirm. CI and deployment separate from real-device acceptance.
Existing tasks #45 dock, #93 tools, #94 conversation/memory, #95 personality/voice and #169 UI are the primary implementation records. Add no duplicate umbrella when these cover scope.
