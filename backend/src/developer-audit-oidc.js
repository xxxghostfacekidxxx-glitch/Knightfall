/* Verify GitHub Actions OIDC JWTs for one narrowly-scoped CI report upload.
 * No GitHub personal access token or static shared secret is needed.
 */
const ISSUER = "https://token.actions.githubusercontent.com";
const JWKS_URL = ISSUER + "/.well-known/jwks";
const AUDIENCE = "https://api.ash-fall.com/api/internal/developer-audit";
const REPO = "xxxghostfacekidxxx-glitch/Knightfall";
const REPO_ID = "1301740258";
const WORKFLOW_REF = REPO + "/.github/workflows/developer-arsenal-audit.yml@refs/heads/main";
const SUBJECTS = new Set([
  "repo:" + REPO + ":ref:refs/heads/main",
  "repo:xxxghostfacekidxxx-glitch@252952996/Knightfall@1301740258:ref:refs/heads/main"
]);

function decodeBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/.test(value) || value.length > 16384) {
    throw new Error("Invalid token encoding.");
  }
  const standard = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard + "=".repeat((4 - standard.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}
function tokenPart(part) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(part)));
}
async function fetchGitHubKeys() {
  const response = await fetch(JWKS_URL, { headers: {accept:"application/json"} });
  if (!response.ok) throw new Error("GitHub OIDC key retrieval failed.");
  return response.json();
}
/** Returns false if a JWT or any claim is invalid. Never log or return the token. */
export async function verifyGitHubAuditToken({token, runId, sha, now = Date.now(), keyProvider = fetchGitHubKeys}) {
  if (typeof token !== "string" || token.length > 8192) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const [encodedHeader, encodedClaims, encodedSignature] = parts;
    const header = tokenPart(encodedHeader);
    const claims = tokenPart(encodedClaims);
    if (header?.alg !== "RS256" || typeof header.kid !== "string" || !header.kid) return false;
    const seconds = Math.floor(now / 1000);
    if (claims.iss !== ISSUER || claims.aud !== AUDIENCE || !SUBJECTS.has(claims.sub)) return false;
    if (claims.repository !== REPO || String(claims.repository_id) !== REPO_ID ||
        claims.workflow_ref !== WORKFLOW_REF || claims.ref !== "refs/heads/main") return false;
    if (!["push","workflow_dispatch"].includes(claims.event_name)) return false;
    if (String(claims.run_id) !== String(runId) || claims.sha !== sha) return false;
    if (typeof claims.jti !== "string" || claims.jti.length < 8) return false;
    if (!Number.isInteger(claims.exp) || !Number.isInteger(claims.iat) || !Number.isInteger(claims.nbf) ||
        seconds >= claims.exp || claims.nbf > seconds + 30 || claims.iat > seconds + 30 ||
        seconds - claims.iat > 300 || claims.exp - claims.iat > 1200) return false;
    const jwks = await keyProvider();
    const jwk = jwks?.keys?.find(key=>key.kid===header.kid && key.kty==="RSA" &&
       key.use === "sig" && key.alg === "RS256");
    if (!jwk) return false;
    const publicKey = await crypto.subtle.importKey("jwk", jwk,
      {name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    return await crypto.subtle.verify({name:"RSASSA-PKCS1-v1_5"}, publicKey,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(encodedHeader+"."+encodedClaims));
  } catch { return false; }
}
export const GITHUB_AUDIT_AUDIENCE = AUDIENCE;
