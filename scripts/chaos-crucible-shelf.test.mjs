import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {exportCrucibleWorkspace} from "../public/chaos-crucible-progress.mjs";
import {
 CRUCIBLE_SHELF_KEY,CRUCIBLE_SHELF_LIMIT,
 readCrucibleShelf,saveCrucibleShelf,deleteCrucibleShelf
} from "../public/chaos-crucible-shelf.mjs";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function memoryStore(){
 const map=new Map();
 return {getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),get raw(){return map.get(CRUCIBLE_SHELF_KEY)}};
}
const kit=(name,kind="character")=>exportCrucibleWorkspace({
 kind,title:name,goal:"Design an original project",known:"A real source",first:"Details",second:"Requirements",constraints:"Free tools"
},{completed:[0,2],notes:"Tested locally only"});
test("device shelf is empty until the member explicitly saves a project",()=>{
 const storage=memoryStore();
 assert.deepEqual(readCrucibleShelf(storage),[]);
 assert.equal(storage.raw,undefined);
 const project=saveCrucibleShelf(storage,kit("Little gremlin"),{newId:"c-explicit-0001",now:new Date("2026-11-19T19:00:00Z")});
 assert.equal(project.replaced,false);
 assert.equal(readCrucibleShelf(storage)[0].title,"Little gremlin");
 assert.equal(readCrucibleShelf(storage)[0].kind,"character");
 assert.deepEqual(JSON.parse(readCrucibleShelf(storage)[0].kit).progress.completed,[0,2]);
});
test("updating a loaded device project retains identity and uses one slot",()=>{
 const storage=memoryStore();
 const first=saveCrucibleShelf(storage,kit("First"),{newId:"c-identity-0001"});
 const updated=saveCrucibleShelf(storage,kit("Changed"),{id:first.id});
 assert.equal(updated.replaced,true);
 assert.equal(readCrucibleShelf(storage).length,1);
 assert.equal(readCrucibleShelf(storage)[0].title,"Changed");
 assert.equal(readCrucibleShelf(storage)[0].id,first.id);
 assert.throws(()=>saveCrucibleShelf(storage,kit("Unknown"),{id:"c-not-saved-0001"}),/no longer exists/);
});
test("shelf caps at twelve user-saved projects and doesn't overwrite any on failure",()=>{
 const storage=memoryStore();
 for(let i=0;i<CRUCIBLE_SHELF_LIMIT;i++)
  saveCrucibleShelf(storage,kit("Project "+i,i%2?"tattoo":"game"),{newId:"c-project-"+String(i).padStart(4,"0")});
 const before=storage.raw;
 assert.equal(readCrucibleShelf(storage).length,12);
 assert.throws(()=>saveCrucibleShelf(storage,kit("Project 13"),{newId:"c-project-9999"}),/holds 12/);
 assert.equal(storage.raw,before);
 assert.equal(deleteCrucibleShelf(storage,"c-project-0005"),true);
 assert.equal(deleteCrucibleShelf(storage,"c-project-0005"),false);
 assert.equal(readCrucibleShelf(storage).length,11);
});
test("corrupt shelf and malicious project data fail closed without erasing anything",()=>{
 const storage=memoryStore();
 storage.setItem(CRUCIBLE_SHELF_KEY,"{broken");
 const original=storage.raw;
 assert.throws(()=>readCrucibleShelf(storage),/cannot be read/);
 assert.throws(()=>saveCrucibleShelf(storage,kit("safe"),{newId:"c-good-copy-0001"}),/cannot be read/);
 assert.equal(storage.raw,original);
 storage.setItem(CRUCIBLE_SHELF_KEY,JSON.stringify({schema:"x",entries:[]}));
 assert.throws(()=>readCrucibleShelf(storage),/format is invalid/);
 const good=memoryStore();
 saveCrucibleShelf(good,kit("safe"),{newId:"c-valid-copy-0001"});
 const polluted=JSON.parse(good.raw);
 polluted.entries[0].kit='{"schema":"fake"}';
 good.setItem(CRUCIBLE_SHELF_KEY,JSON.stringify(polluted));
 assert.throws(()=>readCrucibleShelf(good),/version/);
 assert.throws(()=>saveCrucibleShelf(good,kit("another"),{newId:"c-another-copy-0001"}),/version/);
});
test("UI explicitly warns about browser-profile exposure and keeps AI sends opt-in",()=>{
 const html=read("public/chaos-crucible.html");
 const app=read("public/chaos-crucible.mjs");
 const source=read("public/chaos-crucible-shelf.mjs");
 for(const id of ["crucible-shelf-list","crucible-shelf-save","crucible-shelf-copy","crucible-shelf-status"]){
   assert.ok(html.includes('id="'+id+'"'));
 }
 assert.match(html,/unencrypted in this browser profile/);
 assert.match(html,/Anyone using this browser profile can see them/);
 assert.match(app,/saveCrucibleShelf\(window\.localStorage,kit,\{id\}\)/);
 assert.match(app,/deleteCrucibleShelf\(window\.localStorage,entry\.id\)/);
 assert.match(app,/readCrucibleShelf\(window\.localStorage\)/);
 assert.match(app,/if\(!confirm\("Remove/);
 assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon/);
 assert.doesNotMatch(app,/\.innerHTML\s*=/);
});
