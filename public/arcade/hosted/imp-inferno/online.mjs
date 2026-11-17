const API = 'wss://api.ash-fall.com/api/arcade/imp-inferno/rooms/';
const ROOM_ID = /^[a-f0-9]{16}$/;

export function parseRoom(value) {
  const input = value.trim();
  if (ROOM_ID.test(input)) return input;
  try {
    const url = new URL(input, location.href);
    const code = new URLSearchParams(url.hash.slice(1)).get('room');
    return ROOM_ID.test(code ?? '') ? code : null;
  } catch { return null; }
}

export function newRoomId() {
  return crypto.randomUUID().replaceAll('-', '').slice(0, 16);
}

export function inviteUrl(room) {
  const invite = new URL(location.href);
  invite.search = '';
  invite.hash = 'room=' + room;
  return invite.href;
}

export function openRoom(room, onMessage, onStatus) {
  const key = 'imp-inferno-seat:' + room;
  let token = crypto.randomUUID().replaceAll('-', '');
  try {
    const saved = sessionStorage.getItem(key);
    if (/^[a-f0-9]{32}$/.test(saved ?? '')) token = saved;
    else sessionStorage.setItem(key, token);
  } catch {}

  let socket;
  let retry = 0;
  let reconnect;
  let closed = false;
  function connect() {
    socket = new WebSocket(API + room, ['imp-inferno-v3', 'imp-inferno-v2', 'imp-inferno-v1', 'seat.' + token]);
    socket.addEventListener('message', event => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.type === 'welcome') retry = 0;
      onMessage(message);
    });
    socket.addEventListener('close', event => {
      if (closed) return;
      const terminal = event.code === 4004 || event.code === 4001;
      const label = event.code === 4004 ? 'All four seats are taken.' : 'This seat was opened in another tab.';
      if (terminal || retry >= 7) {
        onStatus(terminal ? label : 'Could not reach the table. Try joining again.', true);
        return;
      }
      onStatus('Reconnecting to your seat…');
      reconnect = setTimeout(connect, Math.min(4000, 700 * 2 ** retry++));
    });
  }
  connect();
  return {
    send(input) {
      if (socket.readyState === WebSocket.OPEN && socket.bufferedAmount < 16_384) socket.send(JSON.stringify(input));
    },
    close() {
      closed = true;
      clearTimeout(reconnect);
      try { socket.close(4000, 'Left table'); } catch {}
    },
  };
}
