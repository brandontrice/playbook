// Team color reference, hex values only, not logos or wordmarks (those
// stay off-limits per CLAUDE.md). Used to tint chips/markers toward the
// featured team when a clip has team data, so the library feels alive
// instead of uniformly one color regardless of who's on screen.
export const TEAM_COLORS: Record<string, string> = {
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

export function teamColor(abbreviation?: string | null): string | null {
  if (!abbreviation) return null;
  return TEAM_COLORS[abbreviation.toUpperCase()] ?? null;
}
