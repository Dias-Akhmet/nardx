// Web Audio API based sound system - skin-aware, no external deps.
export type SkinId = "pixel" | "wood" | "neon";

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.15,
  when = 0,
) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function noise(duration: number, gain = 0.2, when = 0, filterFreq = 1200) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + when;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * duration), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filt = c.createBiquadFilter();
  filt.type = "lowpass";
  filt.frequency.value = filterFreq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

export function playMove(skin: SkinId) {
  if (skin === "pixel") {
    tone(880, 0.08, "square", 0.12);
    tone(1320, 0.06, "square", 0.08, 0.05);
  } else if (skin === "wood") {
    noise(0.18, 0.35, 0, 600);
    tone(180, 0.1, "sine", 0.12);
  } else {
    tone(1400, 0.12, "sawtooth", 0.08);
    tone(700, 0.18, "triangle", 0.06, 0.02);
  }
}

export function playRoll(skin: SkinId) {
  if (skin === "pixel") {
    for (let i = 0; i < 4; i++) tone(440 + i * 220, 0.05, "square", 0.1, i * 0.05);
  } else if (skin === "wood") {
    noise(0.35, 0.4, 0, 1400);
    noise(0.2, 0.3, 0.1, 900);
  } else {
    tone(200, 0.25, "sawtooth", 0.1);
    tone(1800, 0.2, "sine", 0.06, 0.05);
  }
}

export function playBearOff(skin: SkinId) {
  if (skin === "pixel") {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.1, "square", 0.12, i * 0.08));
  } else if (skin === "wood") {
    tone(440, 0.2, "sine", 0.12);
    tone(660, 0.25, "sine", 0.1, 0.08);
  } else {
    tone(1200, 0.15, "sawtooth", 0.1);
    tone(1800, 0.2, "triangle", 0.08, 0.08);
  }
}

export function playWin(skin: SkinId) {
  const notes = skin === "pixel" ? [523, 659, 784, 1047, 1319] : [392, 523, 659, 784, 1047];
  const wave: OscillatorType = skin === "pixel" ? "square" : skin === "neon" ? "sawtooth" : "triangle";
  notes.forEach((f, i) => tone(f, 0.2, wave, 0.12, i * 0.12));
}

export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}
