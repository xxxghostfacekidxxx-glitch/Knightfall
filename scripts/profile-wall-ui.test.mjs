import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const file=path=>readFileSync(new URL("../public/"+path,import.meta.url),"utf8");
const ui=file("profile-wall.js"),css=file("profile-wall.css"),html=file("profile.html");
const links=file("profile-links-view.js"),linkCss=file("profile-links.css");
const editor=file("profile-edit.html"),backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");

test("member wall scripts parse, load in order and expose a graceful mount",()=>{
 assert.doesNotThrow(()=>new Script(ui,{filename:"profile-wall.js"}));
 assert.match(ui,/window\.KnightfallProfileWall=\{mount\}/);
 assert.ok(html.indexOf("/profile-wall.js?")<html.indexOf("/profile.js?"));
 assert.match(html,/profile-wall\.css\?v=20261111-wall1/);
 assert.match(file("profile.js"),/if\(window\.KnightfallProfileWall\?\.mount\)/);
});
test("real reactions and comments use authenticated API and text-safe rendering",()=>{
 for(const key of ["fire","heart","skull"])assert.ok(ui.includes('"'+key+'"'));
 for(const path of ["/api/profile-wall?","/api/profile-wall/posts/","/api/profile-wall/comments/","/api/social/activity"])
  assert.ok(ui.includes(path),"Expected API path "+path);
 assert.match(ui,/credentials:"include"/);
 assert.match(ui,/\.setAttribute\("aria-pressed"/);
 assert.match(ui,/viewerId=data\.viewer_id/);
 assert.match(ui,/node\.textContent=String\(content\)/);
 assert.doesNotMatch(ui,/\.innerHTML\s*=/,"Wall never injects user content as markup");
 assert.doesNotMatch(ui,/localStorage|sessionStorage/);
 assert.match(ui,/window\.confirm\("Delete this update/);
});
test("profile-wall mobile and reduced-motion styles stay within member theme",()=>{
 assert.match(css,/#profile \.profile-wall/);
 assert.match(css,/var\(--profile-accent/);
 assert.match(css,/#ffe36b/);
 assert.match(css,/@media\(max-width:660px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 const balance=(css.match(/\{/g)||[]).length-(css.match(/\}/g)||[]).length;
 assert.equal(balance,0);
});
test("first saved HTTPS link is intentionally featured, not an invented creation",()=>{
 assert.doesNotThrow(()=>new Script(links,{filename:"profile-links-view.js"}));
 assert.match(links,/links\.entries\(\)/);
 assert.match(links,/index===0\?"profile-link-card profile-link-featured"/);
 assert.match(links,/profile-link-feature-label/);
 assert.match(links,/u\.protocol==="https:"/);
 assert.match(linkCss,/profile-link-card\.profile-link-featured/);
 assert.match(editor,/Your first link becomes your featured link/);
});
test("legacy activity stream honors private profiles, friendship and blocks",()=>{
 const start=backend.indexOf('if(url.pathname==="/api/social/activity"');
 assert.ok(start>0);
 const section=backend.slice(start,start+2700);
 assert.match(section,/u\.profile_visibility='public'/);
 assert.match(section,/u\.profile_visibility='friends'/);
 assert.match(section,/u\.profile_visibility='private'/);
 assert.match(section,/friend_requests fr/);
 assert.match(section,/NOT EXISTS \(SELECT 1 FROM user_blocks/);
 assert.match(section,/isModerator\(viewer\)/);
});
