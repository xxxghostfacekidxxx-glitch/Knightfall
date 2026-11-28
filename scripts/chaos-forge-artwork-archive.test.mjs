import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {archiveArtwork,listArtwork,readArtwork,deleteArtwork} from "../backend/chaos-forge-artwork-archive.mjs";
import {generateVector} from "../backend/chaos-forge-image.mjs";
function fixture(){
 const rows=new Map(),objects=new Map();
 const env={DB:{prepare(sql){let p=[];return {bind(...args){p=args;return this;},async run(){
  if(sql.startsWith("INSERT")){const [id,owner_id,filename,mime,engine,title,recipe_json,sha256,byte_count,created_at]=p;const mine=[...rows.values()].filter(x=>x.owner_id===owner_id);if(mine.length>=60||mine.reduce((n,x)=>n+x.byte_count,0)+byte_count>67108864)return {meta:{changes:0}};rows.set(id,{id,owner_id,filename,mime,engine,title,recipe_json,sha256,byte_count,created_at,state:"pending"});return {meta:{changes:1}};}
  const row=rows.get(p[0]);if(!row||row.owner_id!==p[1])return {meta:{changes:0}};
  if(sql.startsWith("UPDATE")&&row.state==="pending"){row.state="ready";return {meta:{changes:1}};}
  if(sql.startsWith("DELETE")&&sql.includes("state='"+row.state+"'")){rows.delete(p[0]);return {meta:{changes:1}};}
  return {meta:{changes:0}};
 },async first(){const row=rows.get(p[0]);if(!row||row.owner_id!==p[1])return null;if(sql.startsWith("UPDATE")){if(row.state==="pending"&&row.created_at>=p[2])return null;row.state="deleting";return {id:row.id};}return row.state==="ready"?{...row}:null;},async all(){return {results:[...rows.values()].filter(r=>r.owner_id===p[0])};}}}},
 CREATOR_MEDIA:{async put(key,bytes){objects.set(key,bytes.slice());},async get(key){const bytes=objects.get(key);return bytes?{size:bytes.length,arrayBuffer:async()=>bytes.slice().buffer}:null;},async delete(key){objects.delete(key);}}};
 return {env,rows,objects};
}
const generated=()=>{const a=generateVector({seed:66,title:"Eclipse"});return {bytes:new TextEncoder().encode(a.content),mime:"image/svg+xml",engine:a.report.engine,title:a.report.title,settings:a.report};};
test("private artwork round trip preserves recipe, exact bytes, integrity and ownership",async()=>{
 const {env,rows,objects}=fixture(),original=generated(),item=await archiveArtwork(env,7,original);
 assert.equal(item.sha256,createHash("sha256").update(original.bytes).digest("hex"));
 assert.equal((await listArtwork(env,7)).artworks[0].settings.seed,66);
 assert.equal((await listArtwork(env,8)).artworks.length,0);assert.equal(await readArtwork(env,8,item.id),null);
 const response=await readArtwork(env,7,item.id);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),original.bytes);assert.match(response.headers.get("content-disposition"),/^attachment/);
 assert.equal(await deleteArtwork(env,8,item.id),false);assert.equal(rows.size,1);
 const k=[...objects.keys()][0],bytes=objects.get(k);bytes[0]^=1;await assert.rejects(readArtwork(env,7,item.id),/integrity/);
 assert.equal(await deleteArtwork(env,7,item.id),true);assert.equal(rows.size,0);assert.equal(objects.size,0);
});
test("failed R2 writes clean pending reservations and failed deletes remain retryable",async()=>{
 const {env,rows,objects}=fixture(),put=env.CREATOR_MEDIA.put;
 env.CREATOR_MEDIA.put=async()=>{throw Error("R2 unavailable");};
 await assert.rejects(archiveArtwork(env,7,generated()),/R2 unavailable/);assert.equal(rows.size,0);
 env.CREATOR_MEDIA.put=put;const item=await archiveArtwork(env,7,generated()),del=env.CREATOR_MEDIA.delete;
 env.CREATOR_MEDIA.delete=async()=>{throw Error("R2 delete unavailable");};await assert.rejects(deleteArtwork(env,7,item.id));assert.equal(rows.get(item.id).state,"deleting");assert.equal(await readArtwork(env,7,item.id),null);
 env.CREATOR_MEDIA.delete=del;assert.equal(await deleteArtwork(env,7,item.id),true);assert.equal(objects.size,0);
});
test("archive count cap and byte budget prevent new untracked originals",async()=>{
 const {env,rows,objects}=fixture();
 for(let i=0;i<60;i++)await archiveArtwork(env,7,generated());
 await assert.rejects(archiveArtwork(env,7,generated()),/archive full/);assert.equal(rows.size,60);assert.equal(objects.size,60);
});
