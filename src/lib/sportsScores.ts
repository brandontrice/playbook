import { useEffect, useState } from "react";

// Free, keyless, CORS-open, unofficial ESPN endpoints, one per league, same
// shape across sports. Not a documented product, so this stays decorative:
// if it ever breaks, the UI just falls back to its empty state quietly.
const LEAGUES: { key: string; label: string; url: string }[] = [
  { key: "nba", label: "NBA", url: "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard" },
  { key: "nfl", label: "NFL", url: "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard" },
];
const POLL_INTERVAL_MS = 2 * 60 * 1000;

export type Game = {
  id: string;
  league: string;
  shortName: string;
  home: { abbreviation: string; displayName: string; score: string };
  away: { abbreviation: string; displayName: string; score: string };
  state: "pre" | "in" | "post" | string;
  statusText: string;
};

type EspnResponse = {
  day?: { date: string };
  events?: {
    id: string;
    shortName: string;
    competitions: {
      status: { type: { state: string; shortDetail: string } };
      competitors: {
        homeAway: "home" | "away";
        score?: string;
        team: { abbreviation: string; displayName: string };
      }[];
    }[];
  }[];
};

function parseGames(data: EspnResponse, league: string): Game[] {
  const games: Game[] = [];
  for (const event of data.events ?? []) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;
    games.push({
      id: `${league}-${event.id}`,
      league,
      shortName: event.shortName,
      home: { abbreviation: home.team.abbreviation, displayName: home.team.displayName, score: home.score ?? "0" },
      away: { abbreviation: away.team.abbreviation, displayName: away.team.displayName, score: away.score ?? "0" },
      state: comp.status.type.state,
      statusText: comp.status.type.shortDetail,
    });
  }
  return games;
}

const STATE_ORDER: Record<string, number> = { in: 0, pre: 1, post: 2 };

export function useSportsScoreboard() {
  const [games, setGames] = useState<Game[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const results = await Promise.all(
          LEAGUES.map(async (l) => {
            try {
              const res = await fetch(l.url);
              if (!res.ok) return [];
              const data = (await res.json()) as EspnResponse;
              return parseGames(data, l.key);
            } catch {
              return [];
            }
          }),
        );
        if (cancelled) return;
        const combined = results.flat().sort((a, b) => (STATE_ORDER[a.state] ?? 3) - (STATE_ORDER[b.state] ?? 3));
        setGames(combined);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    load();
    const interval = window.setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return { games, status, leagueLabel: (key: string) => LEAGUES.find((l) => l.key === key)?.label ?? key.toUpperCase() };
}
