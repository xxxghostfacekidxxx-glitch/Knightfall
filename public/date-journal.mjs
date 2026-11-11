export function localDateKey(date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map(part => String(part).padStart(2, '0')).join('-');
}

function element(tag, text, className) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function mountDateJournal({
  prefix, name, initialDay, onEntry, historyLabel, writeFields,
  extraControls = [], extraDirty = () => false
}) {
  const byId = suffix => document.getElementById(prefix + '-' + suffix);
  const journal = byId('journal-form');
  const journalControls = byId('journal-controls');
  const entryDate = byId('entry-date');
  const title = byId('entry-title');
  const body = byId('entry-body');
  const remove = byId('delete-entry');
  const journalStatus = byId('journal-status');
  const historyStatus = byId('journal-history-status');
  const retry = byId('journal-retry');
  const older = byId('older');
  let entry = null;
  let editingDay = initialDay;
  let nextPage = null;
  let journalReady = false;

  async function journalRequest(path = '', options = {}) {
    const response = await fetch('https://api.ash-fall.com/api/' + prefix + '-journal' + path, {
      credentials: 'include', cache: 'no-store', ...options
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && ('entry' in data || 'entries' in data || data.ok)) return data;
    const error = new Error(data.error || `${name} is unavailable. Try again shortly.`);
    error.status = response.status;
    throw error;
  }

  function journalFailure(error) {
    journalStatus.textContent = error.message;
    if (error.status === 401) byId('sign-in').hidden = false;
  }

  function setEditingEnabled(enabled) {
    [title, body, journal.querySelector('button[type="submit"]'), remove, ...extraControls].forEach(control => {
      control.disabled = !enabled;
    });
  }

  function setEntry(data) {
    entry = data;
    title.value = entry?.title || '';
    body.value = entry?.body || '';
    remove.hidden = !entry;
    onEntry(entry, editingDay);
  }

  async function openDay(day) {
    if (!journalReady || entryDate.disabled) return;
    if ((title.value !== (entry?.title || '') || body.value !== (entry?.body || '') || extraDirty(entry)) &&
        !window.confirm('Discard the unsaved changes to this entry?')) {
      entryDate.value = editingDay;
      return;
    }
    entryDate.value = day;
    if (!entryDate.validity.valid || !/^(19\d{2}|20\d{2}|2100)-\d{2}-\d{2}$/.test(day)) {
      entryDate.value = editingDay;
      return;
    }
    editingDay = day;
    entryDate.disabled = true;
    setEditingEnabled(false);
    setEntry(null);
    journalStatus.textContent = 'Loading entry…';
    retry.hidden = true;
    try {
      setEntry((await journalRequest('/' + day)).entry);
      setEditingEnabled(true);
      journalStatus.textContent = '';
    } catch (error) {
      journalFailure(error);
      retry.hidden = error.status === 401;
    } finally {
      entryDate.disabled = false;
    }
  }

  function appendHistory(entries, replace) {
    const history = byId('history');
    if (replace) history.replaceChildren();
    for (const item of entries) {
      const row = element('li');
      const button = element('button', item.title || 'Untitled entry');
      button.type = 'button';
      button.addEventListener('click', () => openDay(item.entry_date));
      row.append(button, element('span', [item.entry_date, historyLabel(item)].filter(Boolean).join(' · '), 'moon-muted'));
      history.append(row);
    }
    historyStatus.textContent = history.children.length ? '' : 'No entries yet.';
  }

  async function loadHistory(append = false) {
    older.disabled = true;
    try {
      const data = await journalRequest(append ? '?before=' + encodeURIComponent(nextPage) : '');
      appendHistory(data.entries, !append);
      nextPage = data.next;
      older.hidden = !nextPage;
    } catch (error) {
      historyStatus.textContent = error.message;
      throw error;
    } finally {
      older.disabled = false;
    }
  }

  async function startJournal() {
    retry.hidden = true;
    try {
      await loadHistory();
      journalReady = true;
      journalControls.hidden = false;
      await openDay(editingDay);
    } catch (error) {
      journalFailure(error);
      retry.hidden = error.status === 401;
    }
  }

  async function changeEntry(deleting = false) {
    entryDate.disabled = true;
    setEditingEnabled(false);
    try {
      const payload = {version: entry?.version ?? null};
      if (!deleting) Object.assign(payload, {title: title.value, body: body.value}, writeFields(entry, editingDay));
      const options = {
        method: deleting ? 'DELETE' : 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      };
      const data = await journalRequest('/' + editingDay, options);
      setEntry(data.entry || null);
      journalStatus.textContent = deleting ? 'Entry deleted.' : 'Entry saved.';
      await loadHistory().catch(() => {});
    } catch (error) {
      journalFailure(error);
    } finally {
      entryDate.disabled = false;
      setEditingEnabled(true);
    }
  }

  entryDate.addEventListener('change', () => {
    if (entryDate.validity.valid) openDay(entryDate.value);
    else entryDate.value = editingDay;
  });
  journal.addEventListener('submit', event => {
    event.preventDefault();
    changeEntry();
  });
  remove.addEventListener('click', () => {
    if (window.confirm(`Delete this ${name} entry?`)) changeEntry(true);
  });
  older.addEventListener('click', () => loadHistory(true).catch(() => {}));
  retry.addEventListener('click', () => journalReady ? openDay(editingDay) : startJournal());

  if (['ash-fall.com', 'www.ash-fall.com'].includes(location.hostname)) startJournal();
  else journalStatus.textContent = `Open Ash-Fall to use your ${name}.`;

  return {
    openDay,
    refreshPrompt() { onEntry(entry, editingDay); }
  };
}
