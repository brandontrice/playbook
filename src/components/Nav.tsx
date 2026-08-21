import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { SoundtrackToggle } from "./SoundtrackToggle";

export function Nav() {
  return (
    <header className="flex items-center justify-between border-b border-surface-border px-6 py-4">
      <Link to="/" className="font-display text-xl tracking-wide text-text">
        PLAYBOOK
      </Link>
      <div className="flex items-center gap-4">
        <a
          href="https://www.instagram.com/brandonrdevelops"
          target="_blank"
          rel="noreferrer"
          aria-label="Brandon on Instagram"
          className="text-text-dim hover:text-text"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4.2" />
            <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
          </svg>
        </a>
        <Link to="/admin" className="text-xs text-text-dim hover:text-text">
          Admin
        </Link>
        <SoundtrackToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
