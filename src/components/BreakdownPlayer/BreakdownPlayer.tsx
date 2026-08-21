import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Beat, Clip } from "../../types";
import { useYouTubePlayer } from "./useYouTubePlayer";
import { onSoundtrackChange, stopSoundtrack } from "../../lib/soundtrack";

// How long a beat's caption/overlay stays on screen before clearing itself,
// unless it explicitly sets its own resume_after (a number), or explicitly
// opts out of auto-clearing with resume_after: null (a genuine "wait for
// the viewer" moment, only meaningful for a "pause" beat's manual Continue
// button). Without a default, a beat that forgets to set resume_after
// would sit there forever, either stuck on pause or with a caption that
// never goes away, reading as a broken video rather than an intentional
// annotation.
const DEFAULT_RESUME_AFTER = 3;
// Chrome (scrubber/play button) auto-hides after this many idle ms while playing.
const CHROME_IDLE_MS = 2500;
const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5];
const CAPTION_PREF_KEY = "pb-caption-prefs";

type CaptionPrefs = { large: boolean; highContrast: boolean };

function loadCaptionPrefs(): CaptionPrefs {
  try {
    const raw = localStorage.getItem(CAPTION_PREF_KEY);
    if (!raw) return { large: false, highContrast: false };
    return { large: false, highContrast: false, ...JSON.parse(raw) };
  } catch {
    return { large: false, highContrast: false };
  }
}

function saveCaptionPrefs(prefs: CaptionPrefs) {
  try {
    localStorage.setItem(CAPTION_PREF_KEY, JSON.stringify(prefs));
  } catch {
    // best-effort, a private-browsing tab can throw here
  }
}

// A form field on the page (search box, chat input, etc.) should keep its
// own key handling, so shortcuts only fire when focus is elsewhere.
function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

// With a single player on the page (the common case), keyboard shortcuts
// apply app-wide with no need to hover first. Compare mode puts two on the
// same page, so once a second instance mounts each one requires hover,
// otherwise space/arrows would control both players at once.
let mountedPlayerCount = 0;

function resumeDelayFor(beat: Beat): number | null {
  if (beat.resume_after === null) return null;
  return beat.resume_after ?? DEFAULT_RESUME_AFTER;
}

function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function OverlaySvg({ beat }: { beat: Beat | null }) {
  if (!beat?.overlay) return null;
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {beat.overlay.arrows?.map((a, i) => (
        <g key={i}>
          <defs>
            <marker id={`arrowhead-${i}`} markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="var(--pb-accent)" />
            </marker>
          </defs>
          <line
            x1={a.x1}
            y1={a.y1}
            x2={a.x2}
            y2={a.y2}
            pathLength={1}
            stroke="var(--pb-accent)"
            strokeWidth={0.8}
            className="pb-draw"
            markerEnd={`url(#arrowhead-${i})`}
          />
        </g>
      ))}
      {beat.overlay.circles?.map((c, i) => (
        <circle
          key={i}
          cx={c.x}
          cy={c.y}
          r={c.r}
          pathLength={1}
          fill="none"
          stroke="var(--pb-primary)"
          strokeWidth={0.8}
          className="pb-draw"
        />
      ))}
    </svg>
  );
}

function Scrubber({
  currentTime,
  duration,
  beats,
  onSeek,
}: {
  currentTime: number;
  duration: number;
  beats: Beat[];
  onSeek: (t: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [hoverBeat, setHoverBeat] = useState<Beat | null>(null);
  const pct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  function seekFromClientX(clientX: number) {
    if (!trackRef.current || duration <= 0) return;
    const rect = trackRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  }

  return (
    <div className="relative flex-1">
      <div
        ref={trackRef}
        onClick={(e) => seekFromClientX(e.clientX)}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") onSeek(Math.min(duration, currentTime + 5));
          if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 5));
        }}
        className="relative h-1.5 w-full cursor-pointer rounded-full bg-white/25"
      >
        <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        {duration > 0 &&
          beats.map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSeek(b.t);
              }}
              onPointerEnter={() => setHoverBeat(b)}
              onPointerLeave={() => setHoverBeat(null)}
              aria-label={`Jump to: ${b.caption}`}
              className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-black/40 bg-accent"
              style={{ left: `${(b.t / duration) * 100}%` }}
            />
          ))}
      </div>
      {hoverBeat && duration > 0 && (
        <div
          className="pointer-events-none absolute bottom-full mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-md bg-black/90 px-2 py-1 text-xs text-white"
          style={{ left: `${(hoverBeat.t / duration) * 100}%` }}
        >
          {hoverBeat.caption}
        </div>
      )}
    </div>
  );
}

export function BreakdownPlayer({
  clip,
  beats,
  onComplete,
}: {
  clip: Clip;
  beats: Beat[];
  onComplete?: () => void;
}) {
  const sorted = [...beats].sort((a, b) => a.t - b.t);
  const {
    containerRef,
    ready,
    playing,
    muted,
    currentTime,
    duration,
    play,
    pause,
    seekTo,
    mute,
    unmute,
    setPlaybackRate,
  } = useYouTubePlayer(clip.youtube_id, clip.start_sec);
  const [activeBeat, setActiveBeat] = useState<Beat | null>(null);
  const [showChrome, setShowChrome] = useState(true);
  const [rate, setRate] = useState(1);
  const [captionPrefs, setCaptionPrefs] = useState<CaptionPrefs>(() => loadCaptionPrefs());
  const firedRef = useRef<Set<number>>(new Set());
  const resumeTimerRef = useRef<number | undefined>(undefined);
  const chromeTimerRef = useRef<number | undefined>(undefined);
  const completedRef = useRef(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hoveredRef = useRef(false);

  useEffect(() => {
    mountedPlayerCount += 1;
    return () => {
      mountedPlayerCount -= 1;
    };
  }, []);

  // The soundtrack and the film's own audio are mutually exclusive: unmuting
  // the film stops the soundtrack, and if the soundtrack gets turned on from
  // the nav while a clip is playing unmuted, mute the clip back down.
  useEffect(() => onSoundtrackChange((playingTrack) => {
    if (playingTrack) mute();
  }), [mute]);

  function unmuteFilm() {
    stopSoundtrack();
    unmute();
  }

  useEffect(() => {
    if (!ready) return;
    for (let i = 0; i < sorted.length; i++) {
      const beat = sorted[i];
      if (firedRef.current.has(i)) continue;
      if (currentTime >= beat.t && currentTime < beat.t + 1) {
        firedRef.current.add(i);
        setActiveBeat(beat);
        if (!completedRef.current && firedRef.current.size === sorted.length) {
          completedRef.current = true;
          onComplete?.();
        }
        const isPause = beat.action === "pause";
        if (isPause) pause();

        const delay = resumeDelayFor(beat);
        if (delay !== null) {
          window.clearTimeout(resumeTimerRef.current);
          resumeTimerRef.current = window.setTimeout(() => {
            setActiveBeat(null);
            if (isPause) play();
          }, delay * 1000);
        }
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, ready]);

  // Theater mode: chrome (scrubber/play button) fades after a beat of idle
  // time while playing, and comes right back on any pointer activity.
  function bumpChrome() {
    setShowChrome(true);
    window.clearTimeout(chromeTimerRef.current);
    if (playing) {
      chromeTimerRef.current = window.setTimeout(() => setShowChrome(false), CHROME_IDLE_MS);
    }
  }
  useEffect(() => {
    bumpChrome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  function cycleRate() {
    const idx = PLAYBACK_RATES.indexOf(rate);
    const next = PLAYBACK_RATES[(idx + 1) % PLAYBACK_RATES.length];
    setRate(next);
    setPlaybackRate(next);
  }

  function toggleCaptionPref(key: keyof CaptionPrefs) {
    setCaptionPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveCaptionPrefs(next);
      return next;
    });
  }

  function jumpTo(beat: Beat, index: number) {
    window.clearTimeout(resumeTimerRef.current);
    firedRef.current = new Set(sorted.slice(0, index).map((_, i) => i));
    seekTo(beat.t);
    setActiveBeat(null);
    play();
  }

  function seekAndReconcile(t: number) {
    // A manual scrub can land anywhere, ahead of or behind the beats fired
    // so far, so recompute which beats "already happened" from scratch
    // rather than only supporting sequential jumpTo.
    window.clearTimeout(resumeTimerRef.current);
    firedRef.current = new Set(sorted.map((b, i) => (b.t <= t ? i : -1)).filter((i) => i >= 0));
    seekTo(t);
    setActiveBeat(null);
  }

  function continuePlaying() {
    window.clearTimeout(resumeTimerRef.current);
    setActiveBeat(null);
    play();
  }

  // Press-and-hold on the active caption pauses for as long as it's held,
  // release resumes, no forced stop the way a straight "pause" beat can be.
  function startHold(e: ReactPointerEvent) {
    e.preventDefault();
    if (!activeBeat) return;
    window.clearTimeout(resumeTimerRef.current);
    pause();
  }
  function endHold() {
    if (!activeBeat) return;
    const delay = resumeDelayFor(activeBeat);
    if (activeBeat.action === "pause" && delay === null) return; // stays paused, Continue button handles it
    play();
    if (delay !== null) {
      resumeTimerRef.current = window.setTimeout(() => setActiveBeat(null), delay * 1000);
    }
  }

  // App-wide shortcuts while this player's on screen: space to play/pause,
  // left/right to seek, up/down to jump between beats. Only active when
  // focus isn't in a form field elsewhere on the page (search box, chat).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target) || !ready) return;
      if (mountedPlayerCount > 1 && !hoveredRef.current) return;
      if (e.key === " ") {
        e.preventDefault();
        playing ? pause() : play();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        seekAndReconcile(Math.min(duration, currentTime + 5));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        seekAndReconcile(Math.max(0, currentTime - 5));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = sorted.find((b) => b.t > currentTime + 0.5);
        if (next) jumpTo(next, sorted.indexOf(next));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevBeats = sorted.filter((b) => b.t < currentTime - 0.5);
        const prev = prevBeats[prevBeats.length - 1];
        if (prev) jumpTo(prev, sorted.indexOf(prev));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, playing, currentTime, duration]);

  const isPortrait = clip.orientation === "portrait";
  const needsContinueClick = activeBeat?.action === "pause" && resumeDelayFor(activeBeat) === null;

  return (
    <div ref={rootRef} className="flex flex-col gap-3">
      <div
        onPointerMove={bumpChrome}
        onPointerDown={bumpChrome}
        onPointerEnter={() => (hoveredRef.current = true)}
        onPointerLeave={() => (hoveredRef.current = false)}
        className={`pb-grain relative w-full overflow-hidden rounded-[var(--radius-pb)] border border-surface-border bg-black ${
          isPortrait ? "h-[70vh] max-h-[640px]" : "aspect-video"
        }`}
      >
        {isPortrait && (
          <img
            src={`https://img.youtube.com/vi/${clip.youtube_id}/hqdefault.jpg`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl"
          />
        )}
        <div className={`relative h-full ${isPortrait ? "mx-auto aspect-[9/16]" : "w-full"}`}>
          <div ref={containerRef} className="h-full w-full" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.4) 100%)" }}
          />
          <OverlaySvg key={activeBeat ? `${activeBeat.t}` : "none"} beat={activeBeat} />

          {muted && (
            <button
              type="button"
              onClick={unmuteFilm}
              aria-label="Unmute film audio"
              title="Unmute film audio"
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white backdrop-blur-sm hover:bg-black/80"
            >
              🔇
            </button>
          )}

          {activeBeat && (
            <div
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              className="pb-lower-third absolute bottom-12 left-0 max-w-[85%] cursor-pointer select-none px-3 sm:bottom-14"
            >
              <div
                className={`border-l-4 py-2.5 pl-3 pr-4 backdrop-blur-sm ${
                  captionPrefs.highContrast ? "border-primary bg-black" : "border-accent bg-black/85"
                }`}
              >
                <p
                  className={`font-display leading-tight text-white ${
                    captionPrefs.large ? "text-2xl" : "text-lg"
                  }`}
                >
                  {activeBeat.caption}
                </p>
                {needsContinueClick && (
                  <button
                    type="button"
                    onClick={continuePlaying}
                    className="mt-2 w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-black"
                  >
                    Continue ▶
                  </button>
                )}
              </div>
            </div>
          )}

          {/* custom chrome: replaces YouTube's native controls entirely */}
          <div
            className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/85 to-transparent px-3 py-2.5 transition-opacity duration-300 ${
              showChrome ? "opacity-100" : "opacity-0"
            }`}
          >
            <button
              type="button"
              onClick={() => (playing ? pause() : play())}
              aria-label={playing ? "Pause" : "Play"}
              className="text-lg text-white"
            >
              {playing ? "⏸" : "▶"}
            </button>
            <Scrubber currentTime={currentTime} duration={duration} beats={sorted} onSeek={seekAndReconcile} />
            <span className="pb-numeral shrink-0 text-xs text-white">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              type="button"
              onClick={cycleRate}
              aria-label="Playback speed"
              title="Playback speed"
              className="pb-numeral shrink-0 rounded border border-white/30 px-1.5 py-0.5 text-xs text-white"
            >
              {rate}x
            </button>
            <button
              type="button"
              onClick={() => toggleCaptionPref("large")}
              aria-pressed={captionPrefs.large}
              aria-label="Toggle large captions"
              title="Toggle large captions"
              className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${
                captionPrefs.large ? "border-primary text-primary" : "border-white/30 text-white"
              }`}
            >
              Aa
            </button>
            <button
              type="button"
              onClick={() => toggleCaptionPref("highContrast")}
              aria-pressed={captionPrefs.highContrast}
              aria-label="Toggle high-contrast captions"
              title="Toggle high-contrast captions"
              className={`shrink-0 rounded border px-1.5 py-0.5 text-xs ${
                captionPrefs.highContrast ? "border-primary text-primary" : "border-white/30 text-white"
              }`}
            >
              ◐
            </button>
          </div>
        </div>
      </div>

      {/* mobile: swipeable card rail (native scroll-snap, no gesture library needed) */}
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 sm:hidden">
        {sorted.map((beat, i) => {
          const isActive = beat === activeBeat;
          return (
            <button
              key={i}
              type="button"
              onClick={() => jumpTo(beat, i)}
              className={`flex w-[78%] shrink-0 snap-start flex-col items-start gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200 ${
                isActive ? "border-primary bg-primary/10" : "border-surface-border bg-surface"
              }`}
            >
              <span className="pb-numeral text-text-dim">{formatTime(beat.t)}</span>
              <span className={isActive ? "text-text" : "text-text-dim"}>{beat.caption}</span>
            </button>
          );
        })}
      </div>

      {/* desktop: vertical list */}
      <ol className="hidden flex-col gap-2 sm:flex">
        {sorted.map((beat, i) => {
          const isActive = beat === activeBeat;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => jumpTo(beat, i)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors duration-200 ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-surface-border bg-surface hover:border-primary/60"
                }`}
              >
                <span className="pb-numeral mt-0.5 shrink-0 text-text-dim">{formatTime(beat.t)}</span>
                <span className={isActive ? "text-text" : "text-text-dim"}>{beat.caption}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
