// Original, generated ambient audio, not a recording, so there is nothing
// to license. Two small procedural loops, one per theme: a synth pad with
// a plucked arpeggio for MyPark, a walking-bass-plus-groove for Showtime.
// Mutually exclusive with the film's own audio, see BreakdownPlayer.
//
// On by default, but browsers (iOS Safari especially) block audio until a
// real user gesture happens, and even then iOS often hands back a
// *suspended* AudioContext that needs an explicit resume(). armAutoStart
// wires a one-time listener for the page's first tap/click/key to start it,
// and startSoundtrack always resumes the context if it comes back
// suspended, which is what was silently failing on mobile.

export type ThemeName = "modern" | "classic";

const PREF_KEY = "playbook-soundtrack-enabled";

let ctx: AudioContext | null = null;
let schedulerTimer: number | null = null;
let playingState = false;
let listeners: Array<(playing: boolean) => void> = [];
let autoStartArmed = false;

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

export function getSoundtrackPreference(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(PREF_KEY) !== "off";
}

function setSoundtrackPreference(enabled: boolean) {
  window.localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
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
  lfo.frequency.value = 0.09;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 380;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();

  // A minor7 chord (A2, C3, E3, G3), slightly detuned pairs for width.
  const freqs = [110, 130.81, 164.81, 196.0];
  freqs.forEach((f, i) => {
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(0.055, audioCtx.currentTime + i * 0.4, 2.5);
    gain.connect(filter);

    for (const detune of [1, 1.004]) {
      const osc = audioCtx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f * detune;
      osc.connect(gain);
      osc.start();
    }
  });

  // A soft plucked arpeggio cycling the same chord tones an octave up,
  // panned back and forth, the "vamp" on top of the sustained pad.
  const arpFreqs = freqs.map((f) => f * 2);
  const stepDur = 0.55;
  let arpStep = 0;
  let nextArpTime = audioCtx.currentTime + 1;

  function scheduleArp(time: number, freq: number, pan: number) {
    const osc = audioCtx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.05, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0005, time + stepDur * 0.85);
    const panner = audioCtx.createStereoPanner();
    panner.pan.value = pan;
    osc.connect(g);
    g.connect(panner);
    panner.connect(filter);
    osc.start(time);
    osc.stop(time + stepDur);
  }

  function arpScheduler() {
    while (nextArpTime < audioCtx.currentTime + 0.2) {
      const freq = arpFreqs[arpStep % arpFreqs.length];
      const pan = arpStep % 2 === 0 ? -0.3 : 0.3;
      scheduleArp(nextArpTime, freq, pan);
      nextArpTime += stepDur;
      arpStep++;
    }
  }
  schedulerTimer = window.setInterval(arpScheduler, 50);
}

function startClassicGroove(audioCtx: AudioContext, master: GainNode) {
  const bpm = 98;
  const beatDur = 60 / bpm;
  const bassPattern = [55, 55, 82.41, 65.41, 55, 61.74, 82.41, 73.42];
  let nextNoteTime = audioCtx.currentTime + 0.1;
  let step = 0;

  const padFreqs = [220, 277.18, 329.63];
  const padGain = audioCtx.createGain();
  padGain.gain.value = 0.03;
  padGain.connect(master);
  for (const f of padFreqs) {
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
    g.gain.linearRampToValueAtTime(0.15, time + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, time + beatDur * 0.85);
    osc.connect(g);
    g.connect(master);
    osc.start(time);
    osc.stop(time + beatDur);
  }

  function scheduleNoiseHit(time: number, freqLow: number, gainPeak: number, decay: number) {
    const bufferSize = Math.floor(audioCtx.sampleRate * decay);
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const hp = audioCtx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = freqLow;
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(gainPeak, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + decay);
    noise.connect(hp);
    hp.connect(g);
    g.connect(master);
    noise.start(time);
  }

  // A short, warm off-beat "skank" stab on the pad chord, the rhythmic
  // upstroke that gives the groove its lift.
  function scheduleStab(time: number) {
    const g = audioCtx.createGain();
    g.gain.setValueAtTime(0, time);
    g.gain.linearRampToValueAtTime(0.045, time + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, time + beatDur * 0.4);
    g.connect(master);
    for (const f of padFreqs) {
      const osc = audioCtx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = f;
      osc.connect(g);
      osc.start(time);
      osc.stop(time + beatDur * 0.4);
    }
  }

  function scheduler() {
    while (nextNoteTime < audioCtx.currentTime + 0.2) {
      const beatInBar = step % 4;
      scheduleBass(nextNoteTime, bassPattern[step % bassPattern.length]);
      scheduleNoiseHit(nextNoteTime, 6000, 0.03, 0.05); // hat, on the beat
      scheduleNoiseHit(nextNoteTime + beatDur / 2, 6000, 0.025, 0.05); // hat, the "and"
      scheduleStab(nextNoteTime + beatDur / 2); // off-beat skank
      if (beatInBar === 1 || beatInBar === 3) {
        scheduleNoiseHit(nextNoteTime, 1800, 0.05, 0.09); // backbeat clap on 2 and 4
      }
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

  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }

  const master = audioCtx.createGain();
  master.gain.value = 0.55;
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
    setSoundtrackPreference(false);
  } else {
    startSoundtrack(theme);
    setSoundtrackPreference(true);
  }
}

// Arms a one-time listener on the page's first tap/click/keypress to start
// the soundtrack, since no browser allows audio to play before a real user
// gesture. getTheme is a getter (not a value) so it always reads whatever
// theme is active at the moment the user actually interacts.
export function armAutoStart(getTheme: () => ThemeName) {
  if (autoStartArmed || typeof window === "undefined") return;
  if (!getSoundtrackPreference()) return;
  autoStartArmed = true;

  const start = () => {
    window.removeEventListener("pointerdown", start);
    window.removeEventListener("keydown", start);
    if (!playingState && getSoundtrackPreference()) {
      startSoundtrack(getTheme());
    }
  };
  window.addEventListener("pointerdown", start, { once: true });
  window.addEventListener("keydown", start, { once: true });
}
