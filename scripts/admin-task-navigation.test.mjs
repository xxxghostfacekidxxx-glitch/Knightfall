import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const nav = readFileSync(fileURLToPath(new URL('../public/nav.js', import.meta.url)), 'utf8');
const admin = readFileSync(fileURLToPath(new URL('../public/admin.html', import.meta.url)), 'utf8');

test('staff menu links to the dashboard and old task bookmarks still open the register', () => {
  assert.match(nav, /class="kf-admin-link" href="\/admin\.html" hidden/);
  assert.match(nav, /querySelector\("\.kf-admin-link"\)\.hidden = !admin/);
  assert.doesNotMatch(nav, /href="\/admin\.html#master-task-list"/);
  assert.match(admin, /<details id="master-task-list"/);
  assert.match(admin, /location.hash === "#master-task-list".*open = true/);
});
test('task panel links to canonical backlog and does not claim continuous GitHub monitoring', () => {
  assert.match(admin, /docs\/MASTER-TASK-LIST-2026-11-11\.md/);
  assert.match(admin, /point-in-time findings, not a live GitHub status feed/);
});

test('God Mode task register separates green arcade CI from device acceptance', () => {
  assert.match(admin, /run #43111248176/);
  assert.match(admin, /132 local and 132 live hosted routes/);
  assert.match(admin, /issue #192<\/a> closed/);
  assert.doesNotMatch(admin, /Investigate ten-shard arcade fleet failure/);
  assert.match(admin, /real Android acceptance remain pending/);
});
