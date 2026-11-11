import test from "node:test";
import assert from "node:assert/strict";
import { verifyGitHubAuditToken, GITHUB_AUDIT_AUDIENCE } from "./developer-audit-oidc.js";
import { storeAuditUpload, readGodAuditSummary } from "./developer-audit-ingest.js";

const repo="xxxghostfacekidxxx-glitch/Knightfall";
const sha="a".repeat(40);
function b64url(value){return Buffer.from(typeof value==="string"?value:JSON.stringify(value)).toString("base64url");}
async function tokenFixture(overrides={}){
  const pair=await crypto.subtle.generateKey({name:"RSASSA-PKCS1-v1_5",modulusLength:2048,
    publicExponent:new Uint8Array([1,0,1]),hash:"SHA-256"},true,["sign","verify"]);
  const jwk=await crypto.subtle.exportKey("jwk",pair.publicKey);
  const kid="fixture-key";jwk.kid=kid;jwk.use="sig";jwk.alg="RS256";
  const now=Math.floor(Date.now()/1000);
  const claims={
    iss:"https://token.actions.githubusercontent.com",aud:GITHUB_AUDIT_AUDIENCE,
    sub:"repo:"+repo+":ref:refs/heads/main",
    repository:repo,repository_id:"1301740258",ref:"refs/heads/main",
    workflow_ref:repo+"/.github/workflows/developer-arsenal-audit.yml@refs/heads/main",
    event_name:"push",run_id:"400",sha,jti:"test-token-unique-0001",
    iat:now,nbf:now-1,exp:now+240,...overrides
  };
  const header=b64url({alg:"RS256",typ:"JWT",kid});
  const payload=b64url(claims);
  const signing=header+"."+payload;
  const signature=await crypto.subtle.sign({name:"RSASSA-PKCS1-v1_5"},pair.privateKey,new TextEncoder().encode(signing));
  return {token:signing+"."+Buffer.from(signature).toString("base64url"),keys:{keys:[jwk]}};
}
test("GitHub OIDC JWT verifies only with the exact trusted claims and signature",async()=>{
  const good=await tokenFixture();
  assert.equal(await verifyGitHubAuditToken({token:good.token,runId:400,sha,keyProvider:async()=>good.keys}),true);
  assert.equal(await verifyGitHubAuditToken({token:good.token,runId:401,sha,keyProvider:async()=>good.keys}),false);
  assert.equal(await verifyGitHubAuditToken({token:good.token,runId:400,sha:"b".repeat(40),keyProvider:async()=>good.keys}),false);
  assert.equal(await verifyGitHubAuditToken({token:good.token+"x",runId:400,sha,keyProvider:async()=>good.keys}),false);
  const immutable=await tokenFixture({sub:"repo:xxxghostfacekidxxx-glitch@252952996/Knightfall@1301740258:ref:refs/heads/main"});
  assert.equal(await verifyGitHubAuditToken({token:immutable.token,runId:400,sha,keyProvider:async()=>immutable.keys}),true);
  const bad=await tokenFixture({ref:"refs/heads/not-main"});
  assert.equal(await verifyGitHubAuditToken({token:bad.token,runId:400,sha,keyProvider:async()=>bad.keys}),false);
  const pr=await tokenFixture({event_name:"pull_request"});
  assert.equal(await verifyGitHubAuditToken({token:pr.token,runId:400,sha,keyProvider:async()=>pr.keys}),false);
});
test("OIDC upload is sanitized and available only to God principal",async()=>{
  const signed=await tokenFixture();
  const data=new Map();
  const env={SESSIONS:{
    get:async(k,t)=>t==="json"?JSON.parse(data.get(k)||"null"):data.get(k)||null,
    put:async(k,v)=>{data.set(k,v)}
  }};
  const summary={
    schemaVersion:1,tool:"knightfall-developer-arsenal",
    semgrep:{findings:1,severity:{ERROR:0,WARNING:1,INFO:0,UNKNOWN:0},scannerErrors:0},
    biome:{hasOutput:true,reportedErrors:0,reportedWarnings:0},
    suspicious:"NOT_FOR_USER"
  };
  const result=await storeAuditUpload({env,body:JSON.stringify({runId:400,sha,summary}),
    oidcToken:signed.token,keyProvider:async()=>signed.keys});
  assert.equal(result.status,204);
  await assert.rejects(readGodAuditSummary({env,principal:{id:4,role:"admin"}}),/Not authorized/);
  const report=await readGodAuditSummary({env,principal:{id:1,role:"god"}});
  assert.equal(report.semgrep.findings,1);
  assert.doesNotMatch(JSON.stringify(report),/NOT_FOR_USER/);
});
