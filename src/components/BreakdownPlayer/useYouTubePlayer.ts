import { useEffect, useRef, useState } from "react";

// Minimal shape of the bits of the YT IFrame Player API this app uses.
type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  mute(): void;
  unMute(): void;
  destroy(): void;
};

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: () => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;

  apiLoadPromise = new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiLoadPromise;
}

export function useYouTubePlayer(videoId: string, startSec: number) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(startSec);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;

    loadYouTubeApi().then(() => {
      if (cancelled || !containerRef.current || !window.YT) return;
      const player = new window.YT.Player(containerRef.current, {
        videoId,
        // Muted autoplay is allowed by every browser's autoplay policy,
        // unlike unmuted autoplay, which is why the clip starts muted and
        // an explicit "unmute" control (see BreakdownPlayer) turns it on.
        playerVars: { start: Math.floor(startSec), playsinline: 1, rel: 0, autoplay: 1, mute: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e) => {
            const YT = window.YT!;
            setPlaying(e.data === YT.PlayerState.PLAYING);
          },
        },
      });
      playerRef.current = player;

      const tick = () => {
        if (playerRef.current) {
          setCurrentTime(playerRef.current.getCurrentTime());
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return {
    containerRef,
    ready,
    playing,
    muted,
    currentTime,
    play: () => playerRef.current?.playVideo(),
    pause: () => playerRef.current?.pauseVideo(),
    seekTo: (s: number) => playerRef.current?.seekTo(s, true),
    unmute: () => {
      playerRef.current?.unMute();
      setMuted(false);
    },
    mute: () => {
      playerRef.current?.mute();
      setMuted(true);
    },
  };
}
