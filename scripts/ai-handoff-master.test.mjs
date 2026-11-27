import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('shared master task register preserves existing records and imports 147 unique source-backed items',()=>{
 const migration=read('backend/migrations/0150_knightfall_shared_master_register.sql');
 const inserts=[...migration.matchAll(/^INSERT INTO ai_handoff_tasks\(title,details,status,priority,area,verification,source_url,next_step,blocker,created_by,updated_by\)/gm)];
 assert.equal(inserts.length,147);
 assert.equal((migration.match(/^UPDATE ai_handoff_tasks SET area=/gm)||[]).length,5);
 assert.match(migration,/WHERE NOT EXISTS\(SELECT 1 FROM ai_handoff_tasks WHERE title=/);
 const titles=[...migration.matchAll(/^INSERT INTO ai_handoff_tasks.*? SELECT '((?:''|[^'])*)'/gm)].map(m=>m[1].replace(/''/g,"'"));
 assert.equal(titles.length,147);
 assert.equal(new Set(titles).size,titles.length);
 assert.ok(titles.every(title=>title.length>0&&title.length<=180));
 assert.match(migration,/Resolve arcade black screens/);
 assert.match(migration,/Imp Inferno/);
 assert.match(migration,/Hex & Whisk/);
 assert.match(migration,/Creator Foundry/);
 assert.match(migration,/Open Source Arsenal/);
 assert.match(migration,/Samantha/);
 assert.match(migration,/issues\/150/);
});
test('task schema is additive and the backend supports progress evidence and blockers',()=>{
 const migration=read('backend/migrations/0149_ai_handoff_project_tracker.sql');
 for(const column of ['area','verification','source_url','next_step','blocker'])
  assert.match(migration,new RegExp('ADD COLUMN '+column+' '));
 const api=read('backend/src/ai-handoff.js');
 const bridge=read('backend/src/ai-handoff-bridge.js');
 for(const code of [api,bridge]){
  for(const name of ['source_url','next_step','blocker','verification','area'])
   assert.ok(code.includes(name),name+' missing');
  assert.match(code,/needs_review/);
  assert.match(code,/device_verified/);
 }
 assert.match(api,/Open Source Arsenal/i);
 assert.match(api,/Creator Foundry/i);
 assert.match(bridge,/tool_guide/);
});
test('mobile board can search by area, progress, evidence and priority',()=>{
 const html=read('public/ai-handoff.html'),js=read('public/ai-handoff.js');
 for(const id of ['task-metrics','workstream-summary','filter-area','filter-query','filter-status','filter-priority','filter-verification','more-tasks','task-area','copy-mentor-guide'])
  assert.match(html,new RegExp('id="'+id+'"'));
 for(const link of ['devil-tools.html#open-source-reference','devil-tools.html','chaos-forge.html'])
  assert.match(html,new RegExp(link));
 for(const label of ['workstreamCounts','matchesFilters','renderTasks','task-editor','sourceLink','next_step','blocker'])
  assert.ok(js.includes(label),label+' absent');
 assert.match(js,/filters\.limit\+=24/);
});

test('handoff timestamps use permanent IDs, UTC and Central time across midnight and DST',()=>{
 const js=read('public/ai-handoff.js');
 const source=js.match(/const handoffTimestamp=value=>\{[\s\S]*?\n\};/);
 assert.ok(source);
 const format=new Function(source[0]+';return handoffTimestamp;')();
 for(const [input,expected] of [
 ['2026-11-27 07:04:39','Nov 27, 2026, 1:04:39 AM CST · 2026-11-27 07:04:39 UTC'],
 ['2026-11-19 01:00:09','Nov 18, 2026, 7:00:09 PM CST · 2026-11-19 01:00:09 UTC'],
 ['2026-07-01 05:00:00','Jul 1, 2026, 12:00:00 AM CDT · 2026-07-01 05:00:00 UTC'],
 ['2026-11-01T06:30:00Z','Nov 1, 2026, 1:30:00 AM CDT · 2026-11-01 06:30:00 UTC'],
 ['2026-11-01T07:30:00Z','Nov 1, 2026, 1:30:00 AM CST · 2026-11-01 07:30:00 UTC']
 ]) assert.equal(format(input),expected);
 assert.equal(format(null),'Unknown date');
 assert.match(format('2026-11-27'),/timezone unspecified/);
 assert.match(js,/handoffTimestamp\(note.created_at\)/);
 assert.ok(js.includes("'#'+note.id"));
 assert.ok(read('backend/src/ai-handoff.js').includes("'#'+n.id"));
 assert.ok(read('backend/src/ai-handoff-bridge.js').includes('timestamp_convention'));
});
