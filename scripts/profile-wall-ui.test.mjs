import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";

const file=path=>readFileSync(new URL("../public/"+path,import.meta.url),"utf8");
const ui=file("profile-wall.js"),css=file("profile-wall.css"),html=file("profile.html");
const links=file("profile-links-view.js"),linkCss=file("profile-links.css");
const wallApiSource=readFileSync(new URL("../backend/src/profile-wall.js",import.meta.url),"utf8");
const editor=file("profile-edit.html"),backend=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");

test("member wall scripts parse, load in order and expose a graceful mount",()=>{
 assert.doesNotThrow(()=>new Script(ui,{filename:"profile-wall.js"}));
 assert.match(ui,/window\.KnightfallProfileWall=\{mount\}/);
 assert.ok(html.indexOf("/profile-wall.js?")<html.indexOf("/profile.js?"));
 assert.match(html,/profile-wall\.css\?v=20261111-wall3/);
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
test("member reports are authenticated, text-safe and reach the existing staff queue",()=>{
 assert.match(ui,/if\(signedIn&&!own\)/);
 assert.match(ui,/\/api\/social\/report/);
 assert.match(ui,/object_type:"activity"/);
 assert.match(ui,/reported_user_id:Number\(post\.user_id\)/);
 assert.match(ui,/if\(reportForm\)article\.append\(reportForm\)/);
 assert.doesNotMatch(ui,/\.innerHTML\s*=/);
 assert.match(css,/\.profile-wall-report-form\[hidden\]/);
 assert.ok(backend.includes('if(url.pathname==="/api/social/report"&&request.method==="POST")'));
});
test("signed-in members can bookmark posts and review a private saved shelf",()=>{
 assert.match(ui,/\/api\/profile-wall\/saved/);
 assert.match(ui,/\/bookmark/);
 assert.match(ui,/is_saved/);
 assert.match(ui,/savedSection\.id="profile-saved"/);
 assert.match(ui,/function loadSaved\(\)/);
 assert.match(ui,/node\.textContent=String\(content\)/);
 assert.match(file("profile.js"),/\["#profile-saved","Saved"\]/);
 assert.match(html,/profile-wall\.js\?v=20261111-wall3/);
 assert.match(css,/#profile \.profile-wall-saved/);
});
test("notification deep links load the exact post without bypassing server privacy",()=>{
 assert.match(ui,/article\.id="profile-wall-post-"\+post\.id/);
 assert.match(ui,/\/api\/profile-wall\/posts\/"/);
 assert.match(ui,/profile-wall-post-target/);
 assert.match(css,/\.profile-wall-post-target/);
 assert.match(wallApiSource,/if\(!part&&request\.method==="GET"\)/);
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
