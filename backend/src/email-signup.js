import { authDestination } from "../../public/auth-destination.mjs";

const site = "https://ash-fall.com";
const ttlMs = 30 * 60 * 1000;

export function canSendVerification(env) {
  return Boolean(env.RESEND_API_KEY?.trim() && env.PASSWORD_RESET_FROM?.trim());
}

export async function verificationDigest(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

export function expiredEmailSignups(env, now = Date.now()) {
  return env.DB.prepare("DELETE FROM pending_email_signups WHERE expires_at<=?").bind(now);
}

export async function beginEmailSignup(env, signup) {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const digest = await verificationDigest(token);
  const now = Date.now();
  const remove = env.DB.prepare("DELETE FROM pending_email_signups WHERE token_hash=?").bind(digest);
  await env.DB.batch([
    expiredEmailSignups(env, now),
    env.DB.prepare(
      "INSERT INTO pending_email_signups (token_hash,username,email,display_name,password_hash,return_to,expires_at) VALUES (?,?,?,?,?,?,?)"
    ).bind(digest, signup.username, signup.email, signup.displayName, signup.passwordHash, authDestination(signup.returnTo), now + ttlMs)
  ]);

  const link = site + "/verify-email.html#token=" + token;
  try {
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: "Bearer " + env.RESEND_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({
        from: env.PASSWORD_RESET_FROM,
        to: [signup.email],
        subject: "Verify your Ash-Fall email",
        text: "Finish creating your Ash-Fall account using this link within 30 minutes. You’ll need the password you chose at signup. If you didn’t request an account, ignore this email.\n\n" + link
      })
    });
    if (sent.ok) return true;
    console.warn("signup_email_provider_rejected", sent.status);
  } catch {
    console.warn("signup_email_provider_unreachable");
  }
  await remove.run();
  return false;
}

export async function finishEmailSignup(env, token, password, verifyPassword) {
  const tokenHash = await verificationDigest(token);
  const pending = await env.DB.prepare(
    "SELECT password_hash,return_to FROM pending_email_signups WHERE token_hash=? AND expires_at>?"
  ).bind(tokenHash, Date.now()).first();
  if (!pending || !await verifyPassword(password, pending.password_hash)) return { status: "invalid" };

  const now = new Date().toISOString();
  const [created, consumed] = await env.DB.batch([
    env.DB.prepare(`INSERT INTO users (username,email,password_hash,display_name,role,created_at,updated_at)
      SELECT username,email,password_hash,display_name,'member',?,? FROM pending_email_signups
      WHERE token_hash=? AND expires_at>? ON CONFLICT DO NOTHING RETURNING id`).bind(now, now, tokenHash, Date.now()),
    env.DB.prepare("DELETE FROM pending_email_signups WHERE token_hash=?").bind(tokenHash)
  ]);
  const id = created.results?.[0]?.id;
  if (!id) return { status: consumed.meta?.changes ? "conflict" : "invalid" };
  return { status: "verified", id, returnTo: authDestination(pending.return_to) };
}
