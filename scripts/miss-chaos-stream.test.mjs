import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const api=readFileSync(new URL("../backend/src/index.js",import.meta.url),"utf8");
const ui=readFileSync(new URL("../public/miss-chaos.js",import.meta.url),"utf8");
const html=readFileSync(new URL("../public/miss-chaos.html",import.meta.url),"utf8");
test("streaming uses authenticated chat endpoint and persists after completion",()=>{
 assert.match(api,/if\(body\.stream===true\)/);
 assert.match(api,/stream:true/);
 assert.match(api,/text\/event-stream/);
 assert.match(api,/send\("done",\{conversation_id:conversationId,mood\}\)/);
 const stream=api.slice(api.indexOf("if(body.stream===true)"),api.indexOf("    let reply=\"\";",api.indexOf("if(body.stream===true)")));
 assert.ok(stream.indexOf('await env.DB.batch(')>stream.indexOf('if(!reply.trim())'));
});
test("client consumes deltas, requires done, and safely falls back when stream cannot start",()=>{
 assert.match(ui,/streamChaosReply\(/);
 assert.match(ui,/type==="delta"/);
 assert.match(ui,/if\(!done\)throw Error/);
 assert.match(ui,/Streaming is temporarily unavailable/);
 assert.match(ui,/streamedArticle\.remove\(\)/);
});
test("dictation has stop control and memory search is private client-side filtering",()=>{
 assert.match(ui,/if\(activeRecognition\)\{activeRecognition.stop\(\);return;\}/);
 assert.match(ui,/recognition.interimResults = true/);
 assert.match(html,/id="memory-search"/);
 assert.match(ui,/filteredMemories=search\?memories.filter/);
});

test("copy and voice playback always use current streamed message content",()=>{
 assert.match(ui,/clipboard\.writeText\(text\.textContent\)/);
 assert.match(ui,/new SpeechSynthesisUtterance\(text\.textContent\)/);
 assert.match(ui,/else streamedArticle\.querySelector\("\.message-content"\)\.textContent=result\.reply/);
});
test("dictation rebuilds from complete recognition results rather than duplicating partial text",()=>{
 assert.match(ui,/for\(let i=0;i<event\.results\.length;i\+\+\)/);
 assert.doesNotMatch(ui,/finalText\+=text\+" ";[\s\S]{0,300}for\(let i=event\.resultIndex/);
});
