import { phases, lunarSnapshot } from './lunar-phases.mjs';
import { loadAstronomy } from './moon-widget.mjs';

const byId = id => document.getElementById(id);
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
const dateKey = date => [date.getFullYear(), date.getMonth() + 1, date.getDate()]
  .map(part => String(part).padStart(2, '0')).join('-');
const localNoon = day => new Date(day + 'T12:00:00');
const phaseTime = new Intl.DateTimeFormat(undefined, {dateStyle: 'medium', timeStyle: 'short'});
const dateLabel = new Intl.DateTimeFormat(undefined, {dateStyle: 'full'});
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
let astronomy;
let selectedDay = dateKey(new Date());

function updateSky() {
  const now = new Date();
  const {index, illumination} = lunarSnapshot(astronomy, now);
  byId('moon-now-icon').textContent = phases[index].icon;
  byId('moon-now-phase').textContent = phases[index].name;
  byId('moon-now-details').textContent = Math.round(illumination * 100) + '% illuminated';
  byId('moon-time-zone').textContent = 'Times shown in ' + timeZone.replaceAll('_', ' ') + '.';
  let event = astronomy.SearchMoonQuarter(now);
  const upcoming = [];
  for (let i = 0; i < 4; i++) {
    const phase = phases[event.quarter * 2];
    const row = element('li');
    const time = element('time', phaseTime.format(event.time.date));
    time.dateTime = event.time.date.toISOString();
    row.append(element('strong', phase.icon + ' ' + phase.name), time);
    upcoming.push(row);
    event = astronomy.NextMoonQuarter(event);
  }
  byId('moon-upcoming').replaceChildren(...upcoming);
}

function selectCalendarDate(day) {
  selectedDay = day;
  const time = localNoon(day);
  if (!Number.isFinite(+time) || dateKey(time) !== day) {
    byId('moon-selected').textContent = 'This date was skipped in your device’s time zone.';
    byId('moon-write-date').hidden = true;
  } else {
    const {index, illumination} = lunarSnapshot(astronomy, time);
    byId('moon-selected').textContent =
      dateLabel.format(time) + ' · ' + phases[index].name + ' · ' + Math.round(illumination * 100) + '% illuminated';
    byId('moon-write-date').hidden = false;
  }
  byId('moon-calendar').querySelectorAll('button').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.day === day));
  });
}

function renderCalendar() {
  const month = byId('moon-month');
  if (!/^(19\d{2}|20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month.value)) return;
  const [year, number] = month.value.split('-').map(Number);
  const firstDay = new Date(year, number - 1, 1, 12).getDay();
  const lastDate = new Date(year, number, 0, 12).getDate();
  const nodes = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => element('span', day, 'moon-weekday'));
  for (let i = 0; i < firstDay; i++) nodes.push(element('span'));
  for (let i = 1; i <= lastDate; i++) {
    const day = month.value + '-' + String(i).padStart(2, '0');
    const time = localNoon(day);
    const button = element('button', '', 'moon-day');
    button.type = 'button';
    button.dataset.day = day;
    const phase = phases[lunarSnapshot(astronomy, time).index];
    const disk = element('span', phase.icon);
    disk.setAttribute('aria-hidden', 'true');
    button.append(element('span', String(i)), disk);
    button.setAttribute('aria-label', dateLabel.format(time) + ', ' + phase.name);
    if (day === dateKey(new Date())) button.setAttribute('aria-current', 'date');
    if (dateKey(time) !== day) {
      button.disabled = true;
      button.setAttribute('aria-label', day + ', skipped in this time zone');
    }
    button.addEventListener('click', () => selectCalendarDate(day));
    nodes.push(button);
  }
  byId('moon-calendar').replaceChildren(...nodes);
  selectCalendarDate(selectedDay.startsWith(month.value) ? selectedDay : month.value + '-01');
}

const journal = byId('moon-journal-form');
const journalControls = byId('moon-journal-controls');
const entryDate = byId('moon-entry-date');
const title = byId('moon-entry-title');
const body = byId('moon-entry-body');
const remove = byId('moon-delete-entry');
const journalStatus = byId('moon-journal-status');
const historyStatus = byId('moon-journal-history-status');
const retry = byId('moon-journal-retry');
const older = byId('moon-older');
let entry = null;
let editingDay = selectedDay;
let nextPage = null;
let journalReady = false;

async function journalRequest(path = '', options = {}) {
  const response = await fetch('https://api.ash-fall.com/api/moon-journal' + path, {
    credentials: 'include', cache: 'no-store', ...options
  });
  const data = await response.json().catch(() => ({}));
  if (response.ok && ('entry' in data || 'entries' in data || data.ok)) return data;
  const error = new Error(data.error || 'Moon Journal is unavailable. Try again shortly.');
  error.status = response.status;
  throw error;
}

function journalFailure(error) {
  journalStatus.textContent = error.message;
  if (error.status === 401) byId('moon-sign-in').hidden = false;
}

function setEditingEnabled(enabled) {
  [title, body, journal.querySelector('button[type="submit"]'), remove].forEach(control => {
    control.disabled = !enabled;
  });
}

function setEntry(data) {
  entry = data;
  title.value = entry?.title || '';
  body.value = entry?.body || '';
  remove.hidden = !entry;
  const time = localNoon(editingDay);
  const index = entry?.phase_index ?? (astronomy && dateKey(time) === editingDay ? lunarSnapshot(astronomy, time).index : null);
  const phase = phases[index];
  byId('moon-journal-prompt').textContent = phase ? phase.name + ' · ' + phase.prompt : '';
}

async function openDay(day) {
  if (!journalReady || entryDate.disabled) return;
  if ((title.value !== (entry?.title || '') || body.value !== (entry?.body || '')) &&
      !window.confirm('Discard the unsaved changes to this entry?')) {
    entryDate.value = editingDay;
    return;
  }
  entryDate.value = day;
  if (!entryDate.validity.valid) return;
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
  const history = byId('moon-history');
  if (replace) history.replaceChildren();
  for (const item of entries) {
    const row = element('li');
    const button = element('button', item.title || 'Untitled entry');
    button.type = 'button';
    button.addEventListener('click', () => openDay(item.entry_date));
    row.append(button, element('span', item.entry_date + ' · ' + phases[item.phase_index].name, 'moon-muted'));
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
    await openDay(selectedDay);
  } catch (error) {
    journalFailure(error);
    retry.hidden = error.status === 401;
  }
}

async function changeEntry(deleting = false) {
  const date = localNoon(editingDay);
  if (!deleting && !entry && (!Number.isFinite(+date) || dateKey(date) !== editingDay || date.getHours() !== 12)) {
    journalStatus.textContent = 'Choose a date with a local noon in your device’s time zone.';
    return;
  }
  entryDate.disabled = true;
  setEditingEnabled(false);
  try {
    const payload = {version: entry?.version ?? null};
    if (!deleting) Object.assign(payload, {title: title.value, body: body.value});
    if (!deleting && !entry) Object.assign(payload, {phase_at: date.toISOString(), time_zone: timeZone});
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
  if (window.confirm('Delete this Moon Journal entry?')) changeEntry(true);
});
older.addEventListener('click', () => loadHistory(true).catch(() => {}));
retry.addEventListener('click', () => journalReady ? openDay(editingDay) : startJournal());
byId('moon-write-date').addEventListener('click', () => openDay(selectedDay));
byId('moon-month').addEventListener('change', renderCalendar);

for (const phase of phases) {
  const card = element('article', '', 'moon-phase-card');
  card.append(element('h3', phase.icon + ' ' + phase.name), element('strong', phase.theme), element('p', phase.prompt));
  byId('moon-guide').append(card);
}

byId('moon-month').value = selectedDay.slice(0, 7);
loadAstronomy().then(engine => {
  astronomy = engine;
  updateSky();
  renderCalendar();
  if (!body.value && editingDay === entryDate.value) setEntry(entry);
  setInterval(updateSky, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateSky(); });
}).catch(() => {
  byId('moon-now-phase').textContent = 'Lunar data is temporarily unavailable.';
  byId('moon-selected').textContent = 'Reload to try loading the lunar calendar again.';
});
if (['ash-fall.com', 'www.ash-fall.com'].includes(location.hostname)) startJournal();
else journalStatus.textContent = 'Open Moonology on Ash-Fall to use your journal.';
