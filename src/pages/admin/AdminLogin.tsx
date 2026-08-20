import { useState } from "react";
import { sendMagicLink } from "../../lib/auth";
import { ADMIN_EMAIL } from "../../lib/supabase";

export function AdminLogin() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch {
      setError("Couldn't send the link — check the email and try again.");
    }
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-20 text-center">
      <h1 className="mb-4 font-display text-2xl">Admin sign-in</h1>
      {sent ? (
        <p className="text-text-dim">Check {email} for a magic link.</p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="rounded-full border border-surface-border bg-bg-2 px-4 py-2 text-center outline-none focus:border-primary"
          />
          <button type="submit" className="rounded-full bg-primary px-4 py-2 font-semibold text-black">
            Send magic link
          </button>
          {error && <p className="text-xs text-accent-2">{error}</p>}
        </form>
      )}
    </div>
  );
}
