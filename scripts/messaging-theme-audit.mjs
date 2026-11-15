// Guard the messages page against the retired orange/brown theme returning.
// No browser or private API credentials are needed for this static CSS check.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../public/messages.css", import.meta.url), "utf8");
const html = readFileSync(new URL("../public/messages.html", import.meta.url), "utf8");

const colors = [...css.matchAll(/#[0-9a-fA-F]{6}\b/g)].map(match => match[0]);
const retired = /#(?:ff55d8|ff45b5|ba36c1|c6ff45|e8b5f5)\\b|rgba\\(\\s*255\\s*,\\s*85\\s*,\\s*216\\s*,/i;
assert.doesNotMatch(css,retired,"Retired neon colors must not return to messaging");
assert.match(css,/#b25b68/i,"Approved muted crimson must appear in messaging");
assert.match(css,/#c7a77c/i,"Approved antique bronze must appear in messaging");

for (const selector of [
  ".message-layout", ".conversation-panel", ".conversation.active",
  ".chat-panel", ".message.mine", ".message.theirs", ".composer",
  ".compose-dialog", ".reaction-add", ".conversation-restricted"
]) {
  assert.ok(css.includes(selector), `Missing messaging surface ${selector}`);
}
assert.doesNotMatch(css, /#ff55d8/i, "Retired neon pink must not be the messaging accent");
assert.match(css, /var\(--kf-accent-bright\)/, "Acid green highlight must remain in messaging");
// Keep fresh versioned assets without pinning the audit to a month-old build.
assert.match(html, /\/messages\.css\?v=\d{8}-[a-z0-9-]+/i, "Inbox CSS must use a dated cache key");
assert.doesNotMatch(html, /20261027-keyboard-layout/, "Old cached messages stylesheet is still referenced");


// The older-history recovery cursor must advance past duplicate pages. Without
// this guard the same 'before' value is reused forever when all IDs already exist.
assert.match(html, /Math\.min\(\.\.\.renderedIds,Number\.isSafeInteger\(Number\(oldestId\)\)/, "Recovered message history cursor must be reused");
assert.match(css, /grid-template-rows:auto auto auto minmax\(0,1fr\) auto auto/, "Chat grid must reserve a dedicated flexible history track");
for(const slot of ["chat-head","typing-indicator","load-older","messages","conversation-restricted","composer"]){
 assert.ok(css.includes(".chat-panel>#"+slot+"{grid-row:"), "Missing dedicated chat grid slot: "+slot);
}

console.log(`Messaging theme audit passed: ${colors.length} CSS colors checked, no orange/brown palette.`);
