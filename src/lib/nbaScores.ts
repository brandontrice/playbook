import { useEffect, useState } from "react";

// A free, keyless, CORS-open, unofficial ESPN endpoint - not a documented
// product, so treat this as decorative and fail quietly if it ever changes.
const SCOREBOARD_URL = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";
const POLL_INTERVAL_MS = 2 * 60 * 1000;

export type NbaGame = {
  id: string;
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

function parseGames(data: EspnResponse): NbaGame[] {
  const games: NbaGame[] = [];
  for (const event of data.events ?? []) {
    const comp = event.competitions?.[0];
    if (!comp) continue;
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;
    games.push({
      id: event.id,
      shortName: event.shortName,
      home: { abbreviation: home.team.abbreviation, displayName: home.team.displayName, score: home.score ?? "0" },
      away: { abbreviation: away.team.abbreviation, displayName: away.team.displayName, score: away.score ?? "0" },
      state: comp.status.type.state,
      statusText: comp.status.type.shortDetail,
    });
  }
  return games;
}

export function useNbaScoreboard() {
  const [games, setGames] = useState<NbaGame[]>([]);
  const [scoreboardDate, setScoreboardDate] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(SCOREBOARD_URL);
        if (!res.ok) throw new Error(`scoreboard fetch failed (${res.status})`);
        const data = (await res.json()) as EspnResponse;
        if (cancelled) return;
        setGames(parseGames(data));
        setScoreboardDate(data.day?.date ?? null);
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

  return { games, scoreboardDate, status };
}
