import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../public/messages.html', import.meta.url), 'utf8');

test('older message cursor uses the smallest numeric ID, not API ordering', () => {
  assert.match(html, /oldestId=Math\.min\(\.\.\.unique\.map\(m=>Number\(m\.id\)\)\.filter\(Number\.isSafeInteger\),cursor\)/);
});

test('history load rejects stale conversation results and duplicate messages', () => {
  assert.match(html, /token!==conversationLoadToken/);
  assert.match(html, /!existing\.has\(String\(m\.id\)\)/);
});

test('refresh avoids racing with older history loading', () => {
  assert.match(html, /async function refreshCurrent\(\)\{if\(!currentId\|\|loading\|\|loadingOlder\)return/);
});
