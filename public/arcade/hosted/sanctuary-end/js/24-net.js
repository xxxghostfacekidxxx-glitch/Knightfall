const NET = {
  ws: null, id: 0, connected: false, name: '', remotes: new Map(), sendT: 0,
  connect(host, port, name) {
    this.name = (name || 'Hero').slice(0, 14); if (!host) { this.status('Enter a host address'); return; }
    // Tear down any prior socket first, or a repeat Connect orphans it — its handlers keep firing and its
    // remote ghosts leak. Null the handlers before close() so the old socket's onclose can't clobber new state.
    if (this.ws) { try { this.ws.onopen = this.ws.onmessage = this.ws.onclose = this.ws.onerror = null; this.ws.close(); } catch (_) { } }
    this.clearRemotes(); this.connected = false;
    // HTTPS pages cannot open insecure ws:// connections (mixed content).
    // Accept bare hostnames, host:port, and complete ws(s) URLs.
    let endpoint;
    try {
      const raw = String(host).trim();
      const securePage = location.protocol === 'https:';
      endpoint = new URL(/^wss?:\/\//i.test(raw) ? raw : (securePage ? 'wss://' : 'ws://') + raw);
      if (!['ws:', 'wss:'].includes(endpoint.protocol) || !endpoint.hostname || endpoint.username || endpoint.password) throw new Error('Invalid socket endpoint');
      if (securePage && endpoint.protocol !== 'wss:') { this.status('Secure HTTPS pages require a wss:// multiplayer server'); return; }
      if (port && !/^\\d{1,5}$/.test(String(port))) throw new Error('Invalid port');
      if (port && !endpoint.port) endpoint.port = String(port);
      else if (!endpoint.port && !/^wss?:\/\//i.test(raw) && !raw.includes(':') && !securePage) endpoint.port = '8787';
      this.ws = new WebSocket(endpoint.toString());
    } catch (e) { this.status('Invalid multiplayer address or port'); return; }
    this.status('Connecting…');
    const liveSocket = this.ws;
    this.ws.onopen = () => { if (this.ws !== liveSocket) return; this.connected = true; this.status('Connected — adventuring together'); this.refreshUI(); };
    this.ws.onclose = () => { if (this.ws !== liveSocket) return; this.connected = false; this.clearRemotes(); this.status('Disconnected'); this.refreshUI(); };
    this.ws.onerror = () => { if (this.ws !== liveSocket) return; this.status('Connection failed (is the server running & port open?)'); };
    this.ws.onmessage = ev => { if (this.ws !== liveSocket) return; let m; try { m = JSON.parse(ev.data); } catch (_) { return; } this.onMsg(m); };
  },
  disconnect() { const old = this.ws; this.ws = null; if (old) { try { old.onopen = old.onmessage = old.onclose = old.onerror = null; old.close(); } catch (_) { } } this.connected = false; this.clearRemotes(); this.refreshUI(); this.status('Not connected'); },
  send(o) { if (this.connected && this.ws && this.ws.readyState === 1) { try { this.ws.send(JSON.stringify(o)); } catch (_) { } } },
  onMsg(m) {
    if (!m || typeof m !== 'object' || Array.isArray(m)) return;
    if (m.t === 'welcome' && (Number.isSafeInteger(m.id) || (typeof m.id === 'string' && m.id.length <= 64))) this.id = m.id;
    else if (m.t === 'state') this.upsert(m);
    else if (m.t === 'leave') this.removeRemote(m.id);
    else if (m.t === 'chat' && typeof m.msg === 'string') this.chat(String(m.name || 'Hero').slice(0, 24), m.msg.slice(0, 200));
  },
  upsert(m) {
    // Validate BEFORE allocating a GPU mesh; relays forward peer-controlled data.
    if (!m || typeof m !== 'object' || (typeof m.id !== 'string' && !Number.isSafeInteger(m.id)) ||
        !String(m.id).length || String(m.id).length > 64 || m.id === this.id ||
        !Number.isFinite(m.x) || !Number.isFinite(m.z) ||
        Math.abs(m.x) > 100000 || Math.abs(m.z) > 100000 ||
        (this.remotes.size >= 32 && !this.remotes.has(m.id))) return;
    const nx = m.x, nz = m.z;
    let r = this.remotes.get(m.id);
    if (!r) { const mesh = buildHero(); mesh.scale.set(0.96, 0.96, 0.96); mesh.visible = false; scene.add(mesh); r = { mesh }; this.remotes.set(m.id, r); }
    r.tx = nx; r.tz = nz;
    if (r.x === undefined || Math.hypot(nx - r.x, nz - r.z) > 20) { r.x = nx; r.z = nz; } // snap on spawn/teleport; otherwise tick() lerps toward the target so ~9Hz updates don't stutter
    r.dir = Number.isFinite(m.dir) ? m.dir : 0; r.zone = String(m.zone || '').slice(0, 24); r.depth = Number.isInteger(m.depth) ? m.depth : 0; r.name = String(m.name || 'Player').slice(0, 24); r.cls = m.cls; r.level = Number.isFinite(m.level) ? clamp(m.level,1,1000) : 1; r.hp = Number.isFinite(m.hp) ? Math.max(0,m.hp) : 0; r.hpMax = Number.isFinite(m.hpMax) ? Math.max(1,m.hpMax) : 1;
    if (r.mesh.userData.cloak && Object.prototype.hasOwnProperty.call(CLASSES, m.cls)) r.mesh.userData.cloak.material.color.setHex(CLASSES[m.cls].col);
  },
  removeRemote(id) { const r = this.remotes.get(id); if (r) { removeMesh(r.mesh); this.remotes.delete(id); } },
  clearRemotes() { for (const [, r] of this.remotes) removeMesh(r.mesh); this.remotes.clear(); },
  tick(dt) {
    if (!this.connected) return; this.sendT -= dt; if (this.sendT <= 0 && character && running) { this.sendT = 110; this.send({ t: 'state', x: +player.x.toFixed(2), z: +player.z.toFixed(2), dir: +player.dir.toFixed(2), zone, depth, name: this.name || character.name, cls: character.class, level: player.level, hp: Math.round(player.hp), hpMax: player.hpMax }); }
    for (const [, r] of this.remotes) { const vis = (running && r.zone === zone && r.depth === depth); r.mesh.visible = vis; if (vis) { if (r.tx !== undefined) { const k = Math.min(1, dt / 110); r.x += (r.tx - r.x) * k; r.z += (r.tz - r.z) * k; } r.mesh.position.set(r.x, Math.abs(Math.sin(now() * 0.005)) * 0.12, r.z); r.mesh.rotation.y = r.dir || 0; } }
  },
  status(s) { const el = document.getElementById('mpStatus'); if (el) el.textContent = s; },
  refreshUI() { const c = this.connected; document.getElementById('mpConnect').style.display = c ? 'none' : 'block'; document.getElementById('mpDisconnect').style.display = c ? 'block' : 'none'; document.getElementById('mpChatWrap').style.display = c ? 'block' : 'none'; },
  chat(name, msg) { const log = document.getElementById('mpChatLog'); if (log) { const d = document.createElement('div'); d.innerHTML = '<b style="color:#9fd8ff">' + escapeHtml(name) + ':</b> ' + escapeHtml(msg); log.appendChild(d); while (log.childNodes.length > 200) log.removeChild(log.firstChild); log.scrollTop = log.scrollHeight; } if (running) showMsg(name + ': ' + msg); }
};
function escapeHtml(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
const mpModal = document.getElementById('mpModal');
function openMP() { document.getElementById('mpName').value = NET.name || (character ? character.name : ''); mpModal.style.display = 'block'; NET.refreshUI(); syncBackdrop(); }
function closeMP() { mpModal.style.display = 'none'; syncBackdrop(); }
document.getElementById('mpBtn').onclick = openMP;
document.getElementById('menuMP').onclick = openMP;
document.getElementById('mpClose').onclick = closeMP;
document.getElementById('mpConnect').onclick = () => NET.connect(document.getElementById('mpHost').value.trim(), document.getElementById('mpPort').value.trim(), document.getElementById('mpName').value.trim());
document.getElementById('mpDisconnect').onclick = () => NET.disconnect();
function mpSendChat() { const inp = document.getElementById('mpChatInput'); const v = inp.value.trim(); if (!v || !NET.connected) return; const nm = NET.name || (character ? character.name : 'Hero'); NET.send({ t: 'chat', name: nm, msg: v }); NET.chat(nm, v); inp.value = ''; }
document.getElementById('mpChatSend').onclick = mpSendChat;
document.getElementById('mpChatInput').addEventListener('keydown', e => { if (e.key === 'Enter') mpSendChat(); });
