import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../public/arcade-save.js',import.meta.url),'utf8');
async function fixture(){
 let user={id:1}, fail=false, conflict=false, writes=0, row=null;
 const context={document:{getElementById:()=>null,readyState:'complete'},location:{pathname:'/game'},window:{},fetch:async(url,opts)=>{
 if(url.endsWith('/api/auth/me')){if(fail)throw Error('offline');return Response.json({user});}
 if(url.includes('/api/arcade/scores'))return Response.json({mine:[],score:{best_score:10}});
 if(opts.method==='PUT'){writes++;return conflict?Response.json({error:'conflict'},{status:409}):Response.json({revision:2});}
 return Response.json({saves:row?[row]:[]});
 }};
 vm.runInNewContext(source,context);
 const api=context.window.AshFallArcade;await api.ready;
 return {api,setUser:v=>user=v,setFail:v=>fail=v,setConflict:v=>conflict=v,setRow:v=>row=v,writes:()=>writes};
}
test('failed authentication refresh clears account and blocks uploads',async()=>{
 const f=await fixture();f.setFail(true);await f.api.refreshUser();
 assert.equal(f.api.user,null);await assert.rejects(f.api.saveProgress('game',{}));assert.equal(f.writes(),0);
});
test('conflict cannot be silently retried with a newer revision',async()=>{
 const f=await fixture();await f.api.loadProgress('game');f.setConflict(true);
 await assert.rejects(f.api.saveProgress('game',{}));f.setConflict(false);
 await assert.rejects(f.api.saveProgress('game',{}),/reload progress/);assert.equal(f.writes(),1);
 await f.api.loadProgress('game');await f.api.saveProgress('game',{});assert.equal(f.writes(),2);
});
test('unsupported remote payload is not mistaken for an empty slot',async()=>{
 const f=await fixture();f.setRow({save_key:'autosave',revision:1,save_data:'legacy'});
 await assert.rejects(f.api.loadProgress('game'),/unsupported format/);
});
test('leaderboard score does not blindly write an unrestored slot after account switch',async()=>{
 const f=await fixture();await f.api.loadProgress('game');f.setUser({id:2});await f.api.refreshUser();
 const result=await f.api.recordScore('game',10);assert.equal(result.saved,true);assert.equal(result.progressSaved,false);assert.equal(f.writes(),0);
});
