"use client";

let sharedAudioCtx = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playWaterAndChimeSound(isMuted = false) {
  if (isMuted || typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Water droplet series (bubbly frequency sweeps)
    const dropTimes = [0, 0.14, 0.27, 0.42, 0.56, 0.72, 0.88];
    dropTimes.forEach((offset, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      const baseFreq = 420 + (idx % 3) * 95 + Math.random() * 50;
      osc.frequency.setValueAtTime(baseFreq, now + offset);
      osc.frequency.exponentialRampToValueAtTime(
        baseFreq * 2.15,
        now + offset + 0.085
      );

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.11, now + offset + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + offset + 0.095);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });

    // 2. Gentle wind chime pentatonic notes (C5, E5, G5, A5, C6)
    const chimeNotes = [523.25, 659.25, 783.99, 880.0, 1046.5];
    chimeNotes.forEach((freq, idx) => {
      const start = now + 0.45 + idx * 0.14;
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      harmonic.type = "triangle";

      osc.frequency.setValueAtTime(freq, start);
      harmonic.frequency.setValueAtTime(freq * 2, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.08, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0005, start + 1.35);

      osc.connect(gain);
      harmonic.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      harmonic.start(start);
      osc.stop(start + 1.4);
      harmonic.stop(start + 1.4);
    });
  } catch {
    // Ignore audio play restrictions
  }
}

export function playScrollSound(isMuted = false) {
  if (isMuted || typeof window === "undefined") return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880.0];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.7);
    });
  } catch {
    // Ignore audio play restrictions
  }
}

