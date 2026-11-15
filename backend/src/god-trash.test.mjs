import test from "node:test";
import assert from "node:assert/strict";
import {handleGodTrash} from "./god-trash.js";
function fixture(role="god"){
 const user={id:3,role,status:"active"},queries=[],writes=[],files=[];
 const env={
  DB:{prepare(sql){queries.push(sql);let args=[];
    return {bind(...v){args=v;return this;},
      async all(){return {results:sql.includes("deleted_at IS NOT NULL")?[{id:7,label:"Trashed content",deleted_at:"2026-11-14"}]:[]};},
      async first(){return {id:7,deleted_at:"2026-11-14",object_key:"photo/example"};},
      async run(){writes.push({sql,args});return {meta:{changes:1}};}
    };
  }},
  PROFILE_MEDIA:{async delete(key){files.push(key);}},
  MESSAGE_ATTACHMENTS:{async delete(key){files.push(key);}}
 };
 const deps={requireUser:async()=>user,json:(body,status=200)=>new Response(JSON.stringify(body),{status}),origin:"https://ash-fall.com"};
 const call=(path,method="GET",siteOrigin="https://ash-fall.com")=>{
  const request=new Request("https://api.ash-fall.com"+path,{method,headers:{"Origin":siteOrigin}});
  return handleGodTrash(request,env,new URL(request.url),deps);
 };
 return {call,queries,writes,files};
}
test("God-only recovery vault cannot be accessed by Admin, Moderator, Digital Creator",async()=>{
 for(const role of ["admin","moderator","member"]){
  const f=fixture(role);assert.equal((await f.call("/api/god/trash")).status,403);
  assert.equal(f.queries.length,0);
 }
});
test("GOD can browse and restore soft deleted content without review or access log",async()=>{
 const f=fixture();const list=await f.call("/api/god/trash?category=messages");
 assert.equal(list.status,200);
 assert.ok((await list.json()).items.length>0);
 assert.equal((await f.call("/api/god/trash/messages/7/restore","POST")).status,200);
 assert.ok(f.writes.some(x=>x.sql.includes("SET deleted_at=NULL")));
 assert.ok(f.writes.every(x=>!x.sql.includes("audit")));
});
test("Permanent purge only applies to deleted records and uses God-scoped route",async()=>{
 const f=fixture();
 assert.equal((await f.call("/api/god/trash/profile_photos/7/purge","POST","https://evil.invalid")).status,403);
 assert.equal((await f.call("/api/god/trash/profile_photos/7/purge","POST")).status,200);
 assert.deepEqual(f.files,["photo/example"]);
 assert.ok(f.writes.some(x=>x.sql.includes("DELETE FROM profile_photos")));
 assert.equal((await f.call("/api/god/trash/not_a_table/7/purge","POST")).status,404);
});
