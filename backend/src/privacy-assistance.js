// Public account-deletion assistance, separate from verified account deletion.
// Stores minimal, unverified contacts in expiring KV; only staff can view tickets.
export const PRIVACY_HELP_PREFIX = 'privacy-help:v1:';
const RETENTION_SECONDS = 60 * 60 * 24 * 90;
export function privacyTicketExpiry(createdAt, now = Date.now()) {
  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs) || createdMs > now) return null;
  const expiryMs = createdMs + RETENTION_SECONDS * 1000;
  if (expiryMs <= now) return null;
  return Math.ceil(expiryMs / 1000);
}


export function validatePrivacyAssistance(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return { error: 'Invalid request.' };
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const username = typeof payload.username === 'string' ? payload.username.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) return { error: 'Enter a valid contact email address.' };
  if (username && !/^[a-z0-9_]{3,24}$/.test(username)) return { error: 'Enter a valid username or leave it blank.' };
  if (payload.acknowledged !== true) return { error: 'Confirm that identity verification is required before deletion.' };
  return { value: { email, username } };
}

export async function handlePrivacyAssistance(request, env, url, { getUser, json, rateLimit, isAdmin, origin, createNotification }) {
  const path = url.pathname;
  const publicPath = '/api/privacy/deletion-assistance';
  const staffPath = '/api/admin/privacy-assistance';
  const detail = path.match(/^\/api\/admin\/privacy-assistance\/([0-9a-f]{32})$/);
  if (path !== publicPath && path !== staffPath && !detail) return null;
  const reply = (data, status = 200) => json(data, status, origin);
  if (path === publicPath) {
    if (request.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
    // Browser requests must originate on Knightfall itself. They never carry login cookies.
    if (request.headers.get('Origin') !== origin || !/^https:\/\/(?:www\.)?ash-fall\.com$/.test(origin)) {
      return reply({ error: 'Open this form on ash-fall.com.' }, 403);
    }
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
      return reply({ error: 'Submit the form as JSON.' }, 415);
    }
    if (Number(request.headers.get('content-length') || 0) > 2048) return reply({ error: 'Request is too large.' }, 413);
    if (!await rateLimit(env, request, 'privacy-help', 3, 86400)) return reply({ error: 'Too many requests from this connection. Try again tomorrow.' }, 429);
    let payload;
    try { payload = await request.json(); } catch { return reply({ error: 'Invalid JSON.' }, 400); }
    if (payload?.website) return reply({ ok: true, message: 'Your assistance request was received.' }, 202);
    const checked = validatePrivacyAssistance(payload);
    if (checked.error) return reply({ error: checked.error }, 400);
    const requestId = [...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');
    const data = {
      request_id: requestId,
      email: checked.value.email,
      username_hint: checked.value.username,
      status: 'pending',
      created_at: new Date().toISOString(),
      operator_note: ''
    };
    await env.SESSIONS.put(PRIVACY_HELP_PREFIX + requestId, JSON.stringify(data), { expirationTtl: RETENTION_SECONDS });
    // A missing notification must not discard the saved privacy assistance ticket.
    try {
      const admins = await env.DB.prepare("SELECT id FROM users WHERE role IN ('admin','god') AND status='active'").all();
      await Promise.allSettled((admins.results || []).map(a => createNotification(env, {
        userId:a.id,kind:'account_deletion_request',targetType:'privacy_assistance',
        title:'Account privacy assistance',body:'Someone needs help verifying an account deletion request.',
        url:'/admin-privacy-assistance.html'
      })));
    } catch (error) { console.warn('privacy_help_staff_notice_failed', String(error)); }
    return reply({
      ok:true,request_id:requestId,
      message:'Your assistance request was recorded for staff review. Staff must verify account ownership before any deletion. This did not delete your account or create a verified deletion request.'
    }, 202);
  }
  const user = await getUser(request, env);
  if (!isAdmin(user)) return reply({ error: 'Administrator access required.' }, 403);
  if (path === staffPath && request.method === 'GET') {
    const cursor = url.searchParams.get('cursor');
    if (cursor && (cursor.length > 500 || /[^A-Za-z0-9=_-]/.test(cursor))) return reply({ error: 'Invalid page cursor.' }, 400);
    const listing = await env.SESSIONS.list({ prefix: PRIVACY_HELP_PREFIX, limit: 30, ...(cursor ? { cursor } : {}) });
    const tickets = (await Promise.all((listing.keys || []).map(async k => {
      try { return await env.SESSIONS.get(k.name, 'json'); } catch { return null; }
    }))).filter(Boolean).map(({ email, username_hint, request_id, status, created_at, operator_note }) =>
      ({ email, username_hint, request_id, status, created_at, operator_note }));
    tickets.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
    return reply({ tickets, next_cursor: listing.list_complete ? null : listing.cursor });
  }
  if (detail && request.method === 'PATCH') {
    let payload;
    try { payload = await request.json(); } catch { return reply({ error: 'Invalid JSON.' }, 400); }
    const status = String(payload?.status || '');
    if (!['reviewing','awaiting_verification','closed'].includes(status)) return reply({ error: 'Invalid assistance status.' }, 400);
    const note = typeof payload?.operator_note === 'string' ? payload.operator_note.trim() : '';
    if (note.length > 500 || (status === 'closed' && !note)) return reply({ error: 'Add a brief staff note (500 characters maximum) before closing.' }, 400);
    const key = PRIVACY_HELP_PREFIX + detail[1];
    const existing = await env.SESSIONS.get(key, 'json');
    if (!existing) return reply({ error: 'Request not found or expired.' }, 404);
    // A staff edit must not restart the original 90-day privacy retention period.
    const expiresAt = privacyTicketExpiry(existing.created_at);
    if (!expiresAt) return reply({ error: 'Request expired or invalid. Submit a new assistance request.' }, 410);
    const updated = { ...existing, status, operator_note: note, updated_at: new Date().toISOString() };
    await env.SESSIONS.put(key, JSON.stringify(updated), { expiration: expiresAt });
    return reply({ ok:true,status });
  }
  return reply({ error: 'Method not allowed.' }, 405);
}
