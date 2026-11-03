// Guard the messages page against the retired orange/brown theme returning.
// No browser or private API credentials are needed for this static CSS check.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../public/messages.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/messages.html", import.meta.url), "utf8");

const colors = [...css.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(match => match[0]);
const warm = colors.filter(hex => {
  const [r, g, b] = [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16));
  // Detect the old red > green > blue browns without rejecting pink/purple or lime.
  return r >= g && g >= b && r - b >= 1;
});
assert.deepEqual([...new Set(warm)], [], "Messages CSS restored warm/orange hex values");

for (const selector of [
  ".message-layout", ".conversation-panel", ".conversation.active",
  ".chat-panel", ".message.mine", ".message.theirs", ".composer",
  ".compose-dialog", ".reaction-add", ".conversation-restricted"
]) {
  assert.ok(css.includes(selector), `Missing messaging surface ${selector}`);
}
assert.match(css, /#ff55d8/i, "Neon pink must remain the messaging accent");
assert.match(css, /var\(--kf-accent-bright\)/, "Acid green highlight must remain in messaging");
assert.match(html, /\/messages\.css\?v=20261103-gravewave-inbox2/, "Inbox CSS cache key is stale");
assert.doesNotMatch(html, /20261027-keyboard-layout/, "Old cached messages stylesheet is still referenced");

console.log(`Messaging theme audit passed: ${colors.length} CSS colors checked, no orange/brown palette.`);
