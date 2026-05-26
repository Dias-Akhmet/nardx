// Web Audio API based sound system - skin-aware, no external deps.
export type SkinId = "pixel" | "wood" | "minimal" | "neon" | "marble";

let ctx: AudioContext | null = null;
// Music-only mute. SFX (clicks, moves, dice, bear off) always remain audible.
let musicMuted = false;
let musicNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let musicTimer: number | null = null;

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

export function setMuted(m: boolean) {
  musicMuted = m;
  if (m) stopMusic();
}
export function isMuted() {
  return musicMuted;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  gain = 0.15,
  when = 0,
) {
  // SFX always play — only background music respects the mute toggle.

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
  // SFX always plays
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

// Map any skin to a sound family
type SoundFamily = "chip" | "wood" | "synth";
function family(skin: SkinId): SoundFamily {
  if (skin === "pixel") return "chip";
  if (skin === "neon") return "synth";
  return "wood";
}

export function playMove(skin: SkinId) {
  const f = family(skin);
  if (f === "chip") {
    tone(880, 0.08, "square", 0.12);
    tone(1320, 0.06, "square", 0.08, 0.05);
  } else if (f === "wood") {
    noise(0.18, 0.3, 0, 600);
    tone(180, 0.1, "sine", 0.12);
  } else {
    tone(1400, 0.12, "sawtooth", 0.08);
    tone(700, 0.18, "triangle", 0.06, 0.02);
  }
}

export function playRoll(skin: SkinId) {
  const f = family(skin);
  if (f === "chip") {
    for (let i = 0; i < 4; i++) tone(440 + i * 220, 0.05, "square", 0.1, i * 0.05);
  } else if (f === "wood") {
    noise(0.35, 0.4, 0, 1400);
    noise(0.2, 0.3, 0.1, 900);
  } else {
    tone(200, 0.25, "sawtooth", 0.1);
    tone(1800, 0.2, "sine", 0.06, 0.05);
  }
}

export function playBearOff(skin: SkinId) {
  const f = family(skin);
  if (f === "chip") {
    [523, 659, 784, 1047].forEach((fr, i) => tone(fr, 0.1, "square", 0.12, i * 0.08));
  } else if (f === "wood") {
    tone(440, 0.2, "sine", 0.12);
    tone(660, 0.25, "sine", 0.1, 0.08);
  } else {
    tone(1200, 0.15, "sawtooth", 0.1);
    tone(1800, 0.2, "triangle", 0.08, 0.08);
  }
}

export function playWin(skin: SkinId) {
  const f = family(skin);
  const notes = f === "chip" ? [523, 659, 784, 1047, 1319] : [392, 523, 659, 784, 1047];
  const wave: OscillatorType = f === "chip" ? "square" : f === "synth" ? "sawtooth" : "triangle";
  notes.forEach((fr, i) => tone(fr, 0.2, wave, 0.12, i * 0.12));
}

// Crisp pleasant UI click
export function playClick() {
  // SFX always plays
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(1800, t0);
  osc.frequency.exponentialRampToValueAtTime(900, t0 + 0.05);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(0.08, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + 0.1);
}

export function resumeAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume().catch(() => {});
}

// --- Ambient lo-fi background music (generative pad) ---
const CHORDS = [
  [220.0, 277.18, 329.63], // A minor
  [196.0, 246.94, 293.66], // G major
  [174.61, 220.0, 261.63], // F major
  [164.81, 207.65, 246.94], // E minor
];
let chordIdx = 0;

function playChord() {
  const c = getCtx();
  if (!c || musicMuted) return;
  // stop previous
  musicNodes.forEach((n) => {
    try { n.osc.stop(); } catch { /* ignore */ }
  });
  musicNodes = [];
  const t0 = c.currentTime;
  const notes = CHORDS[chordIdx % CHORDS.length];
  chordIdx++;
  for (const f of notes) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(f, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.025, t0 + 1.2);
    g.gain.linearRampToValueAtTime(0.018, t0 + 3.5);
    g.gain.linearRampToValueAtTime(0.0, t0 + 4.2);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + 4.3);
    musicNodes.push({ osc, gain: g });
  }
}

export function startMusic() {
  // SFX always plays
  resumeAudio();
  if (musicTimer != null) return;
  playChord();
  musicTimer = window.setInterval(playChord, 4000);
}

export function stopMusic() {
  if (musicTimer != null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
  musicNodes.forEach((n) => {
    try { n.osc.stop(); } catch { /* ignore */ }
  });
  musicNodes = [];
}
