const API = process.env.KNIGHTFALL_API || "https://api.ash-fall.com";
const creds = {
  member: [process.env.KNIGHTFALL_MEMBER_USERNAME, process.env.KNIGHTFALL_MEMBER_PASSWORD],
  moderator: [process.env.KNIGHTFALL_MODERATOR_USERNAME, process.env.KNIGHTFALL_MODERATOR_PASSWORD],
  admin: [process.env.KNIGHTFALL_ADMIN_USERNAME, process.env.KNIGHTFALL_ADMIN_PASSWORD],
};

async function login(pair) {
  const r = await fetch(API + "/api/auth/login", {method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({identifier:pair[0],password:pair[1]})});
  if (!r.ok) throw new Error("login failed: " + r.status);
  const c = r.headers.get("set-cookie");
  if (!c) throw new Error("session cookie missing");
  return c.split(";")[0];
}
async function call(path, cookie, method="GET", body) {
  const h = {Cookie:cookie};
  if (body !== undefined) h["content-type"]="application/json";
  const r = await fetch(API+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,text:await r.text()};
}
function ok(r, codes, label) {
  if (!codes.includes(r.status)) throw new Error(label+" expected "+codes.join("/")+" got "+r.status);
  console.log("PASS",label,r.status);
}

const member = await login(creds.member);
const moderator = await login(creds.moderator);
const admin = await login(creds.admin);
const cats = JSON.parse((await call("/api/categories",member)).text);
const category_id = Number(cats.categories?.[0]?.id);
if (!Number.isInteger(category_id)) throw new Error("category unavailable");

const made = await call("/api/threads",member,"POST",{title:"Ownership audit",body:"Automated test record.",category_id});
if (made.status !== 201) throw new Error("thread create failed: "+made.status);
const thread_id = Number(JSON.parse(made.text).id);

try {
  ok(await call("/api/threads/"+thread_id,moderator,"PATCH",{title:"Changed"}),[403],"thread boundary");
  const post = await call("/api/threads/"+thread_id,member,"POST",{body:"Automated test post."});
  if (post.status !== 201) throw new Error("post create failed: "+post.status);
  const post_id = Number(JSON.parse(post.text).id);
  ok(await call("/api/posts/"+post_id,moderator,"PATCH",{body:"Changed"}),[403],"post boundary");
  ok(await call("/api/posts/"+post_id,moderator,"DELETE"),[403],"post delete boundary");
} finally {
  const softDelete = await call("/api/threads/"+thread_id,admin,"PATCH",{deleted:true});
  ok(softDelete,[200],"cleanup soft-delete");
  const purge = await call("/api/admin/content/threads/"+thread_id,admin,"PATCH",{action:"purge"});
  ok(purge,[200],"cleanup permanent purge");
}

console.log("Ownership audit completed.");
