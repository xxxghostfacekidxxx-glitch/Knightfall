import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {runInNewContext,Script} from "node:vm";
const read=path=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
function load(){
 const window={};
 const context={window,Intl,Date,Number,Math,console};
 runInNewContext(read("public/vendor/tz-lookup.js"),context);
 window.tzlookup=context.tzlookup;
 runInNewContext(read("public/cosmic-place-timezone.js"),context);
 return {window,context};
}
test("self-hosted CC0 lookup yields documented zones for populated locations",()=>{
 const {window}=load();
 const geo=window.KnightfallGeoTimezone;
 assert.equal(geo.suggest(41.5868,-93.6250),"America/Chicago");
 assert.equal(geo.suggest(51.5074,-0.1278),"Europe/London");
 assert.equal(geo.suggest(35.6762,139.6503),"Asia/Tokyo");
 assert.equal(geo.suggest(27.7172,85.3240),"Asia/Kathmandu");
 assert.throws(()=>geo.suggest(91,0),/Unsupported/);
 assert.throws(()=>geo.suggest(41.58,200),/Unsupported/);
});
test("birth city sets a zone suggestion while preserving manual edits",()=>{
 const {window}=load(),api=window.KnightfallGeoTimezone;
 const input={value:"",dataset:{}};
 const first=api.setSuggestion(input,41.5868,-93.625);
 assert.equal(first.applied,true);
 assert.equal(input.value,"America/Chicago");
 assert.match(first.message,/Verify/);
 const second=api.setSuggestion(input,40.7128,-74.0060);
 assert.equal(second.applied,true);
 assert.equal(input.value,"America/New_York");
 input.value="America/Denver";
 const third=api.setSuggestion(input,41.5868,-93.625);
 assert.equal(third.applied,false);
 assert.equal(input.value,"America/Denver");
 assert.match(third.message,/preserved/);
 api.clearAuto(input);
 assert.equal(input.value,"America/Denver");
 assert.ok(!("autoTimezone" in input.dataset));
});
test("automatically filled zones clear when location changes, but manual zones stay",()=>{
 const {window}=load(),api=window.KnightfallGeoTimezone;
 const a={value:"",dataset:{}};
 api.setSuggestion(a,41.5868,-93.625);
 api.clearAuto(a);assert.equal(a.value,"");
 const b={value:"America/Phoenix",dataset:{}};
 api.clearAuto(b);assert.equal(b.value,"America/Phoenix");
});
test("library and app scripts are standalone, no remote timezone API or account data",()=>{
 const js=read("public/cosmic-place-timezone.js");
 assert.doesNotThrow(()=>new Script(js));
 assert.doesNotThrow(()=>new Script(read("public/vendor/tz-lookup.js")));
 assert.doesNotMatch(js,/fetch\s*\(|axios|XMLHttpRequest/);
 const editor=read("public/profile-edit.html"),chaos=read("public/miss-chaos.html"),chat=read("public/miss-chaos.js");
 for(const html of [editor,chaos]){
  assert.match(html,/vendor\/tz-lookup\.js/);
  assert.match(html,/cosmic-place-timezone\.js/);
  assert.match(html,/time-zone-status|timezone-status/);
 }
 assert.match(editor,/KnightfallGeoTimezone\?\.setSuggestion/);
 assert.match(chat,/KnightfallGeoTimezone\?\.setSuggestion/);
});
