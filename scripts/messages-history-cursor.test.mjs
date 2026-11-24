import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const html = readFileSync(new URL('../public/messages.html', import.meta.url), 'utf8');

test('older message cursor uses the smallest numeric ID, not API ordering', () => {
  assert.match(html, /renderedIds=\[\.\.\.box\.querySelectorAll\("\[data-message\]"\)\]\.map\(el=>Number\(el\.dataset\.message\)\)\.filter\(Number\.isSafeInteger\),cursor=renderedIds\.length\?Math\.min\(\.\.\.renderedIds/);
  assert.match(html, /oldestId=Math\.min\(\.\.\.unique\.map\(m=>Number\(m\.id\)\),cursor\)/);
});

test('history load rejects stale conversation results and duplicate messages', () => {
  assert.match(html, /token!==conversationLoadToken/);
  assert.match(html, /seen\.has\(String\(id\)\)/);
  assert.match(html, /id>=cursor\|\|seen\.has\(String\(id\)\)/);
});

test('refresh avoids racing with older history loading', () => {
  assert.match(html, /async function refreshCurrent\(\)\{if\(!currentId\|\|loading\|\|loadingOlder\)return/);
});

test('history paging follows the server has-more cursor signal', () => {
  assert.match(html, /\$\("#load-older"\)\.hidden=d\.has_more!==true/);
  assert.match(html, /if\(d\.has_more!==true\)button\.hidden=true/);
});
