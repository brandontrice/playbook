import { useTheme } from "../lib/theme";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div role="group" aria-label="Theme" className="flex overflow-hidden rounded-full border border-surface-border text-xs">
      <button
        type="button"
        onClick={() => setTheme("modern")}
        aria-pressed={theme === "modern"}
        className={`px-3 py-1.5 ${theme === "modern" ? "bg-primary text-black font-semibold" : "text-text-dim"}`}
      >
        MyPark
      </button>
      <button
        type="button"
        onClick={() => setTheme("classic")}
        aria-pressed={theme === "classic"}
        className={`px-3 py-1.5 ${theme === "classic" ? "bg-primary text-black font-semibold" : "text-text-dim"}`}
      >
        Showtime
      </button>
    </div>
  );
}
