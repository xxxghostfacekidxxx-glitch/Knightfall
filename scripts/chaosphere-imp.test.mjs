import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../public/chaosphere-imp.js",import.meta.url),"utf8");

function harness({muted=false,hidden=false}={}){
 const listeners=new Map(),stored=new Map();
 if(muted)stored.set("kf-chaosphere-imp-reactions-7","off");
 const classes=new Set(),timers=new Map();
 let clock=0;
 const makeElement=()=>({
   hidden:true,textContent:"",title:"",dataset:{},attrs:{},handlers:{},
   classList:{add(value){classes.add(value);},remove(value){classes.delete(value);},
     toggle(value,on){if(on)classes.add(value);else classes.delete(value);},
     contains(value){return classes.has(value);}},
   setAttribute(k,v){this.attrs[k]=v;},
   addEventListener(k,fn){this.handlers[k]=fn;},
   click(){this.handlers.click?.();},
   get offsetWidth(){return 16;}
 });
 const button=makeElement(),speech=makeElement(),inline=makeElement();
 const root={dataset:{},classList:button.classList,
   querySelector(s){return {"#kf-imp-quiet":button,"#kf-imp-speech":speech,"#kf-imp-inline":inline}[s]||null;}};
 const heroButton=makeElement(),heroSpeech=makeElement();
 const win={ChaosphereImp:null,events:[],addEventListener(k,fn){listeners.set(k,fn);},
   dispatchEvent(e){this.events.push(e.type);listeners.get(e.type)?.(e);}};
 const document={readyState:"loading",hidden,
   getElementById(id){return id==="cs-hero-imp"?heroButton:id==="cs-hero-imp-speech"?heroSpeech:null;},
   addEventListener(k,fn){listeners.set(k,fn);}};
 const context={window:win,document,localStorage:{
   getItem(k){return stored.get(k)||null;},
   setItem(k,v){stored.set(k,v);}
 },setTimeout(fn,ms){const id=++clock;timers.set(id,{fn,ms});return id;},
 clearTimeout(id){timers.delete(id);},Event:class Event{constructor(type){this.type=type;}}};
 vm.runInNewContext(source,context,{timeout:1000});
 return {api:win.ChaosphereImp,win,root,button,speech,inline,stored,classes,
    heroButton,heroSpeech,document,listeners,timers,
    flush(){const scheduled=[...timers.values()];timers.clear();for(const entry of scheduled)entry.fn();}};
}
test("detects only increased unread counts after a baseline",()=>{
 const {api}=harness();
 assert.equal(api.newUnread([{id:1,unread_count:2}],[{id:1,unread_count:3}]),true);
 assert.equal(api.newUnread([{id:1,unread_count:2}],[{id:1,unread_count:2}]),false);
 assert.equal(api.newUnread([{id:1,unread_count:2}],[{id:1,unread_count:0}]),false);
 assert.equal(api.newUnread([{id:1,unread_count:2}],[{id:2,unread_count:1}]),true);
 assert.equal(api.newUnread([],[]),false);
 assert.equal(api.newUnread(null,[{id:1,unread_count:1}]),false);
 assert.equal(api.newUnread([{id:1,unread_count:9}],[{id:-1,unread_count:999}]),false);
});
test("quiet preference is per-account, retained, and never hides unread badges",()=>{
 const h=harness({muted:true});
 const imp=h.api.mount(h.root,7);
 assert.equal(imp.isEnabled(),false);
 assert.equal(h.button.attrs["aria-pressed"],"false");
 assert.equal(imp.react("incoming"),false);
 assert.equal(h.speech.hidden,true);
 h.button.click();
 assert.equal(imp.isEnabled(),true);
 assert.equal(h.stored.get("kf-chaosphere-imp-reactions-7"),"on");
 assert.equal(h.button.attrs["aria-pressed"],"true");
 assert.equal(h.root.dataset.kfImpMood,"wake");
 h.button.click();
 assert.equal(imp.isEnabled(),false);
 assert.equal(h.stored.get("kf-chaosphere-imp-reactions-7"),"off");
 assert.equal(h.speech.hidden,true);
 assert.equal(h.root.dataset.kfImpMood,undefined);
});
test("new-message and failed-send reactions are bounded, visual and text-only",()=>{
 const h=harness(),imp=h.api.mount(h.root,7);
 assert.equal(imp.react("incoming"),true);
 assert.equal(h.root.dataset.kfImpMood,"incoming");
 assert.match(h.speech.textContent,/MESSAGE|INBOX|TALKING/);
 assert.equal(h.speech.hidden,false);
 assert.equal(h.inline.hidden,true);
 h.classes.add("kf-chat-open");imp.syncVisibility();
 assert.equal(h.speech.hidden,true);
 assert.equal(h.inline.hidden,false);
 assert.equal(imp.react("failed"),true);
 assert.equal(h.root.dataset.kfImpMood,"failed");
 assert.equal(h.timers.size,1);
 h.flush();
 assert.equal(h.root.dataset.kfImpMood,undefined);
 assert.equal(h.inline.hidden,true);
 assert.equal(h.speech.hidden,true);
 assert.equal(imp.react("unrecognized"),false);
});
test("hidden page never generates a mascot reaction",()=>{
 const h=harness({hidden:true}),imp=h.api.mount(h.root,7);
 assert.equal(imp.react("incoming"),false);
 assert.equal(h.timers.size,0);
});
test("tapping the inbox mascot gives a fixed phrase, no API or auto-send",()=>{
 const h=harness();
 h.listeners.get("DOMContentLoaded")();
 assert.equal(h.heroButton.dataset.ready,"1");
 h.heroButton.click();
 assert.match(h.heroSpeech.textContent,/YOU SUMMONED ME/);
 assert.equal(h.heroSpeech.hidden,false);
 h.flush();assert.equal(h.heroSpeech.hidden,true);
});
