// Team color reference, hex values only, not logos or wordmarks (those
// stay off-limits per CLAUDE.md). Used to tint chips/markers toward the
// featured team when a clip has team data, so the library feels alive
// instead of uniformly one color regardless of who's on screen.
//
// Namespaced per sport slug (matching sports.slug), not one flat table:
// several abbreviations collide across leagues (CLE is both the Cavaliers
// and the Browns, DEN is both the Nuggets and the Broncos, MIN both the
// Timberwolves and the Vikings), so a single shared lookup would tint one
// sport's clip with the wrong team's colors.
const NBA_COLORS: Record<string, string> = {
  ATL: "#e03a3e",
  BOS: "#007a33",
  BKN: "#000000",
  CHA: "#1d1160",
  CHI: "#ce1141",
  CLE: "#860038",
  DAL: "#00538c",
  DEN: "#0e2240",
  DET: "#c8102e",
  GSW: "#1d428a",
  HOU: "#ce1141",
  IND: "#002d62",
  LAC: "#c8102e",
  LAL: "#552583",
  MEM: "#5d76a9",
  MIA: "#98002e",
  MIL: "#00471b",
  MIN: "#0c2340",
  NOP: "#0c2340",
  NYK: "#006bb6",
  OKC: "#007ac1",
  ORL: "#0077c0",
  PHI: "#006bb6",
  PHX: "#e56020",
  POR: "#e03a3e",
  SAC: "#5a2d81",
  SAS: "#c4ced4",
  TOR: "#ce1141",
  UTA: "#002b5c",
  WAS: "#002b5c",
};

const NFL_COLORS: Record<string, string> = {
  ARI: "#97233f",
  ATL: "#a71930",
  BAL: "#241773",
  BUF: "#00338d",
  CAR: "#0085ca",
  CHI: "#0b162a",
  CIN: "#fb4f14",
  CLE: "#ff3c00",
  DAL: "#041e42",
  DEN: "#fb4f14",
  DET: "#0076b6",
  GB: "#203731",
  HOU: "#03202f",
  IND: "#002c5f",
  JAX: "#006778",
  KC: "#e31837",
  LAC: "#0080c6",
  LAR: "#003594",
  LV: "#000000",
  MIA: "#008e97",
  MIN: "#4f2683",
  NE: "#002244",
  NO: "#d3bc8d",
  NYG: "#0b2265",
  NYJ: "#125740",
  PHI: "#004c54",
  PIT: "#ffb612",
  SEA: "#002244",
  SF: "#aa0000",
  TB: "#d50a0a",
  TEN: "#4b92db",
  WAS: "#5a1414",
};

const TEAM_COLORS_BY_SPORT: Record<string, Record<string, string>> = {
  basketball: NBA_COLORS,
  football: NFL_COLORS,
};

export function teamColor(abbreviation?: string | null, sportSlug?: string | null): string | null {
  if (!abbreviation) return null;
  const table = (sportSlug && TEAM_COLORS_BY_SPORT[sportSlug]) || NBA_COLORS;
  return table[abbreviation.toUpperCase()] ?? null;
}
