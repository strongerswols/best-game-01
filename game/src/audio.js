// All sound is synthesized with WebAudio — no audio files, no network.
// The context is created lazily on the first user gesture (browsers block
// audio before interaction), and every effect is a short oscillator burst.
export function createSoundBank() {
  let context = null;
  let muted = false;

  function ensureContext() {
    if (context) return context;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      context = new AudioContextClass();
    } catch {
      context = null;
    }
    return context;
  }

  function tone({ frequency, endFrequency, duration, type, volume, delay = 0 }) {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx || ctx.state === 'suspended') {
      if (ctx) ctx.resume().catch(() => {});
      return;
    }
    const startAt = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    if (endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), startAt + duration);
    }
    gain.gain.setValueAtTime(volume, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  return {
    unlock() {
      ensureContext();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    shoot(kind) {
      if (kind === 'mortar') tone({ frequency: 180, endFrequency: 70, duration: 0.16, type: 'triangle', volume: 0.10 });
      else if (kind === 'storm') tone({ frequency: 1200, endFrequency: 300, duration: 0.08, type: 'sawtooth', volume: 0.05 });
      else if (kind === 'frost') tone({ frequency: 900, endFrequency: 1400, duration: 0.09, type: 'sine', volume: 0.06 });
      else tone({ frequency: 640, endFrequency: 420, duration: 0.06, type: 'square', volume: 0.04 });
    },
    hit() {
      tone({ frequency: 220, endFrequency: 140, duration: 0.05, type: 'triangle', volume: 0.04 });
    },
    coin() {
      tone({ frequency: 880, duration: 0.07, type: 'sine', volume: 0.07 });
      tone({ frequency: 1320, duration: 0.1, type: 'sine', volume: 0.06, delay: 0.06 });
    },
    place() {
      tone({ frequency: 320, endFrequency: 180, duration: 0.12, type: 'triangle', volume: 0.12 });
      tone({ frequency: 520, duration: 0.08, type: 'sine', volume: 0.08, delay: 0.05 });
    },
    upgrade() {
      [523, 659, 784].forEach((frequency, i) => {
        tone({ frequency, duration: 0.1, type: 'sine', volume: 0.08, delay: i * 0.07 });
      });
    },
    sell() {
      tone({ frequency: 700, endFrequency: 350, duration: 0.12, type: 'sine', volume: 0.07 });
    },
    leak() {
      tone({ frequency: 140, endFrequency: 60, duration: 0.35, type: 'sawtooth', volume: 0.14 });
    },
    waveHorn() {
      tone({ frequency: 220, endFrequency: 330, duration: 0.35, type: 'sawtooth', volume: 0.08 });
      tone({ frequency: 330, endFrequency: 440, duration: 0.3, type: 'sawtooth', volume: 0.06, delay: 0.18 });
    },
    win() {
      [523, 659, 784, 1047].forEach((frequency, i) => {
        tone({ frequency, duration: 0.22, type: 'triangle', volume: 0.1, delay: i * 0.12 });
      });
    },
    lose() {
      [392, 330, 262, 196].forEach((frequency, i) => {
        tone({ frequency, duration: 0.25, type: 'triangle', volume: 0.1, delay: i * 0.14 });
      });
    },
  };
}
