/**
 * soundscape.js
 * Soft, synthesised haptic-style feedback (no audio files needed).
 * Every sound is short, low-volume and gentle — designed for late-night study.
 */
let ctx = null;
let enabled = true;

export function setSoundEnabled(v) {
  enabled = !!v;
}

function audio() {
  if (!enabled || typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, { start = 0, dur = 0.18, type = 'sine', gain = 0.05, glideTo } = {}) {
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + start;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sound = {
  tap: () => tone(660, { dur: 0.07, gain: 0.025 }),
  flip: () => tone(420, { dur: 0.16, gain: 0.03, glideTo: 620 }),
  success: () => {
    tone(523.25, { dur: 0.22, gain: 0.04 });
    tone(783.99, { start: 0.08, dur: 0.3, gain: 0.035 });
  },
  gentleError: () => tone(300, { dur: 0.2, gain: 0.03, type: 'triangle', glideTo: 240 }),
  complete: () => {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, { start: i * 0.09, dur: 0.4, gain: 0.035 }));
  },
};
