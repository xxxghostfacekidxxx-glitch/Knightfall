import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const inbox=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");

test("mutual friend requests accept atomically and notify only the winning transition",()=>{
  const start=backend.indexOf('if(existing?.status==="pending"&&existing.addressee_id===user.id){');
  const end=backend.indexOf("\n    let requestId=existing?.id||null;",start);
  assert.ok(start>=0&&end>start,"expected the cross-request acceptance branch");
  const branch=backend.slice(start,end);
  assert.match(branch,/WHERE id=\? AND status='pending' AND addressee_id=\?/);
  assert.match(branch,/changed\.meta\?\.changes/);
  assert.match(branch,/latest\?\.status==="accepted"/);
  assert.equal((branch.match(/createNotification\(/g)||[]).length,1);
  assert.ok(branch.indexOf("changed.meta")<branch.indexOf("createNotification("));
});

test("retries of an already handled incoming request return its final state",()=>{
  const start=backend.indexOf('if(friendRequestMatch&&request.method==="PATCH"){');
  const end=backend.indexOf('if(url.pathname==="/api/discover"',start);
  assert.ok(start>=0&&end>start,"expected the friend request action route");
  const route=backend.slice(start,end);
  assert.match(route,/SELECT id,requester_id,status FROM friend_requests WHERE id=\? AND addressee_id=\?/);
  assert.match(route,/if\(row\.status===status\)return json\(\{ok:true,status,already_handled:true\},200,origin\)/);
  assert.match(route,/if\(row\.status!=="pending"\)return json\(\{error:"That friend request was already handled\.",status:row\.status\},409,origin\)/);
  assert.match(route,/latest\?\.status===status\)return json\(\{ok:true,status,already_handled:true\},200,origin\)/);
});

test("friend reloads ignore stale responses and request actions lock while pending",()=>{
  assert.match(inbox,/friendData=\{friends:\[\],incoming:\[\],outgoing:\[\]\},friendLoadToken=0/);
  assert.match(inbox,/const token=\+\+friendLoadToken,d=await api\("\/api\/friends"\);if\(token!==friendLoadToken\)return/);
  assert.match(inbox,/friendActionLocks\.has\(username\)/);
  assert.match(inbox,/add\.disabled=true;add\.setAttribute\("aria-busy","true"\)/);
});
