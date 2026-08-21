import { useNbaScoreboard } from "../../lib/nbaScores";

function formatScoreboardDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

function isToday(dateStr: string) {
  const today = new Date();
  const [y, m, d] = dateStr.split("-").map(Number);
  return today.getFullYear() === y && today.getMonth() === m - 1 && today.getDate() === d;
}

export function ScoreboardPanel() {
  const { games, scoreboardDate, status } = useNbaScoreboard();

  if (status === "error") return null;

  if (status === "loading") {
    return <div className="pb-skeleton h-32 w-full" />;
  }

  const heading = scoreboardDate
    ? isToday(scoreboardDate)
      ? "Tonight in the NBA"
      : `Next up · ${formatScoreboardDate(scoreboardDate)}`
    : "NBA scoreboard";

  return (
    <div className="rounded-[var(--radius-pb)] border border-surface-border bg-bg-2 p-4">
      <p className="mb-3 text-xs uppercase tracking-widest text-text-dim">{heading}</p>
      {games.length === 0 ? (
        <p className="text-sm text-text-dim">No games on the board right now, check back closer to tip-off.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {games.map((g) => (
            <div
              key={g.id}
              className="flex items-center justify-between rounded-lg border border-surface-border bg-surface px-3 py-2"
            >
              <div className="flex items-baseline gap-2 font-display">
                <span className="text-text-dim">{g.away.abbreviation}</span>
                <span className="tabular-nums text-lg text-primary">{g.away.score}</span>
                <span className="text-text-dim">-</span>
                <span className="tabular-nums text-lg text-primary">{g.home.score}</span>
                <span className="text-text-dim">{g.home.abbreviation}</span>
              </div>
              <span className="text-xs text-text-dim">{g.statusText}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
