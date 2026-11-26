// Sky Courier — tiny WebAudio synth: engine hum, chimes, thuds.
// One clear job: all sound, made from oscillators, no audio files.

export function createAudio() {
  return {
    ctx: null,
    muted: false,
    engineNodes: null,
    enabled: false,
  };
}

export function ensureAudio(audio) {
  if (audio.ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    audio.ctx = new AC();
    audio.enabled = true;
  } catch (err) {
    audio.enabled = false;
  }
}

export function unlockAudio(audio) {
  ensureAudio(audio);
  if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
}

function tone(audio, freq, dur, type, gain, when) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime + (when || 0);
  const osc = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain || 0.12, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(audio.ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playRingChime(audio) {
  tone(audio, 660, 0.18, 'sine', 0.14);
  tone(audio, 880, 0.22, 'sine', 0.14, 0.08);
  tone(audio, 1320, 0.3, 'sine', 0.1, 0.16);
}

export function playStarPing(audio) {
  tone(audio, 1180, 0.12, 'triangle', 0.1);
  tone(audio, 1560, 0.14, 'triangle', 0.08, 0.05);
}

export function playFuelGulp(audio) {
  tone(audio, 320, 0.12, 'square', 0.06);
  tone(audio, 480, 0.16, 'square', 0.06, 0.09);
}

export function playCrashThud(audio) {
  if (!audio.ctx || audio.muted) return;
  const t0 = audio.ctx.currentTime;
  const osc = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(160, t0);
  osc.frequency.exponentialRampToValueAtTime(40, t0 + 0.5);
  g.gain.setValueAtTime(0.22, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
  osc.connect(g);
  g.connect(audio.ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.6);
}

export function playLandFanfare(audio) {
  const notes = [523, 659, 784, 1046];
  notes.forEach((n, i) => tone(audio, n, 0.25, 'triangle', 0.12, i * 0.12));
}

export function startEngine(audio) {
  if (!audio.ctx || audio.engineNodes) return;
  const osc = audio.ctx.createOscillator();
  const g = audio.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.value = 68;
  g.gain.value = 0.0;
  const filter = audio.ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 320;
  osc.connect(filter);
  filter.connect(g);
  g.connect(audio.ctx.destination);
  osc.start();
  audio.engineNodes = { osc, gain: g };
}

export function setEngine(audio, throttle, speedNorm, on) {
  if (!audio.engineNodes || audio.muted) return;
  const target = on ? 0.02 + throttle * 0.035 + speedNorm * 0.02 : 0;
  audio.engineNodes.gain.gain.setTargetAtTime(target, audio.ctx.currentTime, 0.1);
  audio.engineNodes.osc.frequency.setTargetAtTime(58 + throttle * 46 + speedNorm * 30, audio.ctx.currentTime, 0.1);
}

export function toggleMute(audio) {
  audio.muted = !audio.muted;
  if (audio.engineNodes) audio.engineNodes.gain.gain.value = 0;
  return audio.muted;
}
