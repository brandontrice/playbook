import { useSportsScoreboard } from "../../lib/sportsScores";
import { LeagueBadge, leagueAccentClass } from "./LeagueBadge";

const MAX_GAMES = 6;

export function ScoreboardPanel() {
  const { games, status, leagueLabel } = useSportsScoreboard();

  if (status === "error") return null;

  if (status === "loading") {
    return <div className="pb-skeleton h-32 w-full" />;
  }

  const shown = games.slice(0, MAX_GAMES);
  const hasLive = shown.some((g) => g.state === "in");
  const heading = games.length === 0 ? "Scoreboard" : hasLive ? "Live right now" : "Coming up";

  return (
    <div className="rounded-[var(--radius-pb)] border border-surface-border bg-bg-2 p-4">
      <p className="mb-3 text-xs uppercase tracking-widest text-text-dim">{heading}</p>
      {shown.length === 0 ? (
        <p className="text-sm text-text-dim">No games on the board right now, check back later.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {shown.map((g) => {
            const isScheduled = g.state === "pre";
            return (
              <div
                key={g.id}
                className={`flex items-center justify-between rounded-lg border border-surface-border border-l-2 bg-surface px-3 py-2 ${leagueAccentClass(g.league)}`}
              >
                <div className="flex items-center gap-2">
                  <LeagueBadge league={g.league} label={leagueLabel(g.league)} />
                  {isScheduled ? (
                    <div className="flex items-baseline gap-2 font-display">
                      <span className="text-text">{g.away.abbreviation}</span>
                      <span className="text-text-dim">at</span>
                      <span className="text-text">{g.home.abbreviation}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2 font-display">
                      <span className="text-text-dim">{g.away.abbreviation}</span>
                      <span className="tabular-nums text-lg text-primary">{g.away.score}</span>
                      <span className="text-text-dim">-</span>
                      <span className="tabular-nums text-lg text-primary">{g.home.score}</span>
                      <span className="text-text-dim">{g.home.abbreviation}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-text-dim">{g.statusText}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
