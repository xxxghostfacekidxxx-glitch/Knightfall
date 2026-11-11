import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const read=(path)=>readFileSync(new URL("../public/"+path,import.meta.url),"utf8");
const js=read("profile-highlights.js"),css=read("profile-highlights.css"),profile=read("profile.js"),html=read("profile.html");
const wall=read("profile-wall.js");
const backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const wallApi=readFileSync(new URL("../backend/src/profile-wall.js",import.meta.url),"utf8");

test("showcase code parses, loads before profile and has no unsafe HTML injection",()=>{
 assert.doesNotThrow(()=>new Script(js));
 assert.ok(html.indexOf("/profile-highlights.js?")<html.indexOf("/profile.js?"));
 assert.match(profile,/KnightfallProfileHighlights\?\.mount/);
 assert.match(profile,/#profile-featured/);
 assert.match(profile,/#profile-achievements/);
 assert.match(html,/profile-highlights\.css\?v=20261111-highlights1/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.doesNotMatch(js,/localStorage|sessionStorage/);
});
test("owner-only gallery editor selects at most three owned uploads",()=>{
 assert.match(js,/if\(own\)/);
 assert.match(js,/selected\.length<3/);
 assert.match(js,/photo_ids:selected/);
 assert.match(js,/\/api\/profile\/photos\?username=/);
 assert.match(js,/method:"PUT"/);
 assert.match(js,/aria-pressed/);
 assert.match(profile,/KnightfallProfileHighlights\?\.refresh/);
});
test("earned achievements display server-verified progress and hide visitor locks",()=>{
 assert.match(js,/data\.achievements/);
 assert.match(js,/data\.earned_total/);
 assert.match(js,/badge\.earned/);
 assert.match(css,/#profile \.profile-achievement\.is-earned/);
 assert.match(css,/#profile \.profile-achievement\.is-locked/);
});
test("mobile and reduced motion presentation stays in profile theme",()=>{
 assert.match(css,/var\(--profile-accent/);
 assert.match(css,/@media\(max-width:580px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
});
test("reactions and replies create real member notifications using push preferences",()=>{
 assert.match(wallApi,/helpers\.createNotification/);
 assert.match(wallApi,/kind:"reaction"/);
 assert.match(wallApi,/kind:"reply"/);
 assert.match(wallApi,/alreadyNotified/);
 assert.match(wallApi,/post\.user_id!==viewer\.id/);
 assert.match(backend,/handleProfileWall\(request,env,url,\{[^}]*createNotification\}\)/);
 assert.match(backend,/\["reply","reaction","mention"/);
 assert.match(wall,/\/api\/profile-wall\/posts\//);
});
