import { shadowPrompts } from '../../public/shadow-prompts.mjs';
import { handleDateJournal } from './date-journal.js';

const prompts = new Set(shadowPrompts.map(({id}) => id));
const shadowJournal = {
  name: 'Shadow Journal',
  table: 'shadow_journal',
  bucket: 'shadow-journal-write',
  metadata: ['prompt_key'],
  updateMetadata: true,
  readMetadata(data) {
    return data.prompt_key === null || prompts.has(data.prompt_key) ? [data.prompt_key] : 'Choose a listed reflection prompt or write freely.';
  }
};

export function handleShadowJournal(request, env, url, context) {
  return handleDateJournal(request, env, url, context, shadowJournal);
}
