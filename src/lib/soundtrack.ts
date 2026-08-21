// Original, generated ambient audio, not a recording, so there is nothing
// to license. Two small procedural loops, one per theme: a slow synth pad
// for MyPark, a laid-back walking-bass-plus-shaker groove for Showtime.
// Mutually exclusive with the film's own audio, see BreakdownPlayer.

export type ThemeName = "modern" | "classic";

let ctx: AudioContext | null = null;
let schedulerTimer: number | null = null;
let playingState = false;
let listeners: Array<(playing: boolean) => void> = [];

function notify() {
  for (const l of listeners) l(playingState);
}

export function onSoundtrackChange(cb: (playing: boolean) => void) {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

export function isSoundtrackPlaying() {
  return playingState;
}

export function stopSoundtrack() {
  if (schedulerTimer !== null) {
    window.clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
  if (ctx) {
    void ctx.close();
    ctx = null;
  }
  if (playingState) {
    playingState = false;
    notify();
  }
}

function startModernPad(audioCtx: AudioContext, master: GainNode) {
  const filter = audioCtx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 700;
  filter.Q.value = 0.6;
  filter.connect(master);

  const lfo = audioCtx.createOscillator();
  lfo.frequency.value = 0.06;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 250;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  // A minor7 chord (A2, C3, E3, G3), slightly detuned pairs for width.
  const freqs = [110, 130.81, 164.81, 196.0];
  freqs.forEach((f, i) => {
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.05, audioCtx.currentTime + i * 0.4, 2.5);
    gain.connect(filter);

    for (const detune of [1, 1.004]) {
      const osc = audioCtx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f * detune;
      osc.connect(gain);
      osc.start();
    }
  });
}

function startClassicGroove(audioCtx: AudioContext, master: GainNode) {
  const bpm = 92;
  const beatDur = 60 / bpm;
  const bassPattern = [55, 55, 82.41, 65.41];
  let nextNoteTime = audioCtx.currentTime + 0.1;
  let step = 0;

  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.035;
  padGain.connect(master);
  for (const f of [220, 277.18, 329.63]) {
    const osc = audioCtx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    osc.connect(padGain);
    osc.start();
  }

  function scheduleBass(time: number, freq: number) {
    const osc = audioCtx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.14, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + beatDur * 0.9);
    osc.connect(g);
    g.connect(master);
    osc.start(time);
    osc.stop(time + beatDur);
  }

  function scheduleHat(time: number) {
    const bufferSize = Math.floor(audioCtx.sampleRate * 0.05);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const hp = audioCtx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 6000;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0.03, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
    noise.connect(hp);
    hp.connect(g);
    g.connect(master);
    noise.start(time);
  }

  function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + 0.2) {
      scheduleBass(nextNoteTime, bassPattern[step % bassPattern.length]);
      scheduleHat(nextNoteTime);
      scheduleHat(nextNoteTime + beatDur / 2);
      nextNoteTime += beatDur;
      step++;
    }
  }
  schedulerTimer = window.setInterval(scheduler, 50);
}

export function startSoundtrack(theme: ThemeName) {
  stopSoundtrack();

  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const audioCtx = new AudioContextCtor();
  ctx = audioCtx;

  const master = audioCtx.createGain();
  master.gain.value = 0.5;
  master.connect(audioCtx.destination);

  if (theme === "modern") {
    startModernPad(audioCtx, master);
  } else {
    startClassicGroove(audioCtx, master);
  }

  playingState = true;
  notify();
}

export function toggleSoundtrack(theme: ThemeName) {
  if (playingState) {
    stopSoundtrack();
  } else {
    startSoundtrack(theme);
  }
}
