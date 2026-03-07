// === DARK FANTASY AMBIENT SOUNDTRACK — Procedural Web Audio ===
const AudioEngine = {
  ctx: null,
  master: null,
  playing: false,
  nodes: [],

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.35;
    this.master.connect(this.ctx.destination);
  },

  // Deep drone pad
  createDrone(freq, detune, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    osc.detune.value = detune;
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 2;
    gain.gain.value = vol;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start();
    // Slow LFO on filter
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05 + Math.random() * 0.08;
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.nodes.push(osc, lfo);
    return { osc, gain, filter };
  },

  // Ethereal bell-like tone
  createBell(freq, delay) {
    const play = () => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sine';
      osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.02);
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 8;
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 4.5);
    };
    const loop = () => {
      if (!this.playing) return;
      play();
      const next = delay + Math.random() * delay * 1.5;
      setTimeout(loop, next * 1000);
    };
    setTimeout(loop, delay * 1000 * Math.random());
  },

  // Dark choir whisper pad
  createChoir(freq, vol) {
    const real = new Float32Array([0, 0, 0.4, 0, 0.2, 0, 0.1, 0, 0.05]);
    const imag = new Float32Array(real.length);
    const wave = this.ctx.createPeriodicWave(real, imag);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.setPeriodicWave(wave);
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 1;
    gain.gain.value = vol;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    osc.start();
    // Slow breathe
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.03;
    lfoG.gain.value = vol * 0.5;
    lfo.connect(lfoG);
    lfoG.connect(gain.gain);
    lfo.start();
    this.nodes.push(osc, lfo);
  },

  // Wind-like noise
  createWind(vol) {
    const bufSize = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 300;
    filter.Q.value = 0.5;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start();
    // Modulate wind
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07;
    lfoG.gain.value = 200;
    lfo.connect(lfoG);
    lfoG.connect(filter.frequency);
    lfo.start();
    this.nodes.push(src, lfo);
  },

  // Sparse minor arpeggio melody
  createMelody() {
    // D minor pentatonic in low octave
    const notes = [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23];
    const play = () => {
      if (!this.playing) return;
      const freq = notes[Math.floor(Math.random() * notes.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 3);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 3.5);
      const next = 2 + Math.random() * 5;
      setTimeout(play, next * 1000);
    };
    setTimeout(play, 2000);
  },

  startMenu() {
    this.init();
    if (this.playing) return;
    this.playing = true;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Drones — D minor foundation
    this.createDrone(73.42, 0, 0.12);     // D2
    this.createDrone(73.42, -8, 0.08);    // D2 detuned
    this.createDrone(110.00, 5, 0.06);    // A2
    this.createDrone(55.00, 0, 0.10);     // A1 sub

    // Choir pads
    this.createChoir(146.83, 0.04);  // D3
    this.createChoir(174.61, 0.03);  // F3

    // Wind
    this.createWind(0.05);

    // Ethereal bells
    this.createBell(587.33, 6);   // D5
    this.createBell(698.46, 8);   // F5
    this.createBell(880.00, 10);  // A5
    this.createBell(523.25, 12);  // C5

    // Sparse melody
    this.createMelody();

    // Fade in
    this.master.gain.setValueAtTime(0, this.ctx.currentTime);
    this.master.gain.linearRampToValueAtTime(0.35, this.ctx.currentTime + 3);
  },

  stopMenu() {
    if (!this.playing || !this.ctx) return;
    this.playing = false;
    const now = this.ctx.currentTime;
    this.master.gain.linearRampToValueAtTime(0, now + 2);
    setTimeout(() => {
      this.nodes.forEach(n => { try { n.stop(); } catch(e){} });
      this.nodes = [];
    }, 2500);
  },

  setVolume(v) {
    if (this.master) this.master.gain.value = v;
  }
};

// Auto-start on first user interaction
let audioStarted = false;
document.addEventListener('click', () => {
  if (!audioStarted) {
    audioStarted = true;
    AudioEngine.startMenu();
  }
}, { once: false });
