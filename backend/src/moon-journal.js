import * as Astronomy from 'astronomy-engine';
import { phaseIndex } from '../../public/lunar-phases.mjs';

import { handleDateJournal } from './date-journal.js';

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

const moonJournal = {
  name: 'Moon Journal',
  table: 'moon_journal',
  bucket: 'moon-journal-write',
  metadata: ['phase_index', 'phase_at', 'time_zone'],
  readMetadata(data, day) {
    const time = phaseTime(data.phase_at, data.time_zone, day);
    if (!time) return 'Could not match local noon to this journal date.';
    return [phaseIndex(Astronomy.MoonPhase(time)), time.toISOString(), data.time_zone];
  }
};

export function handleMoonJournal(request, env, url, context) {
  return handleDateJournal(request, env, url, context, moonJournal);
}
