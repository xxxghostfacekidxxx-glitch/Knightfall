import test from 'node:test';
import assert from 'node:assert/strict';
import { chaosReplyGuidance } from './chaos-voice.mjs';

test('ordinary conversation stays brief without clipping the reply', () => {
  for (const message of ['hey', 'rough day', 'what do you think of this lyric?', 'can you help debug my code?']) {
    assert.match(chaosReplyGuidance(message), /one to three short sentences/);
    assert.match(chaosReplyGuidance(message), /complete the actual task/);
  }
});
test('explicit depth requests allow complete explanations and code', () => {
  for (const message of ['Explain this in detail', 'Give me complete code', 'Walk me through it step-by-step']) {
    assert.match(chaosReplyGuidance(message), /user requested detail/);
  }
});
test('later explicit length corrections take precedence', () => {
  assert.match(chaosReplyGuidance('Explain in detail. Actually, keep it short.'), /explicitly wants brevity/);
  assert.match(chaosReplyGuidance('Short answer? Actually give a full explanation.'), /user requested detail/);
  assert.match(chaosReplyGuidance('Answer in one sentence'), /honor a one-sentence request/);
});
