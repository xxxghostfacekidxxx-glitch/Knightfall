// ============================================================
// EMBERVALE — audio.js
// Chiptune music sequencer + sound effects (Web Audio API)
// All compositions are original.
// ============================================================
'use strict';

const AudioSys = (() => {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let sfxGain = null;
  let muted = false;

  // ---- note name -> frequency ----
  const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function freqOf(name) {
    const m = /^([A-G][#b]?)(-?\d)$/.exec(name);
    if (!m) return 0;
    const midi = NOTE_IDX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 1.0;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = 1.0;
    sfxGain.connect(master);
    // noise buffer for drums / explosions
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  let noiseBuf = null;

  function unlock() {
    ensure();
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        // restart the current song so queued-while-suspended notes don't burst
        if (curSongName) {
          const n = curSongName;
          curSongName = null;
          playSong(n, onSongEnd);
        }
      });
    }
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.5;
  }
  function toggleMute() { setMuted(!muted); return muted; }

  // ---- primitive voices ----
  function tone(wave, freq, t, dur, vol, dest, slide) {
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + Math.max(0.005, dur - 0.03));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(t, dur, vol, filterType, filterFreq, dest) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = filterType || 'highpass';
    f.frequency.value = filterFreq || 4000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest || sfxGain);
    s.start(t); s.stop(t + dur + 0.02);
  }

  // ============================================================
  // MUSIC SEQUENCER
  // Song format:
  // { bpm, loop, channels: [ { wave, vol, notes: [[note|'-', sixteenths], ...] } ] }
  // wave 'noise' uses note letters: k=kick s=snare h=hat
  // ============================================================
  let curSong = null, curSongName = null;
  let schedTimer = null;
  let loopStartT = 0;        // ctx time when current loop iteration began
  let chanPtr = [];          // per-channel: { i, t } t = beats offset within loop
  let songLen = 0;           // in sixteenths
  let onSongEnd = null;

  function songLength(song) {
    let max = 0;
    for (const ch of song.channels) {
      let t = 0;
      for (const n of ch.notes) t += n[1];
      max = Math.max(max, t);
    }
    return max;
  }

  function scheduleDrum(letter, t, vol) {
    if (letter === 'k') {
      tone('sine', 120, t, 0.10, vol * 1.6, musicGain, 40);
    } else if (letter === 's') {
      noise(t, 0.09, vol * 0.9, 'bandpass', 1800, musicGain);
      tone('triangle', 180, t, 0.05, vol * 0.5, musicGain, 90);
    } else if (letter === 'h') {
      noise(t, 0.04, vol * 0.45, 'highpass', 7000, musicGain);
    }
  }

  function tick() {
    if (!curSong || !ctx) return;
    const LOOKAHEAD = 0.25;
    const sixteenth = 60 / curSong.bpm / 4;
    const now = ctx.currentTime;
    const horizon = now + LOOKAHEAD;
    const loopDur = songLen * sixteenth;

    for (let c = 0; c < curSong.channels.length; c++) {
      const ch = curSong.channels[c];
      const p = chanPtr[c];
      while (true) {
        if (p.i >= ch.notes.length) {
          if (!curSong.loop) break;
          // wait for next loop iteration
          break;
        }
        const evT = loopStartT + p.t * sixteenth;
        if (evT >= horizon) break;
        const [note, dur] = ch.notes[p.i];
        const durS = dur * sixteenth;
        if (note !== '-') {
          if (ch.wave === 'noise') scheduleDrum(note, evT, ch.vol);
          else tone(ch.wave, freqOf(note), evT, Math.min(durS * 0.92, durS - 0.01 > 0 ? durS - 0.01 : durS * 0.9), ch.vol, musicGain);
        }
        p.t += dur;
        p.i++;
      }
    }
    // advance loop?
    const allDone = chanPtr.every((p, c) => p.i >= curSong.channels[c].notes.length);
    if (allDone) {
      if (curSong.loop) {
        if (loopStartT + loopDur < horizon) {
          loopStartT += loopDur;
          chanPtr = curSong.channels.map(() => ({ i: 0, t: 0 }));
        }
      } else if (now > loopStartT + loopDur) {
        const cb = onSongEnd;
        stopMusic();
        if (cb) cb();
      }
    }
  }

  function playSong(name, endCb) {
    ensure();
    if (curSongName === name && curSong && curSong.loop) return;
    stopMusic();
    const song = SONGS[name];
    if (!song) return;
    curSong = song; curSongName = name;
    songLen = songLength(song);
    loopStartT = ctx.currentTime + 0.06;
    chanPtr = song.channels.map(() => ({ i: 0, t: 0 }));
    onSongEnd = endCb || null;
    schedTimer = setInterval(tick, 80);
    tick();
  }

  function stopMusic() {
    if (schedTimer) { clearInterval(schedTimer); schedTimer = null; }
    curSong = null; curSongName = null; onSongEnd = null;
  }

  function currentSong() { return curSongName; }

  // ============================================================
  // COMPOSITIONS (original)
  // ============================================================
  // helpers to build note arrays tersely
  function seq(str) {
    // "A4:2 C5:2 -:4" -> [['A4',2],['C5',2],['-',4]]
    return str.trim().split(/\s+/).map(tok => {
      const [n, d] = tok.split(':');
      return [n, parseFloat(d)];
    });
  }
  function rep(arr, times) {
    const out = [];
    for (let i = 0; i < times; i++) out.push(...arr);
    return out;
  }
  // bass bar: root + fifth pumping eighths
  function bassBar(root, fifth) {
    return seq(`${root}:2 ${root}:2 ${fifth}:2 ${root}:2 ${root}:2 ${fifth}:2 ${root}:2 ${fifth}:2`);
  }

  const DRUM_BAR = seq('k:2 h:2 h:2 h:2 s:2 h:2 h:2 h:2');
  const DRUM_BAR2 = seq('k:2 h:2 k:2 h:2 s:2 h:2 h:1 h:1 k:2');

  const SONGS = {
    // ---------- TITLE: "Lanterns at Dusk" ----------
    title: {
      bpm: 96, loop: true,
      channels: [
        { // dreamy lead
          wave: 'square', vol: 0.10,
          notes: seq(`
            -:8 E5:4 D5:2 C5:2
            B4:6 G4:2 A4:8
            -:8 A4:2 B4:2 C5:2 D5:2
            E5:8 D5:4 B4:4
            -:8 E5:4 G5:4
            A5:6 G5:2 E5:8
            D5:4 C5:4 B4:4 D5:4
            A4:12 -:4
          `)
        },
        { // arpeggio harp
          wave: 'triangle', vol: 0.13,
          notes: rep(seq('A3:2 E4:2 A4:2 C5:2 E5:2 C5:2 A4:2 E4:2'), 2)
            .concat(rep(seq('F3:2 C4:2 F4:2 A4:2 C5:2 A4:2 F4:2 C4:2'), 2))
            .concat(rep(seq('C4:2 G4:2 C5:2 E5:2 G5:2 E5:2 C5:2 G4:2'), 2))
            .concat(seq('G3:2 D4:2 G4:2 B4:2 D5:2 B4:2 G4:2 D4:2'))
            .concat(seq('E3:2 B3:2 E4:2 G#4:2 B4:2 G#4:2 E4:2 B3:2'))
        },
        { // deep pedal
          wave: 'sine', vol: 0.16,
          notes: seq('A2:16 A2:16 F2:16 F2:16 C3:16 C3:16 G2:16 E2:16')
        }
      ]
    },

    // ---------- OVERWORLD: "Green Horizons" ----------
    overworld: {
      bpm: 152, loop: true,
      channels: [
        { // lead melody
          wave: 'square', vol: 0.115,
          notes: seq(`
            A4:2 C5:2 E5:2 A5:2 G5:4 E5:4
            F5:2 G5:2 A5:2 F5:2 E5:4 C5:4
            D5:2 E5:2 F5:2 G5:2 A5:4 F5:2 D5:2
            E5:8 B4:4 C5:2 D5:2
            E5:4 E5:2 D5:2 C5:4 A4:4
            F5:4 F5:2 E5:2 D5:4 B4:4
            C5:2 D5:2 E5:2 F5:2 G5:4 A5:4
            A5:2 G5:2 E5:2 D5:2 C5:8
            C5:2 E5:2 G5:2 C6:2 B5:4 G5:4
            A5:2 B5:2 C6:2 A5:2 G5:4 E5:4
            F5:2 G5:2 A5:2 B5:2 C6:4 A5:4
            G5:8 D5:4 E5:2 F5:2
            E5:4 C5:4 D5:4 B4:4
            C5:4 A4:4 B4:4 G4:4
            A4:2 B4:2 C5:2 D5:2 E5:4 F5:4
            E5:2 D5:2 B4:2 G4:2 A4:8
          `)
        },
        { // soft harmony pad (chord thirds)
          wave: 'square', vol: 0.05,
          notes: seq(`
            C4:16 A3:16 F4:16 B3:16
            C4:16 D4:16 A3:16 E4:16
            E4:16 C4:16 A3:16 B3:16
            G3:16 C4:16 F4:16 C4:16
          `)
        },
        { // bass
          wave: 'triangle', vol: 0.21,
          notes: [].concat(
            bassBar('A2', 'E3'), bassBar('F2', 'C3'), bassBar('D2', 'A2'), bassBar('E2', 'B2'),
            bassBar('A2', 'E3'), bassBar('G2', 'D3'), bassBar('F2', 'C3'), bassBar('C3', 'G3'),
            bassBar('C3', 'G3'), bassBar('A2', 'E3'), bassBar('F2', 'C3'), bassBar('G2', 'D3'),
            bassBar('C3', 'G3'), bassBar('A2', 'E3'), bassBar('D2', 'A2'), bassBar('A2', 'E3')
          )
        },
        {
          wave: 'noise', vol: 0.12,
          notes: rep([].concat(DRUM_BAR, DRUM_BAR, DRUM_BAR, DRUM_BAR2), 4)
        }
      ]
    },

    // ---------- DUNGEON: "The Hollow Ruins" ----------
    dungeon: {
      bpm: 104, loop: true,
      channels: [
        { // eerie lead
          wave: 'square', vol: 0.085,
          notes: seq(`
            D4:6 F4:2 E4:4 C#4:4
            D4:6 A4:2 G#4:8
            -:4 A4:2 Bb4:2 A4:4 F4:4
            E4:4 C#4:4 D4:8
            D5:6 C5:2 Bb4:4 A4:4
            G#4:6 A4:2 Bb4:8
            A4:4 F4:4 E4:2 F4:2 E4:2 C#4:2
            D4:12 -:4
          `)
        },
        { // pulsing low
          wave: 'triangle', vol: 0.22,
          notes: rep(seq('D2:4 -:4 D2:2 D2:2 -:4'), 6)
            .concat(seq('A1:4 -:4 A1:2 A1:2 -:4'))
            .concat(seq('D2:4 -:4 C#2:2 C#2:2 -:4'))
        },
        { // distant tritone bell
          wave: 'sine', vol: 0.07,
          notes: seq('-:12 G#5:4 -:28 D5:4 -:12 -:12 G#4:4 -:28 C#5:4 -:12')
        },
        {
          wave: 'noise', vol: 0.07,
          notes: rep(seq('k:8 h:4 h:4'), 8)
        }
      ]
    },

    // ---------- BOSS: "Gloom Knight" ----------
    boss: {
      bpm: 168, loop: true,
      channels: [
        {
          wave: 'square', vol: 0.115,
          notes: seq(`
            E5:2 E5:2 -:2 E5:2 F5:2 E5:2 D#5:2 E5:2
            G5:4 F5:2 E5:2 D5:4 B4:4
            C5:2 C5:2 -:2 C5:2 D5:2 C5:2 B4:2 C5:2
            E5:4 D#5:2 D5:2 C#5:4 C5:4
            B4:2 E5:2 B4:2 E5:2 F5:2 E5:2 D5:2 C5:2
            B4:4 G5:4 F#5:4 F5:4
            E5:2 -:2 E5:2 -:2 G5:2 -:2 Bb5:2 -:2
            B5:4 Bb5:2 A5:2 G5:2 F5:2 E5:2 D#5:2
          `)
        },
        {
          wave: 'sawtooth', vol: 0.13,
          notes: [].concat(
            rep(seq('E2:2 E2:2 E3:2 E2:2 E2:2 E3:2 E2:2 E3:2'), 2),
            rep(seq('C2:2 C2:2 C3:2 C2:2 C2:2 C3:2 C2:2 C3:2'), 2),
            rep(seq('B1:2 B1:2 B2:2 B1:2 B1:2 B2:2 B1:2 B2:2'), 2),
            seq('E2:2 E2:2 E3:2 E2:2 G2:2 G2:2 Bb2:2 Bb2:2'),
            seq('B1:2 B2:2 B1:2 B2:2 B1:2 B1:2 B2:2 B1:2')
          )
        },
        {
          wave: 'noise', vol: 0.13,
          notes: rep(seq('k:2 h:2 s:2 h:2 k:2 k:2 s:2 h:2'), 8)
        }
      ]
    },

    // ---------- HOUSE / SHOP: "Hearth & Wares" (3/4 waltz) ----------
    house: {
      bpm: 132, loop: true,
      channels: [
        {
          wave: 'square', vol: 0.09,
          notes: seq(`
            E5:4 G5:4 C6:4
            B5:8 G5:4
            A5:4 F5:4 D5:4
            G5:12
            E5:4 G5:4 C6:4
            D6:8 B5:4
            C6:4 A5:4 F5:4
            G5:4 E5:8
          `)
        },
        {
          wave: 'triangle', vol: 0.16,
          notes: seq(`
            C3:4 E4:4 G4:4
            G2:4 D4:4 G4:4
            F2:4 A3:4 F4:4
            G2:4 B3:4 F4:4
            C3:4 E4:4 G4:4
            G2:4 D4:4 G4:4
            F2:4 A3:4 D4:4
            C3:4 E4:4 G4:4
          `)
        }
      ]
    },

    // ---------- FAIRY POND: "Glimmerspring" ----------
    fairy: {
      bpm: 112, loop: true,
      channels: [
        {
          wave: 'sine', vol: 0.12,
          notes: seq(`
            E5:2 G5:2 B5:2 E6:2 D6:2 B5:2 G5:2 D5:2
            E5:2 G5:2 B5:2 E6:2 F#6:2 D6:2 B5:2 F#5:2
            G5:2 B5:2 D6:2 G6:2 F#6:2 D6:2 B5:2 F#5:2
            E6:4 B5:4 G5:4 E5:4
          `)
        },
        {
          wave: 'triangle', vol: 0.14,
          notes: seq('E3:16 E3:16 G3:8 D3:8 E3:16')
        }
      ]
    },

    // ---------- FANFARES (non-looping) ----------
    item: {
      bpm: 140, loop: false,
      channels: [
        { wave: 'square', vol: 0.14, notes: seq('G4:2 C5:2 E5:2 G5:6') },
        { wave: 'square', vol: 0.09, notes: seq('E4:2 G4:2 C5:2 E5:6') },
        { wave: 'triangle', vol: 0.18, notes: seq('C3:2 C3:2 C3:2 C3:6') }
      ]
    },
    bigitem: {
      bpm: 132, loop: false,
      channels: [
        { wave: 'square', vol: 0.14, notes: seq('C5:3 C5:1 C5:2 C5:2 Ab4:2 Bb4:2 C5:4 -:2 Bb4:1 C5:9') },
        { wave: 'square', vol: 0.09, notes: seq('E4:3 E4:1 E4:2 E4:2 F4:2 G4:2 E4:4 -:2 G4:1 E5:9') },
        { wave: 'triangle', vol: 0.19, notes: seq('C3:4 C3:4 F2:4 C3:4 -:2 G2:1 C3:9') }
      ]
    },
    victory: {
      bpm: 130, loop: false,
      channels: [
        {
          wave: 'square', vol: 0.13,
          notes: seq('G4:2 C5:2 E5:2 G5:4 E5:2 G5:8 -:2 A5:2 G5:2 F5:2 E5:2 D5:2 E5:2 C5:12')
        },
        {
          wave: 'square', vol: 0.08,
          notes: seq('E4:2 G4:2 C5:2 E5:4 C5:2 E5:8 -:2 F5:2 E5:2 D5:2 C5:2 B4:2 C5:2 G4:12')
        },
        {
          wave: 'triangle', vol: 0.2,
          notes: seq('C3:4 C3:4 C3:4 G2:4 -:2 F2:4 G2:4 C3:12')
        },
        { wave: 'noise', vol: 0.1, notes: seq('k:2 h:2 s:2 h:2 k:2 s:2 k:2 h:2 s:2 h:2 k:2 s:2 k:12') }
      ]
    },
    gameover: {
      bpm: 80, loop: false,
      channels: [
        { wave: 'square', vol: 0.1, notes: seq('E4:4 Eb4:4 D4:4 C#4:10') },
        { wave: 'triangle', vol: 0.18, notes: seq('A2:4 G2:4 F2:4 E2:10') }
      ]
    }
  };

  // ============================================================
  // SOUND EFFECTS
  // ============================================================
  const SFX = {
    sword() { const t = ctx.currentTime; noise(t, 0.09, 0.25, 'bandpass', 2500); tone('square', 720, t, 0.07, 0.1, sfxGain, 220); },
    clang() { const t = ctx.currentTime; tone('square', 1900, t, 0.12, 0.13, sfxGain, 1500); noise(t, 0.06, 0.2, 'highpass', 5000); },
    hitEnemy() { const t = ctx.currentTime; tone('square', 320, t, 0.09, 0.16, sfxGain, 110); },
    hitPlayer() { const t = ctx.currentTime; tone('square', 190, t, 0.18, 0.2, sfxGain, 70); noise(t, 0.1, 0.15, 'lowpass', 900); },
    enemyDie() { const t = ctx.currentTime; tone('square', 540, t, 0.07, 0.15, sfxGain, 1300); tone('square', 270, t + 0.06, 0.12, 0.14, sfxGain, 60); noise(t + 0.03, 0.13, 0.18, 'bandpass', 1400); },
    gem() { const t = ctx.currentTime; tone('square', 1320, t, 0.05, 0.1); tone('square', 1980, t + 0.05, 0.09, 0.1); },
    heart() { const t = ctx.currentTime; tone('sine', 660, t, 0.07, 0.16); tone('sine', 990, t + 0.07, 0.12, 0.16); },
    key() { const t = ctx.currentTime; tone('square', 880, t, 0.06, 0.12); tone('square', 1175, t + 0.06, 0.06, 0.12); tone('square', 1760, t + 0.12, 0.12, 0.12); },
    door() { const t = ctx.currentTime; noise(t, 0.2, 0.25, 'lowpass', 500); tone('square', 110, t, 0.18, 0.14, sfxGain, 70); },
    shutter() { const t = ctx.currentTime; noise(t, 0.15, 0.3, 'lowpass', 350); tone('square', 80, t, 0.15, 0.18, sfxGain, 50); },
    secret() {
      const t = ctx.currentTime;
      const ns = ['G5', 'F#5', 'D#5', 'A4', 'G#4', 'E5', 'G#5', 'C6'];
      ns.forEach((n, i) => tone('square', freqOf(n), t + i * 0.085, 0.085, 0.12));
    },
    stairs() { const t = ctx.currentTime; for (let i = 0; i < 4; i++) tone('square', 300 - i * 50, t + i * 0.07, 0.07, 0.1); },
    text() { const t = ctx.currentTime; tone('square', 1100, t, 0.025, 0.045); },
    cursor() { const t = ctx.currentTime; tone('square', 880, t, 0.04, 0.08); },
    bombSet() { const t = ctx.currentTime; tone('square', 240, t, 0.08, 0.12, sfxGain, 480); },
    fuse() { const t = ctx.currentTime; noise(t, 0.05, 0.06, 'highpass', 6000); },
    boom() {
      const t = ctx.currentTime;
      noise(t, 0.5, 0.5, 'lowpass', 700);
      tone('sine', 90, t, 0.4, 0.5, sfxGain, 30);
      noise(t + 0.05, 0.3, 0.3, 'bandpass', 300);
    },
    arrow() { const t = ctx.currentTime; noise(t, 0.08, 0.18, 'highpass', 3000); tone('square', 900, t, 0.06, 0.07, sfxGain, 1600); },
    bowDraw() { const t = ctx.currentTime; tone('triangle', 200, t, 0.1, 0.1, sfxGain, 330); },
    cut() { const t = ctx.currentTime; noise(t, 0.1, 0.22, 'bandpass', 1100); },
    hop() { const t = ctx.currentTime; tone('triangle', 220, t, 0.08, 0.1, sfxGain, 440); },
    bossHit() { const t = ctx.currentTime; tone('square', 220, t, 0.18, 0.22, sfxGain, 55); noise(t, 0.15, 0.22, 'bandpass', 800); },
    bossRoar() {
      const t = ctx.currentTime;
      tone('sawtooth', 90, t, 0.5, 0.25, sfxGain, 45);
      noise(t, 0.45, 0.2, 'lowpass', 600);
    },
    charge() { const t = ctx.currentTime; tone('sawtooth', 70, t, 0.3, 0.2, sfxGain, 160); },
    lowHp() { const t = ctx.currentTime; tone('square', 1320, t, 0.06, 0.07); tone('square', 880, t + 0.08, 0.06, 0.07); },
    fairy() { const t = ctx.currentTime; for (let i = 0; i < 6; i++) tone('sine', 880 + i * 220, t + i * 0.06, 0.1, 0.08); },
    buy() { const t = ctx.currentTime; tone('square', 660, t, 0.05, 0.1); tone('square', 880, t + 0.05, 0.05, 0.1); tone('square', 1320, t + 0.1, 0.1, 0.1); },
    denied() { const t = ctx.currentTime; tone('square', 220, t, 0.09, 0.12); tone('square', 196, t + 0.09, 0.13, 0.12); },
    swordBeam() { const t = ctx.currentTime; for (let i = 0; i < 3; i++) tone('square', 880 + i * 160, t + i * 0.03, 0.05, 0.07); }
  };

  function sfx(name) {
    if (!ctx || muted) return;
    const f = SFX[name];
    if (f) f();
  }

  return { unlock, playSong, stopMusic, currentSong, sfx, toggleMute, get muted() { return muted; } };
})();
