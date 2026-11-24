import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

const html=readFileSync(new URL("../public/messages.html",import.meta.url),"utf8");
const css=readFileSync(new URL("../public/messages.css",import.meta.url),"utf8");
const mobileComposer=css.slice(css.lastIndexOf("Keep every composer control visible"));

test("mobile thread composer keeps text entry, attachments, emoji and send controls",()=>{
  assert.match(html,/messages\.css\?v=20261124-original-emojis1/);
  assert.match(html,/<form id="composer" class="composer"/);
  for(const id of ["body","attach-file","cs-emoji-toggle","character-count"])
    assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/id="composer-hint"/);
  assert.match(mobileComposer,/grid-template-areas:"entry entry" "tools actions"/);
  assert.match(mobileComposer,/grid-area:entry/);
  assert.match(mobileComposer,/grid-area:tools/);
  assert.match(mobileComposer,/grid-area:actions/);
  assert.match(mobileComposer,/composer-hint\{display:none\}/);
  assert.match(mobileComposer,/max-height:none;overflow:visible/);
  assert.match(mobileComposer,/max\(\.45rem,env\(safe-area-inset-bottom\)\)/);
});
