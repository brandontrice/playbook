// Generic sport pictographs (not team/league logos, which are trademarked
// and off-limits per CLAUDE.md), used purely to make NBA vs NFL scannable
// at a glance instead of two same-looking text pills.
function BasketballIcon() {
  return (
    <svg viewBox="0 0 16 16" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="8" cy="8" r="6.3" />
      <path d="M8 1.7v12.6M1.7 8h12.6M3.3 3.3c1.8 2.6 1.8 6.8 0 9.4M12.7 3.3c-1.8 2.6-1.8 6.8 0 9.4" />
    </svg>
  );
}

function FootballIcon() {
  return (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <ellipse cx="8" cy="8" rx="6.3" ry="3.8" />
      <path d="M3 8h10M6.2 6.4v3.2M8 6v4M9.8 6.4v3.2" />
    </svg>
  );
}

// Basketball uses the primary token (violet, matches the MyPark/2K vibe),
// football uses secondary (already a warm leather brown), so the two
// leagues read differently by color even before the icon or label lands.
export function LeagueBadge({ league, label }: { league: string; label: string }) {
  const isFootball = league === "nfl";
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
        isFootball
          ? "border-secondary/50 bg-secondary/20 text-secondary"
          : "border-primary/50 bg-primary/20 text-primary"
      }`}
    >
      {isFootball ? <FootballIcon /> : <BasketballIcon />}
      {label}
    </span>
  );
}

export function leagueAccentClass(league: string) {
  return league === "nfl" ? "border-l-secondary" : "border-l-primary";
}
