/**
 * AudioEffects.js
 * Procedural Web Audio API sound generator.
 * Zero external audio assets required; synthesized directly in the browser.
 */

export class AudioEffects {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    
    // Check saved mute preference
    try {
      const savedMute = localStorage.getItem('learnplay_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
    } catch (e) {
      console.warn('Audio preference error:', e);
    }
  }

  _initContext() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('learnplay_audio_muted', this.isMuted);
    } catch (e) {}
    return this.isMuted;
  }

  /**
   * Harmonious ascending chime on correct answer
   */
  playCorrect() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const notes = [659.25, 830.61, 987.77, 1318.51]; // E5, G#5, B5, E6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.36);
    });
  }

  /**
   * Gentle, non-punishing low wobble on wrong answer
   */
  playWrong() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now); // A3
    osc.frequency.exponentialRampToValueAtTime(146.83, now + 0.28); // D3

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.33);
  }

  /**
   * Quick sparkling coin / XP collection sound
   */
  playXpGain() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, now); // C6
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.12); // G6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.21);
  }

  /**
   * Triumphant brass chord on Level Up / Rank Elevation
   */
  playLevelUp() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const chord = [523.25, 659.25, 783.99, 1046.50]; // C5 major
    const now = this.ctx.currentTime;

    chord.forEach((freq) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  /**
   * Whoosh and impact sound for streak multiplier
   */
  playStreak() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  /**
   * Boss Battle impact hit sound
   */
  playBossHit() {
    if (this.isMuted) return;
    this._initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.22);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.29);
  }
}
