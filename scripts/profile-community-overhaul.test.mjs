import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const read=path=>readFileSync(new URL("../public/"+path,import.meta.url),"utf8");
const page=read("profile.html"),profile=read("profile.js"),css=read("profile-community-overhaul.css");
const mascots=read("profile-mascots.js");

test("the profile scripts parse and keep identity context server-owned",()=>{
  assert.doesNotThrow(()=>new Script(profile,{filename:"profile.js"}));
  assert.doesNotThrow(()=>new Script(mascots,{filename:"profile-mascots.js"}));
  assert.match(profile,/const ownProfile=!!me\.user&&String\(me\.user\.id\)===String\(d\.user\.id\)/);
  assert.match(profile,/if\(primaryError\.status===401\|\|primaryError\.status===403\|\|primaryError\.status===404\)throw primaryError/);
  assert.match(profile,/if\s*\(u\.show_activity\s*===\s*0\)\s*root\.querySelector\("\.activity-grid"\)\?\.remove\(\)/);
});
test("context-aware owner and visitor navigation replaces static misleading links",()=>{
  assert.match(page,/id="profile-quick-links"/);
  assert.doesNotMatch(page,/My Mascot Sanctuary/);
  assert.match(profile,/function renderProfileQuickLinks\(member,ownProfile,adminView\)/);
  assert.match(profile,/nav\.replaceChildren\(\)/);
  assert.match(profile,/ownProfile\s*\?/);
  assert.match(profile,/adminView/);
  assert.match(profile,/\/mascot-room\.html\?user=/);
  assert.match(profile,/\^\[a-zA-Z0-9_-\]\{1,32\}\$/);
  assert.match(profile,/nav\.hidden=false/);
});
test("profile view presents About and searchable section anchors",()=>{
  assert.match(profile,/about\.id="profile-about"/);
  assert.match(profile,/about\.append\(biography\)/);
  assert.match(profile,/if\(details\)about\.append\(details\)/);
  assert.match(profile,/about\.after\(walletPanel\)/);
  assert.match(profile,/\["#profile-about","About"\]/);
  assert.match(profile,/\["#mascot-profile-companions","Pets"\]/);
  assert.match(profile,/function connectProfileJump\(jump\)/);
  assert.match(profile,/aria-current","location"/);
  assert.match(profile,/profileJumpObserver\?\.disconnect\(\)/);
  assert.match(mascots,/kf:profile-section-mounted/);
});
test("activity filter and sharing controls remain keyboard and mobile usable",()=>{
  assert.match(profile,/function upgradeProfileActivity\(\)/);
  assert.match(profile,/\["all","All"\]/);
  assert.match(profile,/\["threads","Threads"\]/);
  assert.match(profile,/\["replies","Replies"\]/);
  assert.match(profile,/aria-pressed/);
  assert.match(profile,/navigator\.share/);
  assert.match(profile,/navigator\.clipboard\?\.writeText/);
  assert.match(page,/profile-community-overhaul\.css\?v=20261111-profile6/);
  assert.match(page,/src="\/profile\.js\?v=[^"]+"/);
  assert.match(css,/@media\(max-width:620px\)/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/profile-activity-deck\[data-view="threads"\]/);
  assert.match(css,/profile-share-status/);
});
test("per-member appearance survives site-wide generic card rules",()=>{
  assert.match(css,/body #profile\.card\{/);
  for(const token of ["--pf-spot","--pf-spot-alt","--pf-surface","--pf-surface-deep","--profile-accent"]){
    assert.ok(css.includes(token),"Missing custom profile token "+token);
  }
  assert.match(css,/linear-gradient\(90deg,var\(--profile-accent/);
  assert.match(css,/#ffe36b/);
  assert.doesNotMatch(css,/\b(?:localStorage|sessionStorage)\b/);
  assert.doesNotMatch(css,/canvas\s*\{/);
  let n=0;
  for(const character of css){
    if(character==="{")n++;
    if(character==="}")n--;
    assert.ok(n>=0,"Unbalanced CSS");
  }
  assert.equal(n,0,"Unbalanced CSS");
});
