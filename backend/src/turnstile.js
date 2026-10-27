export async function checkTurnstile(env, request, token) {
  if (!env.TURNSTILE_SECRET_KEY && !env.TURNSTILE_SITE_KEY) return true;
  if (!env.TURNSTILE_SECRET_KEY || !env.TURNSTILE_SITE_KEY) return false;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    const remoteip = request.headers.get("CF-Connecting-IP");
    if (remoteip) body.set("remoteip", remoteip);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body, signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.success === true &&
      ["ash-fall.com", "www.ash-fall.com"].includes(result.hostname);
  } catch {
    return false;
  }
}
