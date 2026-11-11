import { phases, lunarSnapshot } from './lunar-phases.mjs';
import { loadAstronomy } from './moon-widget.mjs';
import { localDateKey as dateKey, mountDateJournal } from './date-journal.mjs';

const byId = id => document.getElementById(id);
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  if (className) node.className = className;
  return node;
}
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

const journal = mountDateJournal({
  prefix: 'moon',
  name: 'Moon Journal',
  initialDay: selectedDay,
  onEntry(entry, day) {
    const time = localNoon(day);
    const index = entry?.phase_index ?? (astronomy && dateKey(time) === day ? lunarSnapshot(astronomy, time).index : null);
    const phase = phases[index];
    byId('moon-journal-prompt').textContent = phase ? phase.name + ' · ' + phase.prompt : '';
  },
  historyLabel: item => phases[item.phase_index]?.name,
  writeFields(entry, day) {
    if (entry) return {};
    const date = localNoon(day);
    if (!Number.isFinite(+date) || dateKey(date) !== day || date.getHours() !== 12) {
      throw new Error('Choose a date with a local noon in your device’s time zone.');
    }
    return {phase_at: date.toISOString(), time_zone: timeZone};
  }
});
byId('moon-write-date').addEventListener('click', () => journal.openDay(selectedDay));
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
  journal.refreshPrompt();
  setInterval(updateSky, 60_000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) updateSky(); });
}).catch(() => {
  byId('moon-now-phase').textContent = 'Lunar data is temporarily unavailable.';
  byId('moon-selected').textContent = 'Reload to try loading the lunar calendar again.';
});
