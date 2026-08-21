import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "modern" | "classic";

// Committed to MyPark as the one theme (no user-facing switcher, see
// Nav.tsx). Showtime's tokens stay fully defined in index.css and this
// provider still technically supports switching, deliberately left
// functional rather than ripped out, in case a theme switcher comes back
// later, it's just unreachable from the UI today. STORAGE_KEY intentionally
// unused now: forcing "modern" always, so a stale localStorage value from
// before this change can't resurrect Showtime on someone's next visit.
const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
} | null>(null);

function readInitialTheme(): Theme {
  return "modern";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
