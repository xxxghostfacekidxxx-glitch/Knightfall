import * as Astronomy from 'astronomy-engine';
import { phaseIndex } from '../../public/lunar-phases.mjs';

const fields = 'entry_date, phase_index, phase_at, time_zone, title, body, created_at, updated_at, version';

function validDay(value) {
  if (typeof value !== 'string' || !/^(19\d{2}|20\d{2}|2100)-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

function phaseTime(value, timeZone, day) {
  if (typeof value !== 'string' || value.length !== 24 || typeof timeZone !== 'string' || timeZone.length > 80) return null;
  const date = new Date(value);
  if (!Number.isFinite(+date) || date.toISOString() !== value) return null;
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    });
    const parts = Object.fromEntries(formatter.formatToParts(date).map(({type, value}) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}` === day && parts.hour === '12' && parts.minute === '00' ? date : null;
  } catch {
    return null;
  }
}

export async function handleMoonJournal(request, env, url, {getUser, json, rateLimit, origin}) {
  const respond = (body, status = 200) => json(body, status, origin);
  const user = await getUser(request, env);
  if (!user) return respond({error: 'Sign in to access your Moon Journal.'}, 401);

  const day = url.pathname.split('/')[3];
  if (day && !validDay(day)) return respond({error: 'Choose a valid journal date.'}, 400);
  if (request.method === 'GET' && !day) {
    const before = url.searchParams.get('before');
    if (before !== null && !validDay(before)) return respond({error: 'Invalid journal page.'}, 400);
    const {results} = await env.DB.prepare(`SELECT ${fields} FROM moon_journal
      WHERE user_id = ? AND entry_date < ? ORDER BY entry_date DESC LIMIT 21`)
      .bind(user.id, before ?? '2101-01-01').all();
    const entries = results.slice(0, 20);
    return respond({entries, next: results.length > 20 ? entries.at(-1).entry_date : null});
  }

  if (!day || !['GET', 'PUT', 'DELETE'].includes(request.method)) return respond({error: 'Unsupported method.'}, 405);
  if (request.method === 'GET') {
    const entry = await env.DB.prepare(`SELECT ${fields} FROM moon_journal WHERE user_id = ? AND entry_date = ?`)
      .bind(user.id, day).first();
    return respond({entry});
  }

  if (!await rateLimit(env, request, 'moon-journal-write', 30, 60, user.id)) {
    return respond({error: 'Too many journal changes. Try again shortly.'}, 429);
  }
  const data = await request.json().catch(() => null);
  const expected = data?.version;
  if (expected !== null && (typeof expected !== 'string' || !/^[a-f0-9-]{36}$/.test(expected))) {
    return respond({error: 'Invalid journal version.'}, 400);
  }
  const conflict = () => respond({error: 'This entry changed elsewhere. Copy any unsaved text before reopening the date.'}, 409);
  if (request.method === 'DELETE') {
    const result = await env.DB.prepare('DELETE FROM moon_journal WHERE user_id = ? AND entry_date = ? AND version = ?')
      .bind(user.id, day, expected).run();
    return result.meta?.changes ? respond({ok: true}) : conflict();
  }

  const title = typeof data?.title === 'string' ? data.title.trim() : null;
  const body = typeof data?.body === 'string' ? data.body.trim() : '';
  if (title === null || title.length > 100 || !body || body.length > 8000) {
    return respond({error: 'Write a journal entry of up to 8,000 characters and a title of up to 100.'}, 400);
  }
  const now = new Date().toISOString();
  const version = crypto.randomUUID();
  let entry;
  if (expected) {
    // Edits preserve the original lunar snapshot and never overwrite a newer version.
    entry = await env.DB.prepare(`UPDATE moon_journal SET title = ?, body = ?, updated_at = ?, version = ?
      WHERE user_id = ? AND entry_date = ? AND version = ? RETURNING ${fields}`)
      .bind(title, body, now, version, user.id, day, expected).first();
  } else {
    const time = phaseTime(data.phase_at, data.time_zone, day);
    if (!time) return respond({error: 'Could not match local noon to this journal date.'}, 400);
    const index = phaseIndex(Astronomy.MoonPhase(time));
    entry = await env.DB.prepare(`INSERT INTO moon_journal
      (user_id, entry_date, phase_index, phase_at, time_zone, title, body, created_at, updated_at, version)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(user_id, entry_date) DO NOTHING
      RETURNING ${fields}`)
      .bind(user.id, day, index, time.toISOString(), data.time_zone, title, body, now, now, version).first();
  }
  return entry ? respond({entry}) : conflict();
}
