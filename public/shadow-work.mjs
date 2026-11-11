import { localDateKey, mountDateJournal } from './date-journal.mjs';
import { shadowPrompts } from './shadow-prompts.mjs';

const byId = id => document.getElementById(id);
const selector = byId('shadow-entry-prompt');
const display = byId('shadow-journal-prompt');
const prompts = new Map(shadowPrompts.map(prompt => [prompt.id, prompt]));

function showPrompt() {
  display.textContent = prompts.get(selector.value)?.question || '';
}

for (const {id, name, cue, question} of shadowPrompts) {
  selector.add(new Option(name, id));
  const card = document.createElement('article');
  card.className = 'moon-phase-card';
  const heading = document.createElement('h3');
  heading.textContent = name;
  const intro = document.createElement('p');
  intro.className = 'moon-muted';
  intro.textContent = cue;
  const text = document.createElement('p');
  text.textContent = question;
  const use = document.createElement('a');
  use.href = '#journal';
  use.textContent = 'Write with this prompt';
  use.setAttribute('aria-label', 'Write with the ' + name.toLowerCase() + ' prompt');
  use.addEventListener('click', () => {
    if (!selector.disabled && !byId('shadow-journal-controls').hidden) {
      selector.value = id;
      showPrompt();
    }
  });
  card.append(heading, intro, text, use);
  byId('shadow-prompts').append(card);
}

selector.addEventListener('change', showPrompt);
mountDateJournal({
  prefix: 'shadow',
  name: 'Shadow Journal',
  initialDay: localDateKey(new Date()),
  extraControls: [selector],
  extraDirty: entry => selector.value !== (entry?.prompt_key || ''),
  onEntry(entry) {
    selector.value = prompts.has(entry?.prompt_key) ? entry.prompt_key : '';
    showPrompt();
  },
  historyLabel: item => prompts.get(item.prompt_key)?.name,
  writeFields: () => ({prompt_key: selector.value || null})
});
