import { Link } from "react-router-dom";
import type { Concept } from "../types";
import { teamColor } from "../lib/teamColors";

export type CardClip = { youtube_id: string; players: string[]; teams: string[] };

export function CardSkeleton() {
  return <div className="pb-skeleton aspect-video" />;
}

export function DifficultyPips({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Difficulty ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < level ? "bg-primary" : "bg-white/20"}`} />
      ))}
    </div>
  );
}

export function PosterCard({
  concept,
  clip,
  sportSlug,
  completed,
  bookmarked,
}: {
  concept: Concept;
  clip?: CardClip;
  sportSlug: string;
  completed: boolean;
  bookmarked: boolean;
}) {
  const player = clip?.players?.[0];
  const team = clip?.teams?.[0];
  const tint = teamColor(team, sportSlug);

  return (
    <Link
      to={`/concepts/${concept.slug}`}
      className="pb-card group relative block aspect-video overflow-hidden rounded-[var(--radius-pb)] border border-surface-border bg-bg-2"
    >
      {clip?.youtube_id && (
        <img
          src={`https://img.youtube.com/vi/${clip.youtube_id}/hqdefault.jpg`}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-200 group-hover:opacity-90"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
      {(completed || bookmarked) && (
        <div className="absolute right-2 top-2 flex gap-1">
          {bookmarked && (
            <span className="rounded-full bg-black/60 px-1.5 py-0.5 text-xs" aria-label="Bookmarked" title="Bookmarked">
              ★
            </span>
          )}
          {completed && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-xs text-black" aria-label="Completed" title="Completed">
              ✓
            </span>
          )}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3">
        {(player || team) && (
          <span
            className={`w-fit rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/90 ${
              tint ? "" : "border-white/25 bg-black/40"
            }`}
            style={tint ? { borderColor: `${tint}aa`, background: `${tint}33` } : undefined}
          >
            {[player, team].filter(Boolean).join(" · ")}
          </span>
        )}
        <p className="font-display text-lg uppercase leading-tight tracking-wide text-white">{concept.title}</p>
        <DifficultyPips level={concept.difficulty} />
      </div>
    </Link>
  );
}
