import { verifyGitHubAuditToken, GITHUB_AUDIT_AUDIENCE } from "../backend/src/developer-audit-oidc.js";
const owner="xxxghostfacekidxxx-glitch/Knightfall";
if (!process.env.ACTIONS_ID_TOKEN_REQUEST_URL || !process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
  throw Error("GitHub OIDC runner token endpoint unavailable.");
}
const uri=new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL);
uri.searchParams.set("audience",GITHUB_AUDIT_AUDIENCE);
const r=await fetch(uri,{headers:{Authorization:"Bearer "+process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN},redirect:"error"});
if(!r.ok)throw Error("Cannot request workflow identity: HTTP "+r.status);
const token=(await r.json()).value;
if(typeof token!=="string"||!token)throw Error("Missing workflow identity token.");
const claims=JSON.parse(Buffer.from(token.split(".")[1],"base64url").toString("utf8"));
const now=Math.floor(Date.now()/1000);
const checks={
  issuer:claims.iss==="https://token.actions.githubusercontent.com",
  audience:claims.aud===GITHUB_AUDIT_AUDIENCE,
  subject:claims.sub==="repo:"+owner+":ref:refs/heads/main",
  repository:claims.repository===owner,
  repositoryId:String(claims.repository_id)==="1301740258",
  workflowRef:claims.workflow_ref===owner+"/.github/workflows/developer-arsenal-audit.yml@refs/heads/main",
  ref:claims.ref==="refs/heads/main",
  event:["push","workflow_dispatch"].includes(claims.event_name),
  run:String(claims.run_id)===String(process.env.GITHUB_RUN_ID),
  sha:claims.sha===process.env.GITHUB_SHA,
  jti:typeof claims.jti==="string"&&claims.jti.length>=8,
  clock:Number.isInteger(claims.exp)&&Number.isInteger(claims.iat)&&Number.isInteger(claims.nbf)&&
    now<claims.exp&&claims.nbf<=now+30&&claims.iat<=now+30&&now-claims.iat<=300&&claims.exp-claims.iat<=1200,
};
const valid=await verifyGitHubAuditToken({token,runId:Number(process.env.GITHUB_RUN_ID),sha:process.env.GITHUB_SHA});
console.log("OIDC signed subject (public workflow identity): "+String(claims.sub||"").slice(0,260).replace(/[\r\n]/g,""));
console.log("OIDC expected-claim checks (booleans only): "+JSON.stringify(checks));
console.log("OIDC cryptographic verifier: "+(valid?"PASS":"FAIL"));
// Never log the token, signing keys, or a claim payload.
if(!valid)throw Error("GitHub workflow identity does not satisfy the current Worker trust policy.");
