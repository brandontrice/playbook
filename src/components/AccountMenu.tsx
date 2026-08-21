import { useEffect, useRef, useState } from "react";
import { useSession, sendMagicLink, signOut } from "../lib/auth";
import { useUserProgress, computeStreak } from "../lib/progress";

export function AccountMenu() {
  const { session, loading } = useSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const { dates } = useUserProgress(session?.user.id);
  const { current } = computeStreak(dates);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (loading) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch {
      setError("Couldn't send the link, try again.");
    }
  }

  if (!session) {
    return (
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full border border-surface-border px-3 py-1.5 text-xs text-text-dim hover:border-primary hover:text-text"
        >
          Sign in
        </button>
        {open && (
          <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-surface-border bg-bg-2 p-3 shadow-lg">
            {sent ? (
              <p className="text-xs text-text-dim">Check {email} for a sign-in link.</p>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-2">
                <p className="text-xs text-text-dim">Track progress and save concepts.</p>
                <input
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg border border-surface-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-primary"
                />
                <button type="submit" className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-black">
                  Send link
                </button>
                {error && <p className="text-xs text-accent-2">{error}</p>}
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-xs text-text-dim hover:border-primary hover:text-text"
      >
        {current > 0 && <span aria-hidden="true">🔥{current}</span>}
        <span className="max-w-[100px] truncate">{session.user.email}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg border border-surface-border bg-bg-2 p-2 shadow-lg">
          <p className="px-2 py-1 text-xs text-text-dim">
            {current > 0 ? `${current}-day streak` : "Finish a concept to start a streak"}
          </p>
          <button
            type="button"
            onClick={async () => {
              await signOut();
              setOpen(false);
            }}
            className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-text-dim hover:bg-surface hover:text-text"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
