import { useState } from "react";

type Message = { role: "user" | "assistant"; content: string };
type Difficulty = "new" | "casual" | "superfan";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  new: "Never watched",
  casual: "Casual fan",
  superfan: "Superfan",
};

export function ChatPanel({ conceptSlug }: { conceptSlug: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("casual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const nextMessages = [...messages, { role: "user", content: text } as Message];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, conceptSlug, difficulty }),
      });
      if (!res.ok) throw new Error(`chat request failed (${res.status})`);
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);
    } catch {
      setError("Couldn't reach the chat right now, try again in a bit.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-pb)] border border-surface-border bg-surface p-4">
      <div className="flex items-center gap-2 text-xs">
        <span className="text-text-dim">Explain it like I'm a:</span>
        {(Object.keys(DIFFICULTY_LABEL) as Difficulty[]).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDifficulty(d)}
            className={`rounded-full border px-2.5 py-1 ${
              difficulty === d ? "border-primary bg-primary/20" : "border-surface-border text-text-dim"
            }`}
          >
            {DIFFICULTY_LABEL[d]}
          </button>
        ))}
      </div>

      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-text-dim">Ask why this works, how to counter it, or who runs it best.</p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.role === "user" ? "self-end bg-primary/20" : "self-start bg-bg-2"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="self-start text-sm text-text-dim">thinking…</div>}
      </div>

      {error && <p className="text-xs text-accent-2">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this concept…"
          className="flex-1 rounded-full border border-surface-border bg-bg-2 px-3 py-1.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
