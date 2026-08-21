import { useSportsScoreboard } from "../../lib/sportsScores";

const MAX_TICKER_ITEMS = 12;

export function ScoreTicker() {
  const { games, status, leagueLabel } = useSportsScoreboard();

  if (status !== "ready" || games.length === 0) return null;

  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const items = games.slice(0, MAX_TICKER_ITEMS).map((g) => {
    const isScheduled = g.state === "pre";
    return (
      <span key={g.id} className="text-xs text-text-dim">
        <span className="mr-1.5 text-text-dim/60">{leagueLabel(g.league)}</span>
        <span className="font-display text-text">{g.away.abbreviation}</span>
        {!isScheduled && <> {g.away.score}</>}
        {" @ "}
        <span className="font-display text-text">{g.home.abbreviation}</span>
        {!isScheduled && <> {g.home.score}</>}
        <span className="ml-2 text-text-dim/70">{g.statusText}</span>
      </span>
    );
  });

  return (
    <div
      className="pb-ticker border-b border-surface-border bg-bg-2 px-4 py-1.5"
      data-animated={prefersReducedMotion ? "false" : "true"}
      role="region"
      aria-label="Scores"
    >
      <div className="pb-ticker-track">
        {items}
        {!prefersReducedMotion && items}
      </div>
    </div>
  );
}
