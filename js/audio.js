// === DARK FANTASY AUDIO ENGINE — Menu BGM + Battle BGM + SFX ===
const AudioEngine = {
  ctx: null,
  master: null,
  sfxBus: null,
  playing: false,
  battlePlaying: false,
  nodes: [],
  battleNodes: [],
  currentMode: 'none',

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
    this.sfxBus = this.ctx.createGain();
    this.sfxBus.gain.value = 0.5;
    this.sfxBus.connect(this.ctx.destination);
  },

  // ========== UTILITIES ==========
  createDrone(freq, detune, vol, nodeArr) {
    const arr = nodeArr || this.nodes;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth'; osc.frequency.value = freq; osc.detune.value = detune;
    filter.type = 'lowpass'; filter.frequency.value = 200; filter.Q.value = 2;
    gain.gain.value = vol;
    osc.connect(filter); filter.connect(gain); gain.connect(this.master); osc.start();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.05 + Math.random() * 0.08; lfoG.gain.value = 80;
    lfo.connect(lfoG); lfoG.connect(filter.frequency); lfo.start();
    arr.push(osc, lfo);
    return { osc, gain, filter };
  },

  createBell(freq, delay, nodeArr) {
    const arr = nodeArr || this.nodes;
    const ref = { active: true };
    arr.push(ref);
    const play = () => {
      if (!ref.active) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sine'; osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.02);
      filter.type = 'bandpass'; filter.frequency.value = freq; filter.Q.value = 8;
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
      osc.connect(filter); filter.connect(gain); gain.connect(this.master);
      osc.start(now); osc.stop(now + 4.5);
    };
    const loop = () => {
      if (!ref.active) return;
      play(); setTimeout(loop, (delay + Math.random() * delay * 1.5) * 1000);
    };
    setTimeout(loop, delay * 1000 * Math.random());
  },

  createChoir(freq, vol, nodeArr) {
    const arr = nodeArr || this.nodes;
    const real = new Float32Array([0, 0, 0.4, 0, 0.2, 0, 0.1, 0, 0.05]);
    const imag = new Float32Array(real.length);
    const wave = this.ctx.createPeriodicWave(real, imag);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.setPeriodicWave(wave); osc.frequency.value = freq;
    filter.type = 'lowpass'; filter.frequency.value = 400; filter.Q.value = 1;
    gain.gain.value = vol;
    osc.connect(filter); filter.connect(gain); gain.connect(this.master); osc.start();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.03; lfoG.gain.value = vol * 0.5;
    lfo.connect(lfoG); lfoG.connect(gain.gain); lfo.start();
    arr.push(osc, lfo);
  },

  createWind(vol, nodeArr) {
    const arr = nodeArr || this.nodes;
    const bufSize = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass'; filter.frequency.value = 300; filter.Q.value = 0.5;
    const gain = this.ctx.createGain(); gain.gain.value = vol;
    src.connect(filter); filter.connect(gain); gain.connect(this.master); src.start();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 0.07; lfoG.gain.value = 200;
    lfo.connect(lfoG); lfoG.connect(filter.frequency); lfo.start();
    arr.push(src, lfo);
  },

  createMelody(notes, interval, vol, nodeArr) {
    const arr = nodeArr || this.nodes;
    const ref = { active: true };
    arr.push(ref);
    const play = () => {
      if (!ref.active) return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(vol, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
      osc.connect(gain); gain.connect(this.master);
      osc.start(now); osc.stop(now + 3.5);
      setTimeout(play, (interval + Math.random() * interval) * 1000);
    };
    setTimeout(play, 2000);
  },

  stopNodes(arr) {
    arr.forEach(n => {
      try { if (n.stop) n.stop(); } catch(e) {}
      if (n.active !== undefined) n.active = false;
    });
    arr.length = 0;
  },

  // ========== MENU BGM ==========
  startMenu() {
    this.init();
    if (this.currentMode === 'menu') return;
    this.stopAll();
    this.currentMode = 'menu';
    this.playing = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.createDrone(73.42, 0, 0.12, this.nodes);
    this.createDrone(73.42, -8, 0.08, this.nodes);
    this.createDrone(110.00, 5, 0.06, this.nodes);
    this.createDrone(55.00, 0, 0.10, this.nodes);
    this.createChoir(146.83, 0.04, this.nodes);
    this.createChoir(174.61, 0.03, this.nodes);
    this.createWind(0.05, this.nodes);
    this.createBell(587.33, 6, this.nodes);
    this.createBell(698.46, 8, this.nodes);
    this.createBell(880.00, 10, this.nodes);
    this.createBell(523.25, 12, this.nodes);
    this.createMelody([146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23], 3, 0.04, this.nodes);
    this.master.gain.setValueAtTime(0, this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 3);
  },

  // ========== BATTLE BGM ==========
  startBattle() {
    this.init();
    if (this.currentMode === 'battle') return;
    this.stopAll();
    this.currentMode = 'battle';
    this.battlePlaying = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Heavier drones — E minor, more aggressive
    this.createDrone(82.41, 0, 0.14, this.battleNodes);    // E2
    this.createDrone(82.41, 12, 0.10, this.battleNodes);   // E2 detuned sharp
    this.createDrone(61.74, 0, 0.12, this.battleNodes);    // B1 sub
    this.createDrone(123.47, -6, 0.08, this.battleNodes);  // B2

    // Aggressive choir — dissonant
    this.createChoir(164.81, 0.05, this.battleNodes);  // E3
    this.createChoir(185.00, 0.04, this.battleNodes);  // F#3 (tension)
    this.createChoir(246.94, 0.03, this.battleNodes);  // B3

    // Battle wind — harsher
    this.createWind(0.07, this.battleNodes);

    // Tension bells — tritone intervals
    this.createBell(659.25, 4, this.battleNodes);   // E5
    this.createBell(698.46, 5, this.battleNodes);   // F5 (minor 2nd tension)
    this.createBell(987.77, 7, this.battleNodes);   // B5
    this.createBell(466.16, 9, this.battleNodes);   // Bb4 (tritone)

    // Battle melody — more rhythmic, E minor pentatonic
    this.createMelody([164.81, 196.00, 220.00, 246.94, 329.63, 392.00, 440.00], 1.5, 0.05, this.battleNodes);

    // War drums — procedural percussion
    this.startWarDrums();

    // Fade in
    this.master.gain.setValueAtTime(0, this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.38, this.ctx.currentTime + 2);
  },

  startWarDrums() {
    const ref = { active: true };
    this.battleNodes.push(ref);
    const patterns = [
      [1, 0, 0, 1, 0, 0, 1, 0],  // basic
      [1, 0, 1, 0, 0, 1, 0, 0],  // syncopated
      [1, 0, 0, 0, 1, 0, 1, 0],  // tension
    ];
    let step = 0;
    let patIdx = 0;
    const bpm = 75;
    const stepTime = (60 / bpm) / 2;

    const tick = () => {
      if (!ref.active) return;
      const pat = patterns[patIdx];
      if (pat[step % pat.length]) {
        this.playDrum(step % 4 === 0 ? 'kick' : 'tom');
      }
      step++;
      if (step % 32 === 0) patIdx = Math.floor(Math.random() * patterns.length);
      setTimeout(tick, stepTime * 1000);
    };
    tick();
  },

  playDrum(type) {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    if (type === 'kick') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      filter.type = 'lowpass'; filter.frequency.value = 200;
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200 + Math.random() * 60, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      filter.type = 'lowpass'; filter.frequency.value = 400;
    }

    osc.connect(filter); filter.connect(gain); gain.connect(this.master);
    osc.start(now); osc.stop(now + 0.5);
  },

  // ========== SFX — MOVESETS ==========

  // ATTACK — metallic slash
  sfxAttack() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    // Whoosh
    const bufSize = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const whoosh = this.ctx.createBufferSource();
    whoosh.buffer = buf;
    const wF = this.ctx.createBiquadFilter();
    wF.type = 'bandpass'; wF.frequency.setValueAtTime(2000, now);
    wF.frequency.exponentialRampToValueAtTime(500, now + 0.2); wF.Q.value = 2;
    const wG = this.ctx.createGain();
    wG.gain.setValueAtTime(0.4, now);
    wG.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    whoosh.connect(wF); wF.connect(wG); wG.connect(this.sfxBus);
    whoosh.start(now); whoosh.stop(now + 0.3);

    // Metal clang
    const clang = this.ctx.createOscillator();
    const cG = this.ctx.createGain();
    clang.type = 'square';
    clang.frequency.setValueAtTime(800, now + 0.08);
    clang.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    cG.gain.setValueAtTime(0, now);
    cG.gain.setValueAtTime(0.2, now + 0.08);
    cG.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    clang.connect(cG); cG.connect(this.sfxBus);
    clang.start(now); clang.stop(now + 0.4);

    // Impact thud
    const impact = this.ctx.createOscillator();
    const iG = this.ctx.createGain();
    impact.type = 'sine';
    impact.frequency.setValueAtTime(150, now + 0.1);
    impact.frequency.exponentialRampToValueAtTime(50, now + 0.25);
    iG.gain.setValueAtTime(0, now);
    iG.gain.setValueAtTime(0.3, now + 0.1);
    iG.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    impact.connect(iG); iG.connect(this.sfxBus);
    impact.start(now); impact.stop(now + 0.4);
  },

  // MAGIC — arcane burst with shimmer
  sfxMagic() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    // Rising shimmer
    for (let i = 0; i < 5; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400 + i * 200, now + i * 0.06);
      osc.frequency.exponentialRampToValueAtTime(800 + i * 300, now + i * 0.06 + 0.3);
      g.gain.setValueAtTime(0, now);
      g.gain.setValueAtTime(0.12, now + i * 0.06);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.5);
      osc.connect(g); g.connect(this.sfxBus);
      osc.start(now); osc.stop(now + 0.8);
    }

    // Power burst
    const burst = this.ctx.createOscillator();
    const bG = this.ctx.createGain();
    const bF = this.ctx.createBiquadFilter();
    burst.type = 'sawtooth';
    burst.frequency.setValueAtTime(200, now + 0.25);
    burst.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
    bF.type = 'bandpass'; bF.frequency.value = 600; bF.Q.value = 3;
    bG.gain.setValueAtTime(0, now);
    bG.gain.linearRampToValueAtTime(0.25, now + 0.3);
    bG.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    burst.connect(bF); bF.connect(bG); bG.connect(this.sfxBus);
    burst.start(now); burst.stop(now + 0.8);

    // Deep boom
    const boom = this.ctx.createOscillator();
    const boG = this.ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(100, now + 0.35);
    boom.frequency.exponentialRampToValueAtTime(30, now + 0.7);
    boG.gain.setValueAtTime(0, now);
    boG.gain.setValueAtTime(0.35, now + 0.35);
    boG.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    boom.connect(boG); boG.connect(this.sfxBus);
    boom.start(now); boom.stop(now + 0.9);
  },

  // HEAL — warm ethereal chime
  sfxHeal() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    // Ascending chimes — major arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.12;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
      osc.connect(g); g.connect(this.sfxBus);
      osc.start(now); osc.stop(t + 1);
    });

    // Warm pad underneath
    const pad = this.ctx.createOscillator();
    const pG = this.ctx.createGain();
    const pF = this.ctx.createBiquadFilter();
    pad.type = 'triangle'; pad.frequency.value = 261.63;
    pF.type = 'lowpass'; pF.frequency.value = 800;
    pG.gain.setValueAtTime(0, now);
    pG.gain.linearRampToValueAtTime(0.1, now + 0.2);
    pG.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    pad.connect(pF); pF.connect(pG); pG.connect(this.sfxBus);
    pad.start(now); pad.stop(now + 1.5);
  },

  // DEFEND — shield resonance
  sfxDefend() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    // Low shield hum
    const hum = this.ctx.createOscillator();
    const hG = this.ctx.createGain();
    hum.type = 'square';
    hum.frequency.value = 80;
    hG.gain.setValueAtTime(0.2, now);
    hG.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    const hF = this.ctx.createBiquadFilter();
    hF.type = 'lowpass'; hF.frequency.value = 200;
    hum.connect(hF); hF.connect(hG); hG.connect(this.sfxBus);
    hum.start(now); hum.stop(now + 0.6);

    // Metal resonance ring
    const ring = this.ctx.createOscillator();
    const rG = this.ctx.createGain();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(600, now);
    ring.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    rG.gain.setValueAtTime(0.15, now);
    rG.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    ring.connect(rG); rG.connect(this.sfxBus);
    ring.start(now); ring.stop(now + 0.7);

    // Stone thud
    const thud = this.ctx.createOscillator();
    const tG = this.ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(200, now + 0.05);
    thud.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    tG.gain.setValueAtTime(0, now);
    tG.gain.setValueAtTime(0.25, now + 0.05);
    tG.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    thud.connect(tG); tG.connect(this.sfxBus);
    thud.start(now); thud.stop(now + 0.4);
  },

  // ENEMY ATTACK — brutal hit
  sfxEnemyHit() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    // Blunt impact
    const imp = this.ctx.createOscillator();
    const iG = this.ctx.createGain();
    imp.type = 'sine';
    imp.frequency.setValueAtTime(180, now);
    imp.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    iG.gain.setValueAtTime(0.35, now);
    iG.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    imp.connect(iG); iG.connect(this.sfxBus);
    imp.start(now); imp.stop(now + 0.35);

    // Crunch noise
    const bufSize = this.ctx.sampleRate * 0.2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = this.ctx.createBufferSource();
    noise.buffer = buf;
    const nF = this.ctx.createBiquadFilter();
    nF.type = 'bandpass'; nF.frequency.value = 1500; nF.Q.value = 1;
    const nG = this.ctx.createGain();
    nG.gain.setValueAtTime(0.2, now + 0.02);
    nG.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(nF); nF.connect(nG); nG.connect(this.sfxBus);
    noise.start(now); noise.stop(now + 0.2);
  },

  // LEVEL UP — triumphant fanfare
  sfxLevelUp() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    // Fanfare notes — D major ascending
    const fanfare = [293.66, 369.99, 440.00, 587.33, 440.00, 587.33, 739.99];
    fanfare.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = i < 4 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const t = now + i * 0.15;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.18, t);
      g.gain.setValueAtTime(0.18, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
      osc.connect(g); g.connect(this.sfxBus);
      osc.start(now); osc.stop(t + 0.8);
    });

    // Sparkle
    for (let i = 0; i < 8; i++) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1500 + Math.random() * 2000;
      const t = now + 0.5 + i * 0.08;
      g.gain.setValueAtTime(0, now);
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g); g.connect(this.sfxBus);
      osc.start(now); osc.stop(t + 0.4);
    }
  },

  // DEATH — dark descending doom
  sfxDeath() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;

    // Descending doom tone
    const doom = this.ctx.createOscillator();
    const dG = this.ctx.createGain();
    doom.type = 'sawtooth';
    doom.frequency.setValueAtTime(300, now);
    doom.frequency.exponentialRampToValueAtTime(40, now + 2);
    const dF = this.ctx.createBiquadFilter();
    dF.type = 'lowpass'; dF.frequency.value = 400;
    dG.gain.setValueAtTime(0.2, now);
    dG.gain.linearRampToValueAtTime(0, now + 2.5);
    doom.connect(dF); dF.connect(dG); dG.connect(this.sfxBus);
    doom.start(now); doom.stop(now + 3);

    // Heartbeat fading
    for (let i = 0; i < 4; i++) {
      const beat = this.ctx.createOscillator();
      const bG = this.ctx.createGain();
      beat.type = 'sine';
      beat.frequency.setValueAtTime(60, now + i * 0.6);
      beat.frequency.exponentialRampToValueAtTime(30, now + i * 0.6 + 0.15);
      bG.gain.setValueAtTime(0, now);
      bG.gain.setValueAtTime(0.3 - i * 0.07, now + i * 0.6);
      bG.gain.exponentialRampToValueAtTime(0.001, now + i * 0.6 + 0.25);
      beat.connect(bG); bG.connect(this.sfxBus);
      beat.start(now); beat.stop(now + i * 0.6 + 0.3);
    }

    // Reverb tail whisper
    const whsp = this.ctx.createOscillator();
    const wG = this.ctx.createGain();
    whsp.type = 'sine'; whsp.frequency.value = 220;
    wG.gain.setValueAtTime(0, now + 1);
    wG.gain.linearRampToValueAtTime(0.08, now + 1.5);
    wG.gain.exponentialRampToValueAtTime(0.001, now + 3);
    whsp.connect(wG); wG.connect(this.sfxBus);
    whsp.start(now); whsp.stop(now + 3.5);
  },

  // ENEMY DEFEATED — quick victory sting
  sfxEnemyDefeated() {
    this.init();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const now = this.ctx.currentTime;
    const notes = [329.63, 392.00, 523.25]; // E4 G4 C5
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      const t = now + i * 0.1;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.connect(g); g.connect(this.sfxBus);
      osc.start(now); osc.stop(t + 0.6);
    });
  },

  // ========== CONTROLS ==========
  stopAll() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(0, now + 0.5);
    }
    setTimeout(() => {
      this.stopNodes(this.nodes);
      this.stopNodes(this.battleNodes);
      this.playing = false;
      this.battlePlaying = false;
      this.currentMode = 'none';
    }, 600);
  },

  setVolume(v) { if (this.master) this.master.gain.value = v; },
  setSfxVolume(v) { if (this.sfxBus) this.sfxBus.gain.value = v; }
};

// Auto-start menu music on first click
let audioStarted = false;
document.addEventListener('click', () => {
  if (!audioStarted) {
    audioStarted = true;
    AudioEngine.startMenu();
  }
}, { once: false });
