import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const nav = readFileSync(fileURLToPath(new URL('../public/nav.js', import.meta.url)), 'utf8');
const admin = readFileSync(fileURLToPath(new URL('../public/admin.html', import.meta.url)), 'utf8');

test('master task list shortcut targets an existing admin-page anchor', () => {
  assert.match(nav, /class="kf-admin-tasks-link" href="\/admin\.html#master-task-list" hidden/);
  assert.match(admin, /id="master-task-list"/);
});
test('task shortcut is enabled only with the other admin shortcuts and hidden after authentication errors', () => {
  const selector = '.kf-admin-toolkit-link,.kf-admin-foundry-link,.kf-admin-arsenal-link,.kf-admin-tasks-link';
  assert.ok(nav.includes(selector), 'admin task list must be part of the admin-only reveal selector');
  assert.match(nav, /\.kf-admin-tasks-link,\.kf-mod-link,\.kf-recovery-link/);
});
test('task panel links to canonical backlog and does not claim continuous GitHub monitoring', () => {
  assert.match(admin, /docs\/MASTER-TASK-LIST-2026-11-11\.md/);
  assert.match(admin, /point-in-time findings, not a live GitHub status feed/);
});
