import { useEffect, useRef, useState } from "react";
import { useTheme } from "../lib/theme";
import { armAutoStart, isSoundtrackPlaying, onSoundtrackChange, startSoundtrack, toggleSoundtrack } from "../lib/soundtrack";

export function SoundtrackToggle() {
  const { theme } = useTheme();
  const [playing, setPlaying] = useState(isSoundtrackPlaying());
  const themeRef = useRef(theme);

  useEffect(() => onSoundtrackChange(setPlaying), []);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // On by default: browsers won't let audio start until a real user gesture
  // happens, so this arms a one-time listener for the page's first tap/
  // click/key rather than trying (and failing) to play on load.
  useEffect(() => {
    armAutoStart(() => themeRef.current);
  }, []);

  // Switching themes while the soundtrack is playing swaps to that theme's loop.
  useEffect(() => {
    if (isSoundtrackPlaying()) startSoundtrack(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <button
      type="button"
      onClick={() => toggleSoundtrack(theme)}
      aria-label={playing ? "Stop soundtrack" : "Play soundtrack"}
      aria-pressed={playing}
      title={playing ? "Stop soundtrack" : "Play ambient soundtrack (generated, not the film audio)"}
      className={`rounded-full border px-3 py-1.5 text-xs ${
        playing ? "border-primary bg-primary/20 text-text" : "border-surface-border text-text-dim"
      }`}
    >
      {playing ? "🔊 Soundtrack" : "🎵 Soundtrack"}
    </button>
  );
}
