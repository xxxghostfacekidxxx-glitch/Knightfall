function validDay(value) {
  if (typeof value !== 'string' || !/^(19\d{2}|20\d{2}|2100)-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T12:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
}

// Journal definitions are supplied only by the Worker. Table and column names
// are server constants. Member values are always bound as parameters.
export async function handleDateJournal(request, env, url, {getUser, json, rateLimit, origin}, definition) {
  const {name, table, metadata, readMetadata, bucket, updateMetadata = false} = definition;
  const fields = ['entry_date', ...metadata, 'title', 'body', 'created_at', 'updated_at', 'version'].join(', ');
  const respond = (body, status = 200) => json(body, status, origin);
  const user = await getUser(request, env);
  if (!user) return respond({error: `Sign in to access your ${name}.`}, 401);

  const day = url.pathname.split('/')[3];
  if (day && !validDay(day)) return respond({error: 'Choose a valid journal date.'}, 400);
  if (request.method === 'GET' && !day) {
    const before = url.searchParams.get('before');
    if (before !== null && !validDay(before)) return respond({error: 'Invalid journal page.'}, 400);
    const {results} = await env.DB.prepare(`SELECT ${fields} FROM ${table}
      WHERE user_id = ? AND entry_date < ? ORDER BY entry_date DESC LIMIT 21`)
      .bind(user.id, before ?? '2101-01-01').all();
    const entries = results.slice(0, 20);
    return respond({entries, next: results.length > 20 ? entries.at(-1).entry_date : null});
  }

  if (!day || !['GET', 'PUT', 'DELETE'].includes(request.method)) return respond({error: 'Unsupported method.'}, 405);
  if (request.method === 'GET') {
    const entry = await env.DB.prepare(`SELECT ${fields} FROM ${table} WHERE user_id = ? AND entry_date = ?`)
      .bind(user.id, day).first();
    return respond({entry});
  }

  if (!await rateLimit(env, request, bucket, 30, 60, user.id)) {
    return respond({error: 'Too many journal changes. Try again shortly.'}, 429);
  }
  const data = await request.json().catch(() => null);
  const expected = data?.version;
  if (expected !== null && (typeof expected !== 'string' || !/^[a-f0-9-]{36}$/.test(expected))) {
    return respond({error: 'Invalid journal version.'}, 400);
  }
  const conflict = () => respond({error: 'This entry changed elsewhere. Copy any unsaved text before reopening the date.'}, 409);
  if (request.method === 'DELETE') {
    const result = await env.DB.prepare(`DELETE FROM ${table} WHERE user_id = ? AND entry_date = ? AND version = ?`)
      .bind(user.id, day, expected).run();
    return result.meta?.changes ? respond({ok: true}) : conflict();
  }

  const title = typeof data?.title === 'string' ? data.title.trim() : null;
  const body = typeof data?.body === 'string' ? data.body.trim() : '';
  if (title === null || title.length > 100 || !body || body.length > 8000) {
    return respond({error: 'Write a journal entry of up to 8,000 characters and a title of up to 100.'}, 400);
  }
  const extra = !expected || updateMetadata ? readMetadata(data, day) : [];
  if (typeof extra === 'string') return respond({error: extra}, 400);
  const now = new Date().toISOString();
  const version = crypto.randomUUID();
  let entry;
  if (expected) {
    const updates = updateMetadata ? metadata.map(column => column + ' = ?, ').join('') : '';
    entry = await env.DB.prepare(`UPDATE ${table} SET ${updates}title = ?, body = ?, updated_at = ?, version = ?
      WHERE user_id = ? AND entry_date = ? AND version = ? RETURNING ${fields}`)
      .bind(...extra, title, body, now, version, user.id, day, expected).first();
  } else {
    const values = [user.id, day, ...extra, title, body, now, now, version];
    entry = await env.DB.prepare(`INSERT INTO ${table} (user_id, ${fields})
      VALUES (${values.map(() => '?').join(', ')}) ON CONFLICT(user_id, entry_date) DO NOTHING
      RETURNING ${fields}`).bind(...values).first();
  }
  return entry ? respond({entry}) : conflict();
}
