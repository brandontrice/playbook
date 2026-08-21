import { useEffect, useState } from "react";
import { useTheme } from "../lib/theme";
import { isSoundtrackPlaying, onSoundtrackChange, startSoundtrack, toggleSoundtrack } from "../lib/soundtrack";

export function SoundtrackToggle() {
  const { theme } = useTheme();
  const [playing, setPlaying] = useState(isSoundtrackPlaying());

  useEffect(() => onSoundtrackChange(setPlaying), []);

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
