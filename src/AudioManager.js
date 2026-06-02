import { assetUrl } from './assets.js';

const SOUND_BASE = assetUrl('assets/sounds');

/**
 * Arcade audio: prefers MP3 files when present, otherwise Web Audio synthesis.
 */
export class AudioManager {
  constructor() {
    this.isInitialized = false;
    this.useFiles = false;

    /** @type {HTMLAudioElement | null} */
    this.bgm = null;
    /** @type {HTMLAudioElement | null} */
    this.clawSFX = null;
    /** @type {HTMLAudioElement | null} */
    this.grabSFX = null;
    /** @type {HTMLAudioElement | null} */
    this.revealSFX = null;

    /** @type {AudioContext | null} */
    this.ctx = null;
    this._bgmNodes = null;
    this._whirNodes = null;
    this._bgmPausedForReveal = false;
  }

  async loadFiles() {
    const [bgm, claw, grab, reveal] = await Promise.all([
      this.tryLoad(`${SOUND_BASE}/background_music.mp3`, true),
      this.tryLoad(`${SOUND_BASE}/pulley_whir.mp3`, true),
      this.tryLoad(`${SOUND_BASE}/crystal_ding.mp3`, false),
      this.tryLoad(`${SOUND_BASE}/proposal_fanfare.mp3`, false),
    ]);

    if (bgm && claw && grab && reveal) {
      this.bgm = bgm;
      this.bgm.volume = 0.4;
      this.clawSFX = claw;
      this.clawSFX.volume = 0.5;
      this.grabSFX = grab;
      this.grabSFX.volume = 0.65;
      this.revealSFX = reveal;
      this.revealSFX.volume = 0.75;
      this.useFiles = true;
    }
  }

  /** @returns {Promise<HTMLAudioElement | null>} */
  tryLoad(src, loop) {
    return new Promise((resolve) => {
      const audio = new Audio(src);
      audio.loop = loop;
      audio.preload = 'auto';
      const done = (ok) => resolve(ok ? audio : null);
      audio.addEventListener('canplaythrough', () => done(true), { once: true });
      audio.addEventListener('error', () => done(false), { once: true });
      setTimeout(() => done(false), 2500);
    });
  }

  ensureContext() {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  init() {
    if (this.isInitialized) return;
    this.ensureContext();

    if (this.useFiles && this.bgm) {
      this.bgm.play().catch(() => {});
    } else {
      this.startProceduralBgm();
    }

    this.isInitialized = true;
  }

  playLaunch() {
    if (!this.isInitialized) return;
    if (this.useFiles && this.clawSFX) {
      this.clawSFX.currentTime = 0;
      this.clawSFX.play().catch(() => {});
      return;
    }
    this.startProceduralWhir();
  }

  stopLaunch() {
    if (this.useFiles && this.clawSFX) {
      this.clawSFX.pause();
      this.clawSFX.currentTime = 0;
      return;
    }
    this.stopProceduralWhir();
  }

  playReady() {
    if (!this.isInitialized) return;
    if (this.useFiles) {
      return;
    }
    this.playProceduralReady();
  }

  playGrab() {
    if (!this.isInitialized) return;
    if (this.useFiles && this.grabSFX) {
      this.grabSFX.currentTime = 0;
      this.grabSFX.play().catch(() => {});
      return;
    }
    this.playProceduralGrab();
  }

  playReveal() {
    if (!this.isInitialized) return;
    this.stopLaunch();

    if (this.useFiles) {
      if (this.bgm) {
        this.bgm.pause();
        this._bgmPausedForReveal = true;
      }
      if (this.revealSFX) {
        this.revealSFX.currentTime = 0;
        this.revealSFX.play().catch(() => {});
      }
      return;
    }

    this._bgmPausedForReveal = true;
    this.stopProceduralBgm();
    this.playProceduralReveal();
  }

  resumeBgm() {
    if (!this.isInitialized || !this._bgmPausedForReveal) return;
    this._bgmPausedForReveal = false;

    if (this.useFiles && this.bgm) {
      this.bgm.play().catch(() => {});
      return;
    }
    this.startProceduralBgm();
  }

  startProceduralBgm() {
    const ctx = this.ensureContext();
    if (this._bgmNodes) return;

    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    gain.connect(ctx.destination);

    const notes = [261.63, 329.63, 392.0, 523.25];
    const oscillators = [];
    let step = 0;

    const playStep = () => {
      if (!this._bgmNodes) return;
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = notes[step % notes.length];
      noteGain.gain.setValueAtTime(0.12, ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(noteGain);
      noteGain.connect(gain);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
      step++;
      this._bgmNodes.timer = setTimeout(playStep, 380);
    };

    playStep();
    this._bgmNodes = { gain, oscillators, timer: null };
  }

  stopProceduralBgm() {
    if (!this._bgmNodes) return;
    clearTimeout(this._bgmNodes.timer);
    this._bgmNodes.gain.disconnect();
    this._bgmNodes = null;
  }

  startProceduralWhir() {
    const ctx = this.ensureContext();
    if (this._whirNodes) return;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 95;
    lfo.type = 'sine';
    lfo.frequency.value = 6;
    lfoGain.gain.value = 28;
    gain.gain.value = 0.04;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    lfo.start();

    this._whirNodes = { osc, lfo, gain };
  }

  stopProceduralWhir() {
    if (!this._whirNodes) return;
    const { osc, lfo, gain } = this._whirNodes;
    try {
      osc.stop();
      lfo.stop();
      gain.disconnect();
    } catch {
      /* already stopped */
    }
    this._whirNodes = null;
  }

  playProceduralReady() {
    const ctx = this.ensureContext();
    [660, 880, 1108].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.1;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  playProceduralGrab() {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  playProceduralReveal() {
    const ctx = this.ensureContext();
    const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    fanfare.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + i * 0.12;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.2, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
}
