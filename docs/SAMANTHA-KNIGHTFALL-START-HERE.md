# Knightfall: start here for collaborators

This is a practical guide for Samantha and other approved collaborators. It does not grant access or change roles. The live **Between the Flames** task board is the source of truth for assignments and progress.

## First session (15 minutes)

1. Sign in to Knightfall with **your own account**. Do not borrow Osiris's login or share access tokens.
2. Open **Creator Foundry / Devil's Toolkit** at [Knightfall Creator Foundry](https://ash-fall.com/devil-tools.html). Explore the tools and create a small private draft before publishing anything.
3. Open **Between the Flames** at [Knightfall task board](https://ash-fall.com/ai-handoff.html). Pick an existing assigned or approved task, read its current next step, and note any blockers. Avoid duplicating tasks.
4. For site themes, use [Theme Crew](https://ash-fall.com/theme-crew.html) to preview a design. A preview is not a production publish.
5. Test what you create on a narrow phone screen and desktop if available. Record which device/browser was actually used.

## What GPT can help with

- Explain existing code, errors, test output and task descriptions in plain language.
- Draft original artwork prompts, UI copy, SVG concepts and step-by-step implementation plans.
- Review proposed changes for accessibility, mobile layout, privacy, broken links and regressions.
- Prepare focused changes and test instructions. **A proposed fix is not a deployed fix.**

## Safety and access boundaries

- Work within your own account's permissions. Being a collaborator does **not** grant GOD/Osiris-only powers or unrestricted access to messages, private AI sessions, secrets or moderation archives.
- Never paste passwords, private API keys, OAuth tokens or personal messages into public tasks, issues or screenshots.
- Ask for explicit approval before publishing changes that affect members, spending money, changing roles or deleting data.
- Respect attribution and license notices for external code and assets. Do not copy third-party art just because it is visible online.
- Keep one canonical **main** branch workflow; don't create redundant branches or parallel task lists.

## How to report useful progress

Use this format in the existing task: **What changed**, **where** (file/commit or page), **how tested** (exact command/device), **result**, **remaining blockers**. Mark work *ready to verify* only when implementation and source-level checks are complete. Mark *done* only after required live/device verification.

## Where to look next

- [Chaos Cartridge](https://ash-fall.com/chaos-cartridge.html): arcade and game behavior.
- [Chaosphere](https://ash-fall.com/chaosphere.html): messaging and community UI.
- [Creature Sanctuary](https://ash-fall.com/mascot-pets.html): pets and care.
- [Miss Chaos guide](https://ash-fall.com/miss-chaos-guide.html): member-facing AI tools and limits.
- [GitHub source](https://github.com/xxxghostfacekidxxx-glitch/Knightfall): source code and test history.

If a link or tool is unavailable to your role, record the blocker in Between the Flames instead of bypassing access controls.


## Assistant operating manual — November 27 update

Read the [project roadmap and phase register](BETWEEN-THE-FLAMES-PROJECT-ROADMAP.md) first. It maps every major project to stable live task IDs, prior phases and the next action. The authenticated [Between the Flames board](https://ash-fall.com/ai-handoff.html) is the authoritative current record. Do not rely on a different ChatGPT conversation's memory.

### Connect and locate work

1. Sign in with your own Knightfall account and accept the shared-board invitation if required. Open Between the Flames, then use the workstream selector or search by stable ID (for example #216 or #221).
2. If your ChatGPT supports custom GPT Actions, open the board's AI connections panel, generate a separate revocable key for your own account, import the [OpenAPI schema](https://ash-fall.com/ai-bridge-openapi.json), and enter the key only in the private authentication configuration. Never put it in a prompt, screenshot, public repository, or shared note.
3. Call getHandoffSnapshot before planning. If it is unavailable, use the board's Copy current AI handoff control and paste the packet into the private chat. A pasted snapshot is not live; refresh it before every new batch. If the snapshot is too large, ask for only the selected project's current rows, not a new invented task list.
4. Read the roadmap and the exact live task: title, area, status, version, evidence level, source, next action and blocker. Look up related IDs. Do not repeat or reopen finished work without evidence.
5. Report which access is actually available: live board Action, GitHub read, GitHub write, execution/test environment, deployment verification. Never assume one account's access carries into the other.

### How to work like a Knightfall collaborator

- Restate the goal in one sentence; explain unfamiliar terms in ordinary language and tell the collaborator exactly which page, file, or control to open.
- Work in coherent batches on approved tasks. Inspect current main and relevant existing implementation first. Reuse the site's established architecture, components, theme tokens and data; do not create parallel systems.
- For coding, identify dependencies and acceptance criteria, make the smallest coherent change, run the relevant regression tests and review the diff. Commit to main only when authorized; do not create branches or PRs under this project's current workflow. Do not claim a commit, test or deployment that did not actually happen.
- For visual work, save the original/exported asset in the approved Creator Foundry workflow; preserve provenance and license, and test the asset on narrow mobile and desktop layouts. A prompt, mockup or preview is not a site asset or publication.
- For research, identify primary references, mark drafts, distinguish source facts from interpretation, and request review before publishing.
- For security-sensitive tasks, never bypass authorization, expose private messages, reveal owner-only mail or secrets, or modify access roles, credentials or payments without explicit owner approval. Avoid destructive or real-member production tests; use approved isolated test accounts.

### What each progress label means

- To do: work has not been verified as implemented.
- In progress: implementation or review is underway; record the next concrete action.
- Ready for Verification: existing status remains in_progress; next_step starts with READY FOR VERIFICATION only after actual implementation and suitable tests are documented.
- Done: required acceptance evidence is recorded. A GitHub commit is not CI, successful CI is not deployment, and deployment is not signed-in Android/iOS acceptance.
- Evidence ladder: needs_review → source_checked → ci_passed → deployed → device_verified. Do not promote on assumptions. A blocker is recorded separately; don't hide or clear an unresolved blocker.

### End every work batch with this record

Project / phase:
Task ID and current version:
Goal / acceptance criteria:
Actual changes (file paths and commit):
Tests run and results (exact command, device, browser, pass/fail/not run):
Production deployment evidence (if available):
Remaining blocker:
Next action (one executable step):
Recommended status and evidence level:

Use updateHandoffTask with the exact current version, or createHandoffTask only for genuinely new scope. On a stale-version conflict, refresh, merge with the collaborator's changes and retry only the intended fields. After a successful write, read back the snapshot. Post one concise postHandoffNote for the shared milestone or blocker. If the tool fails, provide this record for manual entry and explicitly say it was not saved.

### Copyable starting instruction for any new GPT chat

You are an authorized Knightfall project collaborator. First read the project roadmap at https://github.com/xxxghostfacekidxxx-glitch/Knightfall/blob/main/docs/BETWEEN-THE-FLAMES-PROJECT-ROADMAP.md and the live Between the Flames task snapshot. If you cannot access the board, tell me exactly what is unavailable and ask for a fresh packet; never fabricate status. Identify the project, phase and permanent task ID; explain the next step in plain language. Inspect existing work and do not duplicate it. Implement and test approved tasks when tools permit. Preserve main-only workflow, swappable realm themes, private account boundaries, original artwork and stable task IDs. Update the live task with evidence, blockers and next action, and post a shared handoff note after each batch. Distinguish proposed, source-present, tested, deployed and device-verified work. Do not grant yourself access or claim work was saved without read-back.

### Recommended first session

Open #231, find Celestial #216–220, Force Realms #193/#221–223, and Sanctuary #224–225, then identify the next action for each. Choose a safe read-only review or Creator Foundry draft; document what was inspected. Use #147/#149/#150 to record successful onboarding and synchronization, not a new duplicate onboarding task. Do not assume task ownership based on this recommendation.


## Isis development apprenticeship — November 27
Start with the [mentoring and system-navigation manual](ISIS-DEVELOPMENT-APPRENTICESHIP.md) and [complete repository path index](KNIGHTFALL-REPOSITORY-TREE.md). Her GPT is expected to lead authorized practical development, explain system dependencies and teach through real changes, tests and commits. The manual includes a progressive contribution path and precise navigation. Use current live tasks and actual permissions; these guides are not access grants.
