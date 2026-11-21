// Account recovery mail supports Cloudflare Email Sending when its Worker binding is enabled.
// Resend remains an optional fallback for existing deployments.
export function resetEmailConfigured(env) {
  return Boolean(env?.PASSWORD_RESET_FROM &&
    (typeof env?.EMAIL?.send === "function" || env?.RESEND_API_KEY));
}

function cloudflareFrom(sender) {
  const raw = String(sender || "").trim();
  const match = raw.match(/^(.+?)\s*<([^<>\s]+@[^<>\s]+)>$/);
  return match ? { name: match[1].trim(), email: match[2] } : raw;
}

export async function deliverPasswordResetEmail(env, { to, subject, text, html }) {
  if (!resetEmailConfigured(env)) return { ok: false, status: 503 };
  if (typeof env.EMAIL?.send === "function") {
    try {
      await env.EMAIL.send({
        from: cloudflareFrom(env.CLOUDFLARE_EMAIL_FROM || env.PASSWORD_RESET_FROM),
        to,
        subject,
        text,
        html,
      });
      return { ok: true, status: 202 };
    } catch (error) {
      // Never log reset URLs or tokens.
      console.error("password_reset_cloudflare_email_failed", error?.code || "send_failed");
      return { ok: false, status: 502 };
    }
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        authorization: "Bearer " + env.RESEND_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.PASSWORD_RESET_FROM,
        to: [to],
        subject,
        text,
        html,
      }),
    });
    return { ok: response.ok, status: response.status };
  } catch {
    console.error("password_reset_resend_email_failed", "network_error");
    return { ok: false, status: 502 };
  }
}
