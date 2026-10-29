import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const read=name=>readFile(new URL("../public/"+name,import.meta.url),"utf8");
test("section polish loads with and without navigation",async()=>{
 const [theme,nav,css]=await Promise.all([read("theme.css"),read("nav.js"),read("section-overhaul.css")]);
 assert.match(theme,/@import url\("\/section-overhaul\.css\?v=20261029-sections1"\)/);
 assert.match(nav,/data-section-overhaul/);
 for(const root of [".community-directory",".cartridge-shelf",".messages-shell",".admin-shell",".profile-shell",".foundry",".dt-workspace-nav"])assert.ok(css.includes(root),root);
});
test("section overhaul supports small screens, keyboard access and personal themes",async()=>{
 const css=await read("section-overhaul.css");
 assert.match(css,/@media\(max-width:600px\)/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/body:not\(\.profile-custom-theme\) \.profile-shell/);
});
