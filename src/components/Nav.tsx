import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <header className="flex items-center justify-between border-b border-surface-border px-6 py-4">
      <Link to="/" className="font-display text-xl tracking-wide text-text">
        PLAYBOOK
      </Link>
      <div className="flex items-center gap-4">
        <Link to="/admin" className="text-xs text-text-dim hover:text-text">
          Admin
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
