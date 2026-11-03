import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {Script} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const markup=read("public/profile-edit.html");
const client=read("public/profile-photo-studio.js");
const css=read("public/profile-studio-next.css");
const api=read("backend/src/index.js");
test("Photo Studio loads as an owner-side panel and passes JavaScript syntax",()=>{
 assert.doesNotThrow(()=>new Script(client));
 assert.match(markup,/id="photo-studio"/);
 assert.match(markup,/id="studio-photo-upload"/);
 assert.match(markup,/id="studio-photo-grid"/);
 assert.match(markup,/id="studio-photo-file"/);
 assert.match(markup,/id="studio-photo-refresh"/);
 assert.match(markup,/profile-photo-studio\.js\?v=20261103-photo2/);
 assert.match(markup,/href="#photo-studio"/);
 assert.match(css,/#studio-photo-grid/);
 assert.match(css,/\.studio-photo-card/);
 assert.match(css,/@media\(max-width:580px\)/);
});
test("Gallery upload uses the existing authenticated owner API and validates files",()=>{
 assert.match(client,/credentials:'include'/);
 assert.match(client,/\/api\/profile\/photos\?username=/);
 assert.match(client,/\/api\/profile\/photos',\{method:'POST',body:data\}/);
 assert.match(client,/data\.append\('kind','gallery'\)/);
 assert.match(client,/file\.size>8\*1024\*1024/);
 assert.match(client,/image\/gif/);
 assert.match(client,/items\.length>=60/);
 assert.match(api,/WHERE user_id=\? AND kind='gallery'/);
 assert.match(api,/if \(Number\(photo\.user_id\)!==Number\(user\.id\)\)/);
});
test("Gallery photo can become a profile cover without modifying data before Save",()=>{
 assert.match(client,/profileForm\.elements\.cover_url/);
 assert.match(client,/cover\.dispatchEvent\(new Event\('input',\{bubbles:true\}\)\)/);
 assert.match(client,/Save profile to publish it/);
 const handler=client.slice(client.indexOf("use.addEventListener('click'"),client.indexOf("edit.addEventListener('click'"));
 assert.doesNotMatch(handler,/fetch\(/);
 assert.doesNotMatch(handler,/api\(/);
});
test("Deleting a cover gallery asset clears the corresponding published cover URL",()=>{
 assert.match(api,/if \(photo\.kind==="gallery"\) await env\.DB\.prepare\("UPDATE users SET cover_url=''/);
 assert.match(api,/WHERE id=\? AND cover_url=\?/);
 assert.match(client,/Delete this photo\? It is your selected cover/);
 assert.match(client,/\/api\/profile\/photos\/'\+p\.id/);
 assert.match(client,/if\(active\)\{/);
 assert.doesNotMatch(client,/\.innerHTML\s*=/);
});

test("Photo captions can be edited without uploading new images",()=>{
 assert.match(client,/edit\.addEventListener\('click'/);
 assert.match(client,/studio-photo-caption-edit/);
 assert.match(client,/text\.maxLength=240/);
 assert.match(client,/method:'PATCH'/);
 assert.match(client,/Caption updated without re-uploading/);
 assert.match(api,/profile-photo-caption-edit/);
 assert.match(api,/captionMatch&&request\.method==="PATCH"/);
 assert.match(api,/photo\.kind!=="gallery"/);
 assert.match(api,/Number\(photo\.user_id\)!==Number\(user\.id\)/);
 assert.match(api,/SET caption=\? WHERE id=\? AND user_id=\?/);
 assert.match(css,/\.studio-photo-caption-edit/);
 assert.doesNotMatch(client,/\.innerHTML\s*=/);
});
