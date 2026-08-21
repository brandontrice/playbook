import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Concept, Sport } from "../types";
import { ScoreboardPanel } from "../components/Scoreboard/ScoreboardPanel";

type CardClip = { youtube_id: string; players: string[]; teams: string[] };

function CardSkeleton() {
  return <div className="pb-skeleton aspect-video" />;
}

function DifficultyPips({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Difficulty ${level} of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < level ? "bg-primary" : "bg-white/20"}`}
        />
      ))}
    </div>
  );
}

function PosterCard({ concept, clip }: { concept: Concept; clip?: CardClip }) {
  const player = clip?.players?.[0];
  const team = clip?.teams?.[0];

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
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-3">
        {(player || team) && (
          <span className="w-fit rounded-full border border-white/25 bg-black/40 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/90">
            {[player, team].filter(Boolean).join(" · ")}
          </span>
        )}
        <p className="font-display text-lg uppercase leading-tight tracking-wide text-white">{concept.title}</p>
        <DifficultyPips level={concept.difficulty} />
      </div>
    </Link>
  );
}

export function Home() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [clipsByConcept, setClipsByConcept] = useState<Record<string, CardClip>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sportsRes, conceptsRes, clipLinksRes] = await Promise.all([
        supabase.from("sports").select("*").order("name"),
        supabase.from("concepts").select("*").order("sort_order"),
        supabase.from("clip_concepts").select("concept_id, clips(youtube_id, players, teams)"),
      ]);
      setSports(sportsRes.data ?? []);
      setConcepts(conceptsRes.data ?? []);

      const map: Record<string, CardClip> = {};
      for (const row of clipLinksRes.data ?? []) {
        const clip = row.clips as unknown as CardClip | null;
        if (clip && !map[row.concept_id]) map[row.concept_id] = clip;
      }
      setClipsByConcept(map);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="mb-2 font-display text-4xl">Learn the game, from the film.</h1>
      <p className="mb-8 text-text-dim">
        Real clips, broken down beat by beat, then the chalkboard version, then a quiz.
      </p>

      <div className="mb-10">
        <ScoreboardPanel />
      </div>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading &&
        sports.map((sport) => {
          const sportConcepts = concepts.filter((c) => c.sport_id === sport.id && !c.parent_id);
          if (sportConcepts.length === 0) return null;
          return (
            <section key={sport.id} className="mb-10">
              <h2 className="mb-3 text-sm uppercase tracking-widest text-text-dim">{sport.name}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sportConcepts.map((c) => (
                  <PosterCard key={c.id} concept={c} clip={clipsByConcept[c.id]} />
                ))}
              </div>
            </section>
          );
        })}

      {!loading && concepts.length === 0 && (
        <div className="rounded-[var(--radius-pb)] border border-dashed border-surface-border p-8 text-center text-text-dim">
          <p className="font-display text-xl text-text">The court's empty.</p>
          <p className="mt-1 text-sm">
            No concepts yet, add the first one from{" "}
            <Link to="/admin" className="text-primary underline">
              the admin screen
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
