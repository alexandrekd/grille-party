/**
 * Small synthesized sound-effect stings — no external audio files (nothing to
 * source/license in this environment), everything is generated on the fly with
 * the Web Audio API. Reads as a chiptune/8-bit sting rather than a real crowd
 * recording, which fits the game's visual style well enough and fills the
 * "blanc" between rounds that pure silence left otherwise.
 *
 * Plays only on the host (the TV) — the shared speaker everyone's already
 * listening to for the music, same reasoning as why Spotify playback lives here
 * and not on every phone. Subject to the same browser autoplay restriction as
 * Spotify: nothing plays until there's been at least one real user gesture
 * somewhere on the page (e.g. tapping "Connecter Spotify").
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  c: AudioContext,
  opts: { freq: number; start: number; duration: number; type?: OscillatorType; gain?: number; glideTo?: number },
): void {
  const { freq, start, duration, type = "sine", gain = 0.2, glideTo } = opts;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + duration);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(gain, start + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** A short burst of filtered white noise — the base texture for both "applause"
 * (bright/high) and "crowd ohh" (low/murmuring), just with different filter
 * settings. */
function noiseBurst(
  c: AudioContext,
  opts: { start: number; duration: number; gainPeak: number; filterFreq: number; filterQ: number },
): void {
  const { start, duration, gainPeak, filterFreq, filterQ } = opts;
  const bufferSize = Math.max(1, Math.floor(c.sampleRate * duration));
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = filterQ;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, start);
  g.gain.linearRampToValueAtTime(gainPeak, start + duration * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  src.connect(filter).connect(g).connect(c.destination);
  src.start(start);
  src.stop(start + duration + 0.05);
}

/** A round resolved and most non-owner voters found the culprit. */
export function playApplause(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  noiseBurst(c, { start: t, duration: 1.3, gainPeak: 0.2, filterFreq: 2800, filterQ: 0.6 });
  for (let i = 0; i < 12; i++) {
    tone(c, { freq: 2800 + Math.random() * 1800, start: t + Math.random() * 1.0, duration: 0.035, type: "square", gain: 0.045 });
  }
  [523.25, 659.25, 783.99].forEach((f, i) => tone(c, { freq: f, start: t + i * 0.09, duration: 0.24, type: "triangle", gain: 0.14 }));
}

/** A round resolved and the owner bluffed almost everyone. */
export function playCrowdOhh(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  noiseBurst(c, { start: t, duration: 1.0, gainPeak: 0.15, filterFreq: 420, filterQ: 0.9 });
  tone(c, { freq: 196, start: t, duration: 0.9, type: "sine", gain: 0.1, glideTo: 140 });
  tone(c, { freq: 233.08, start: t + 0.05, duration: 0.9, type: "sine", gain: 0.07, glideTo: 165 });
}

/** Entering the leaderboard between rounds. */
export function playLeaderboardJingle(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  [392, 523.25, 659.25].forEach((f, i) => tone(c, { freq: f, start: t + i * 0.1, duration: 0.2, type: "square", gain: 0.11 }));
}

/** The game just ended — final standings. */
export function playVictoryFanfare(): void {
  const c = getCtx();
  if (!c) return;
  const t = c.currentTime;
  const notes: [number, number, number][] = [
    [523.25, 0, 0.15],
    [523.25, 0.16, 0.15],
    [523.25, 0.32, 0.15],
    [659.25, 0.5, 0.17],
    [783.99, 0.68, 0.17],
    [1046.5, 0.92, 0.55],
  ];
  for (const [freq, offset, duration] of notes) {
    tone(c, { freq, start: t + offset, duration, type: "triangle", gain: 0.19 });
  }
  noiseBurst(c, { start: t + 0.92, duration: 1.5, gainPeak: 0.16, filterFreq: 2600, filterQ: 0.5 });
}
