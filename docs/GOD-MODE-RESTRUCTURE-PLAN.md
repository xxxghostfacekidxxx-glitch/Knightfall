# God Mode restructure plan

## Goal
Turn the growing admin dashboard into a coherent, mobile-first command center without deleting existing controls or weakening authorization.

## Navigation taxonomy
1. **Overview**: operational summary, member management, content, forum categories.
2. **Safety**: social moderation, message reports, soft-deleted records, audit trail, deletion requests.
3. **Arcade & Games**: ten-bot fleet, coverage evidence, repair queue, creature MMO, game downloads.
4. **AI & Creation**: personal bots, Chaos Lab, Devil Tools, Creator Foundry, open-source resources.
5. **System**: site settings, infrastructure, private vault, diagnostics.

## Phased execution
### Phase 1: Structural repair (in progress)
- Give every panel a unique identifier and matching navigation tab.
- Replace the flat tab list with grouped workspaces and accessible search.
- Group shortcut cards by purpose instead of an unstructured grid.
- Remove redundant explanations and inconsistent labels.
- Preserve existing API calls and role checks.

### Phase 2: Operator home
- Add a compact summary of health, users, unresolved moderation and arcade CI status.
- Provide direct links to frequent actions and recent failures.
- Make every status distinguish live data from unavailable or stale data.

### Phase 3: Arcade quality center
- Show workflow run status, individual bot states, and consolidated coverage.
- Publish safe-to-read summarized coverage as JSON, not raw sensitive logs.
- Keep detailed artifacts and repairs linked to GitHub; do not invent pass results.
- Gate data appropriately and never expose write-capable GitHub credentials in browser code.

### Phase 4: Information architecture and mobile polish
- Consolidate related actions and remove duplicated panels or shortcuts.
- Improve keyboard navigation, focus, responsive tables, and long-running loading states.
- Keep the Gravewave pink/lime palette consistent; eliminate obsolete orange overrides.

### Phase 5: Verification and release
- Run structure regression tests, browser navigation tests, API authorization checks, and mobile viewport checks.
- Validate all links, tab transitions, and owner-only visibility.
- Confirm GitHub Actions and Cloudflare deployment before claiming production verification.

## Acceptance criteria
- Every panel is uniquely addressable and discoverable through a workspace.
- No duplicate control cards; every shortcut has an explicit category.
- Search works across workspaces and can activate a matching tool.
- All existing controls remain available, including owner-only vault.
- Mobile navigation does not require horizontal scrolling.
- Arcade pass/fail reflects a verified workflow or artifact, never a guessed state.
- No unmerged work branches or open PRs created by the restructure.
