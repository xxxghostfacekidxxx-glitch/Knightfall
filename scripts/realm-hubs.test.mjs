import test from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import vm from "node:vm";

const read=name=>readFileSync(new URL("../public/"+name,import.meta.url),"utf8");
const hubs=["celestial-sanctum.html","music.html","chatbots.html"];
const nav=read("nav.js"),home=read("index.html"),styles=read("realm-hubs.css"),shell=read("sw.js");

test("three independent section hubs are navigable, indexed and available to the PWA",()=>{
 for(const name of hubs){
  assert.ok(existsSync(new URL("../public/"+name,import.meta.url)),name);
  const html=read(name);
  assert.match(html,/<main\b/);
  assert.equal([...html.matchAll(/<h1\b/gi)].length,1,"One top-level heading: "+name);
  assert.match(html,/href="\/theme\.css"/);
  assert.match(html,/href="\/realm-hubs\.css\?v=/);
  assert.match(html,/src="\/nav\.js"/);
  assert.ok(nav.includes('href="/'+name+'"'),"Main menu missing "+name);
  assert.ok(home.includes('href="/'+name+'"'),"Homepage missing "+name);
  assert.ok(shell.includes('"/'+name+'"'),"PWA shell missing "+name);
  const hrefs=[...html.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map(x=>x[1]);
  for(const href of hrefs){
   if(href.startsWith("#")){
    assert.ok(html.includes('id="'+href.slice(1)+'"'),name+" unresolved local jump "+href);
   }else if(href.startsWith("/")&&!href.startsWith("//")){
    const dest=href.split(/[?#]/)[0].slice(1);
    assert.ok(existsSync(new URL("../public/"+dest,import.meta.url)),name+" broken link "+href);
   }
  }
  const staticLinks=hrefs.filter(x=>x.startsWith("/"));
  assert.equal(staticLinks.length,new Set(staticLinks).size,name+" repeats a destination link");
 }
 assert.ok(shell.includes('"/realm-hubs.css"'));
 assert.ok(shell.includes('"/music-rhythm-lab.js"'));
});

test("celestial, music and chatbot hubs reuse the correct existing tools",()=>{
 const celestial=read("celestial-sanctum.html");
 for(const route of ["/moonology.html","/shadow-work.html","/profile-edit.html#birth-chart-studio","/community.html"])
  assert.ok(celestial.includes('href="'+route+'"'),"Missing actual celestial tool "+route);
 assert.match(celestial,/symbolic traditions and personal reflection/);
 const music=read("music.html");
 assert.match(music,/href="\/bots\.html\?category=Music"/);
 assert.match(music,/id="kf-rhythm-speed"/);
 assert.match(music,/id="kf-rhythm-toggle"/);
 assert.match(read("bots.js"),/const initialCategory=categoryOptions\.includes\(categoryParam\)/);
 const bots=read("chatbots.html");
 for(const route of ["/bots.html","/personal-bots.html","/miss-chaos.html","/devil-tools.html"])
  assert.ok(bots.includes('href="'+route+'"'),"Missing actual AI tool "+route);
 assert.match(bots,/permission-gated/);
});

test("realm hubs inherit current theme tokens without a new forced CSS war",()=>{
 assert.doesNotMatch(styles,/!important\b/);
 assert.match(styles,/--kf-realm-metal/);
 assert.match(styles,/--kf-realm-glow/);
 assert.match(styles,/body\.kf-hub-page/);
 assert.doesNotMatch(styles,/\bcanvas\s*\{/);
 assert.doesNotMatch(styles,/\.profile-custom-theme\s*\{/);
 assert.match(styles,/@media\(max-width:760px\)/);
 assert.match(styles, /prefers-reduced-motion:reduce/);
 assert.ok(nav.includes('celestial-sanctum'));
 assert.ok(nav.includes('realm = "music"'));
 assert.ok(nav.includes('chatbots'));
 assert.ok(nav.includes('if (document.body.classList.contains("kf-hub-page")) return;'),"New hubs must not get the old global artwork overlays");
 new vm.Script(read("music-rhythm-lab.js"),{filename:"music-rhythm-lab.js"});
 new vm.Script(nav,{filename:"nav.js"});
});

test("music metronome is click-activated, generates its own audio, and stops when hidden",async()=>{
 const listeners=new Map();
 const element=(initial="")=>({
  value:initial,textContent:"",attributes:{},listeners:{},
  addEventListener(type,fn){this.listeners[type]=fn},
  setAttribute(k,v){this.attributes[k]=v}
 });
 const elements=new Map([
  ["kf-rhythm-speed",element("120")],
  ["kf-rhythm-bpm",element()],
  ["kf-rhythm-toggle",element()],
  ["kf-rhythm-tap",element()],
  ["kf-rhythm-reset",element()],
  ["kf-rhythm-status",element()]
 ]);
 let audioInstances=0,played=0,timerCalls=0,cleared=0,clock=0;
 class FakeAudio{
  constructor(){audioInstances++;this.state="suspended";this.currentTime=0;this.destination={}}
  async resume(){this.state="running"}
  createOscillator(){return{frequency:{setValueAtTime(){}},connect(){},start(){played++},stop(){}}}
  createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}}}
  close(){return Promise.resolve()}
 }
 const doc={hidden:false,getElementById:id=>elements.get(id),addEventListener:(k,fn)=>listeners.set(k,fn)};
 const win={AudioContext:FakeAudio,addEventListener:(k,fn)=>listeners.set(k,fn)};
 vm.runInNewContext(read("music-rhythm-lab.js"),{
  window:win,document:doc,performance:{now:()=>clock},
  setInterval(){timerCalls++;return 23},
  clearInterval(){cleared++},console
 });
 const get=id=>elements.get(id);
 assert.equal(audioInstances,0,"Audio must never autoplay on page entry");
 assert.equal(get("kf-rhythm-bpm").textContent,"120");
 get("kf-rhythm-speed").value="150";
 get("kf-rhythm-speed").listeners.input();
 assert.equal(get("kf-rhythm-bpm").textContent,"150");
 await get("kf-rhythm-toggle").listeners.click();
 assert.equal(audioInstances,1);
 assert.ok(played>=1,"A generated beat must be scheduled after explicit click");
 assert.equal(get("kf-rhythm-toggle").attributes["aria-pressed"],"true");
 assert.equal(timerCalls,1);
 doc.hidden=true;listeners.get("visibilitychange")();
 assert.equal(get("kf-rhythm-toggle").attributes["aria-pressed"],"false");
 assert.equal(cleared,1,"Backgrounded page cannot keep producing beats");
 clock=1000;get("kf-rhythm-tap").listeners.click();
 clock=1500;get("kf-rhythm-tap").listeners.click();
 clock=2000;get("kf-rhythm-tap").listeners.click();
 assert.equal(get("kf-rhythm-bpm").textContent,"120");
 get("kf-rhythm-reset").listeners.click();
 assert.equal(get("kf-rhythm-speed").value,"120");
});
