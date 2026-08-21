import { useEffect, useRef, useState } from "react";
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

function resumeDelayFor(beat: Beat): number | null {
  if (beat.resume_after === null) return null;
  return beat.resume_after ?? DEFAULT_RESUME_AFTER;
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
            stroke="var(--pb-accent)"
            strokeWidth={0.8}
            markerEnd={`url(#arrowhead-${i})`}
          />
        </g>
      ))}
      {beat.overlay.circles?.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="none" stroke="var(--pb-primary)" strokeWidth={0.8} />
      ))}
    </svg>
  );
}

export function BreakdownPlayer({ clip, beats }: { clip: Clip; beats: Beat[] }) {
  const sorted = [...beats].sort((a, b) => a.t - b.t);
  const { containerRef, ready, playing, muted, currentTime, play, pause, seekTo, mute, unmute } = useYouTubePlayer(
    clip.youtube_id,
    clip.start_sec,
  );
  const [activeBeat, setActiveBeat] = useState<Beat | null>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const resumeTimerRef = useRef<number | undefined>(undefined);

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

  function jumpTo(beat: Beat, index: number) {
    window.clearTimeout(resumeTimerRef.current);
    firedRef.current = new Set(sorted.slice(0, index).map((_, i) => i));
    seekTo(beat.t);
    setActiveBeat(null);
    play();
  }

  function continuePlaying() {
    window.clearTimeout(resumeTimerRef.current);
    setActiveBeat(null);
    play();
  }

  const isPortrait = clip.orientation === "portrait";

  return (
    <div className="flex flex-col gap-3">
      <div
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
          <OverlaySvg beat={activeBeat} />
          {activeBeat && (
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/90 to-transparent p-4">
              <p className="font-display text-lg text-white">{activeBeat.caption}</p>
              {activeBeat.action === "pause" && resumeDelayFor(activeBeat) === null && (
                <button
                  type="button"
                  onClick={continuePlaying}
                  className="w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-black"
                >
                  Continue ▶
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ol className="flex flex-col gap-2">
        {sorted.map((beat, i) => {
          const isActive = beat === activeBeat;
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => jumpTo(beat, i)}
                className={`flex w-full items-start gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-surface-border bg-surface hover:border-primary/60"
                }`}
              >
                <span className="mt-0.5 shrink-0 font-display tabular-nums text-text-dim">
                  {Math.floor(beat.t / 60)}:{String(Math.floor(beat.t % 60)).padStart(2, "0")}
                </span>
                <span className={isActive ? "text-text" : "text-text-dim"}>{beat.caption}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center gap-3 text-xs text-text-dim">
        <span>{playing ? "Playing" : "Paused"}</span>
        <button
          type="button"
          onClick={muted ? unmuteFilm : mute}
          aria-label={muted ? "Unmute film audio" : "Mute film audio"}
          className="rounded-full border border-surface-border px-3 py-1 hover:border-primary hover:text-text"
        >
          {muted ? "🔇 Unmute film" : "🔊 Mute film"}
        </button>
      </div>
    </div>
  );
}
