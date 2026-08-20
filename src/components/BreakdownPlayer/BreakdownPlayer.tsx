import { useEffect, useRef, useState } from "react";
import type { Beat, Clip } from "../../types";
import { useYouTubePlayer } from "./useYouTubePlayer";

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
  const { containerRef, ready, playing, currentTime, play, pause, seekTo } = useYouTubePlayer(
    clip.youtube_id,
    clip.start_sec,
  );
  const [activeBeat, setActiveBeat] = useState<Beat | null>(null);
  const firedRef = useRef<Set<number>>(new Set());
  const resumeTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    for (let i = 0; i < sorted.length; i++) {
      const beat = sorted[i];
      if (firedRef.current.has(i)) continue;
      if (currentTime >= beat.t && currentTime < beat.t + 1) {
        firedRef.current.add(i);
        setActiveBeat(beat);
        if (beat.action === "pause") {
          pause();
          if (beat.resume_after) {
            window.clearTimeout(resumeTimerRef.current);
            resumeTimerRef.current = window.setTimeout(() => {
              setActiveBeat(null);
              play();
            }, beat.resume_after * 1000);
          }
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

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-video w-full overflow-hidden rounded-[var(--radius-pb)] border border-surface-border bg-black">
        <div ref={containerRef} className="h-full w-full" />
        <OverlaySvg beat={activeBeat} />
        {activeBeat && (
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/90 to-transparent p-4">
            <p className="font-display text-lg text-white">{activeBeat.caption}</p>
            {activeBeat.action === "pause" && !activeBeat.resume_after && (
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

      <ol className="flex flex-wrap gap-2">
        {sorted.map((beat, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => jumpTo(beat, i)}
              className="rounded-full border border-surface-border bg-surface px-3 py-1 text-xs text-text-dim hover:border-primary hover:text-text"
            >
              {Math.floor(beat.t / 60)}:{String(Math.floor(beat.t % 60)).padStart(2, "0")} — {beat.caption.slice(0, 28)}
              {beat.caption.length > 28 ? "…" : ""}
            </button>
          </li>
        ))}
      </ol>

      <div className="text-xs text-text-dim">{playing ? "Playing" : "Paused"}</div>
    </div>
  );
}
