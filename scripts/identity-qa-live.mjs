// Only read-only API checks and dedicated account login/logout. No response bodies in logs.
import assert from "node:assert/strict";
const API="https://api.ash-fall.com";
const cases=[["/api/admin/overview","can_admin"],["/api/moderation/reports?status=open","can_moderate"],["/api/devil-tools/assets?limit=1","can_create"],["/api/god/chaos/status","can_eye_of_chaos"],["/api/god/theme/status","can_theme_forge"],["/api/god/eye/status","can_eye_of_horus"],["/api/vault/summary","can_private_vault"]];
const roles=["member","moderator","admin"];
const credentials=roles.map(role=>({role,username:process.env["KNIGHTFALL_"+role.toUpperCase()+"_USERNAME"],password:process.env["KNIGHTFALL_"+role.toUpperCase()+"_PASSWORD"]}));
if(credentials.some(c=>!c.username||!c.password)){console.error("NOT RUN: dedicated audit account secrets are missing.");process.exit(2)}
if(new Set(credentials.map(c=>c.username.trim().toLowerCase())).size!==roles.length||credentials.some(c=>["knightfall","knightfallsamantha"].includes(c.username.trim().toLowerCase())))throw Error("Dedicated distinct non-owner accounts required.");
const req=(path,cookie,body)=>fetch(API+path,{method:body===undefined?"GET":"POST",redirect:"error",signal:AbortSignal.timeout(15000),headers:{Origin:"https://ash-fall.com",...(cookie?{Cookie:cookie}:{}),...(body===undefined?{}:{"content-type":"application/json"})},...(body===undefined?{}:{body:JSON.stringify(body)})});
const expected=(role,key)=>["can_admin","can_create","can_eye_of_chaos","can_theme_forge"].includes(key)?role==="admin":key==="can_moderate"?role!=="member":false;
for(const [path] of cases){const r=await req(path);assert.ok([401,403].includes(r.status),"anonymous "+path+" HTTP "+r.status);await r.body?.cancel();}
for(const c of credentials){
 let cookie;
 try{
  const login=await req("/api/auth/login",null,{identifier:c.username,password:c.password});
  assert.equal(login.status,200,c.role+" login status");cookie=login.headers.get("set-cookie")?.split(";")[0];assert.ok(cookie,c.role+" session issued");await login.body?.cancel();
  const me=await req("/api/auth/me",cookie);assert.equal(me.status,200);const {user}=await me.json();
  assert.ok(user&&user.status==="active"&&user.role===c.role&&user.staff_access?.rank_code!=="isis"&&user.staff_access?.can_handoff!==true,c.role+" verified non-royal identity");
  for(const [path,key] of cases){
   const allowed=expected(c.role,key);assert.equal(user.staff_access?.[key],allowed,c.role+" capability "+key);
   const r=await req(path,cookie);assert.ok(allowed?r.status===200:[401,403].includes(r.status),c.role+" "+path+" HTTP "+r.status);await r.body?.cancel();console.log("PASS",c.role,key);
  }
 }finally{
  if(cookie){const logout=await req("/api/auth/logout",cookie,{});assert.equal(logout.status,200,c.role+" logout");await logout.body?.cancel();
   const me=await req("/api/auth/me",cookie);assert.equal(me.status,200);assert.ok((await me.json()).user===null,c.role+" session invalidated");}
 }
}
console.log("PASS real login, read-only role boundaries, and logout for three dedicated accounts.");
