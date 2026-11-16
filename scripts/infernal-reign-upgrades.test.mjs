import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';
const root = 'public/arcade/hosted/sanctuary-end/';
const read = name => readFileSync(root + name, 'utf8');

test('Infernal Reign preserves the upstream game and exposes its own themed hero hub', () => {
  const html = read('sanctuary.html'), css = read('ashfall-theme.css');
  assert.match(html, /<h1>INFERNAL REIGN<\/h1>/);
  assert.match(html, /id="quickSaveBtn"/);
  assert.match(html, /id="backupBtn"/);
  assert.match(html, /id="menuBackup"/);
  assert.match(css, /obsidian-cathedral\.svg/);
  assert.match(css, /max-width:860px/);
  assert.match(html, /ashfall-theme\.css\?v=20261116-reign2/);
  assert.match(html, /id="mpStatus" role="status" aria-live="polite"/);
  assert.match(html, /no public Knightfall relay is configured/);
  assert.doesNotMatch(html, /run the included <b>server\.js<\/b>/);
});

test('manual desktop and mobile saves sync current gameplay before recording and never quit after failure', () => {
  const screen = read('js/22-screens.js');
  const input = read('js/13-input.js');
  const settings = read('js/23-settings.js');
  assert.match(screen, /getElementById\('quickSaveBtn'\)\.onclick = \(\) => \{ if \(running\) saveProgress\(true\)/);
  assert.match(screen, /getElementById\('saveBtn'\)\.onclick = \(\) => \{ if \(!saveProgress\(true\)\) return;/);
  assert.match(input, /const saved=saveProgress\(true\)/);
  assert.match(settings, /getElementById\('menuBackup'\)\.onclick = openBackup/);
  assert.match(settings, /getElementById\('backupBtn'\)\.onclick = openBackup/);
  assert.match(settings, /function downloadSave\(\) \{ if \(running && character\) flushSaveProgress\(\)/);
  assert.match(settings, /function renderSavesIO\(\) \{ if \(running && character\) flushSaveProgress\(\)/);
  assert.match(settings, /infernal_reign_save_/);
  assert.match(settings, /raw\.length > 5000000/);
  assert.match(settings, /data\.slots\.length > SAVE\.NUM_SLOTS/);
});

function netHarness() {
  const source = read('js/24-net.js');
  const end = source.indexOf('function escapeHtml');
  assert.ok(end > 200, 'network object must remain independently testable');
  const statuses = Object.fromEntries(['mpStatus','mpConnect','mpDisconnect','mpChatWrap'].map(id => [id, {style:{},textContent:''}]));
  const sockets = [];
  let meshes = 0, removed = 0;
  class WebSocket {
    constructor(url) { this.url=url; this.readyState=0; sockets.push(this); }
    close() { this.closed=true; }
    send() {}
  }
  const scene = {add() {}};
  const sandbox = {
    URL, WebSocket, scene, location:{protocol:'https:'}, document:{getElementById:id => statuses[id]},
    CLASSES:{warrior:{col:0xff4499}}, clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),
    buildHero:() => { meshes++; return {scale:{set(){}},userData:{cloak:{material:{color:{setHex(){}}}}},position:{set(){}},rotation:{y:0}}; },
    removeMesh:()=>{removed++;}, now:()=>0, console
  };
  vm.runInNewContext(source.slice(0,end) + '\n globalThis.__net = NET;',sandbox,{timeout:2000,filename:'infernal-net.js'});
  return {net:sandbox.__net,sockets,statuses,meshes:()=>meshes,removed:()=>removed};
}

test('multiplayer ignores malformed frames before creating GPU scene objects',()=>{
  const h=netHarness(),n=h.net;
  for(const invalid of [null,false,42,[],{}, {t:'state',id:1,x:NaN,z:2}, {t:'state',id:1,x:'42',z:2}, {t:'state',id:1,x:200001,z:0}, {t:'state',id:{},x:2,z:1}]) n.onMsg(invalid);
  assert.equal(n.remotes.size,0);
  assert.equal(h.meshes(),0,'no GPU model for an invalid peer');
  for(let i=1;i<=34;i++)n.onMsg({t:'state',id:i,x:10,z:-10,zone:'town',depth:0,name:'test',cls:'warrior',hp:5,hpMax:10});
  assert.equal(n.remotes.size,32,'untrusted relay cannot allocate unlimited meshes');
  assert.equal(h.meshes(),32);
  n.onMsg({t:'state',id:1,x:11,z:-8,zone:'town',depth:0,name:'update'});
  assert.equal(n.remotes.get(1).tx,11,'existing peers continue updating when at cap');
  n.onMsg({t:'leave',id:1});
  assert.equal(n.remotes.size,31);
  assert.equal(h.removed(),1);
});

test('HTTPS multiplayer requires secure WSS and rejects invalid ports and stale sockets',()=>{
  const h=netHarness(),n=h.net;
  n.connect('ws://insecure.example','', 'Hero');
  assert.equal(h.sockets.length,0);
  assert.match(h.statuses.mpStatus.textContent,/wss:\/\//);
  n.connect('relay.example.com','oops','Hero');
  assert.equal(h.sockets.length,0,'non-numeric ports must be rejected');
  n.connect('relay.example.com','443','Hero');
  assert.equal(h.sockets.length,1);
  assert.match(h.sockets[0].url,/^wss:\/\//);
  const first=h.sockets[0];
  n.connect('wss://other.example.com','','Hero');
  assert.equal(h.sockets.length,2);
  assert.equal(first.closed,true);
  const second=h.sockets[1];
  first.onopen?.();
  assert.equal(n.connected,false,'stale sockets cannot reopen a disconnected session');
  second.onopen();
  assert.equal(n.connected,true);
  n.disconnect();
  assert.equal(n.connected,false);
  assert.equal(second.closed,true);
});

test('all customized game scripts are parseable JavaScript',()=>{
  for(const filename of ['js/13-input.js','js/22-screens.js','js/23-settings.js','js/24-net.js']){
    const check=spawnSync(process.execPath,['--check'],{input:read(filename),encoding:'utf8'});
    assert.equal(check.status,0,filename+' '+check.stderr);
  }
});
