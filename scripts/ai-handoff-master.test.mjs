import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('shared master task register preserves existing records and imports 147 unique source-backed items',()=>{
 const migration=read('backend/migrations/0150_knightfall_shared_master_register.sql');
 const inserts=[...migration.matchAll(/^INSERT INTO ai_handoff_tasks\(title,details,status,priority,area,verification,source_url,next_step,blocker\)/gm)];
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
 for(const link of ['open-source-arsenal.html','devil-tools.html','chaos-forge.html'])
  assert.match(html,new RegExp(link));
 for(const label of ['workstreamCounts','matchesFilters','renderTasks','task-editor','sourceLink','next_step','blocker'])
  assert.ok(js.includes(label),label+' absent');
 assert.match(js,/filters\.limit\+=24/);
});
