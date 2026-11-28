/**
 * Build a portable, explicit GitHub Actions manual-check packet locally.
 * Never sends candidate source, starts a workflow, or claims approval.
 */
export const CHAOS_CANDIDATE_WORKFLOW="https://github.com/xxxghostfacekidxxx-glitch/Knightfall/actions/workflows/miss-chaos-candidate-check.yml";
export const CHAOS_CANDIDATE_KIT_SCHEMA="knightfall.miss-chaos.manual-candidate-check.v1";
const SHA=/^[a-f0-9]{40}$/,PATH=/^(?:public|backend)\/[A-Za-z0-9_./-]+\.(?:js|mjs|cjs|ts|tsx|jsx|json)$/;
const UNSAFE=/(?:^|\/)(?:\.{1,2}|node_modules|dist|coverage|secrets?|private-keys|credentials)(?:\/|$)|(?:^|[-_.\/])(?:passwords?|credentials?|api[-_]?keys?|access[-_]?tokens?)(?:[-_.\/]|$)/i;
const MAX_BYTES=5000;
const REVIEW_TARGETS=new Set(["public/miss-chaos-guide-core.mjs","public/chaos-visual-effects.mjs","public/chaos-review-test-kit.mjs","backend/chaos-public-tools.mjs","public/chaos-crucible-core.mjs","public/chaos-crucible-progress.mjs","public/chaos-crucible-shelf.mjs"]);
function encodeBytesAsBase64(bytes){
 let raw="";
 for(const n of bytes)raw+=String.fromCharCode(n);
 return btoa(raw);
}
export async function makeChaosCandidateTestKit(proposal,{digest}={}){
 if(!proposal||typeof proposal!=="object"||Array.isArray(proposal))
   throw Error("Capture a verified complete-file proposal first.");
 const {path,source_sha,candidate}=proposal;
 if(typeof source_sha!=="string"||!SHA.test(source_sha)||
    typeof path!=="string"||path.length>190||!PATH.test(path)||
    UNSAFE.test(path)||path.includes("..")||path.includes("//")||path.includes("\\"))
   throw Error("Use a pinned main SHA and allowlisted source path.");
 if(typeof candidate!=="string"||!candidate.trim()||candidate.includes("\r")||candidate.includes("\0"))
   throw Error("A complete LF-only candidate text is required.");
 const bytes=new TextEncoder().encode(candidate);
 const fullReview=REVIEW_TARGETS.has(path);
 if(bytes.length>(fullReview?16000:MAX_BYTES)||candidate.split("\n").length>(fullReview?200:80)||
    candidate.split("\n").some(line=>line.length>(fullReview?600:300)))
   throw Error("The complete source must be 1–5,000 UTF-8 bytes and 80 lines or fewer.");
 const hash=digest||(typeof crypto!=="undefined"?crypto.subtle?.digest?.bind(crypto.subtle):null);
 if(typeof hash!=="function")throw Error("Secure browser hashing is unavailable.");
 const sha=Array.from(new Uint8Array(await hash("SHA-256",bytes)),n=>n.toString(16).padStart(2,"0")).join("");
 if(!/^[a-f0-9]{64}$/.test(sha))throw Error("Could not confirm candidate SHA-256.");
 return {
  schema:CHAOS_CANDIDATE_KIT_SCHEMA,
  workflow:CHAOS_CANDIDATE_WORKFLOW,
  warning:"Manual GitHub Actions check of public-source code only. Do not paste private user data, passwords or keys. This packet is NOT an approval, code commit, production deployment or full CI verdict.",
  inputs:{
    base_sha:source_sha,path,
    candidate_base64:encodeBytesAsBase64(bytes),
    candidate_sha256:sha,
    run_targeted_tests:false
  },
  verification:{
   source:"staff SHA-pinned complete-file Code Studio proposal",
   base_check:"Workflow validates its own current main checkout SHA against base_sha.",
   candidate_check:"Workflow validates SHA-256 and runs non-executing syntax checks.",
   optional_tests:"Pinned tests only with explicit opt-in; never passed Cloudflare deployment credentials.",
   result:"Standalone candidate test artifact, not an approved or deployed status."
  }
 };
}
