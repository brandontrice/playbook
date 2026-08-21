import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Beat, Clip, Concept, Sport } from "../types";
import { ScoreboardPanel } from "../components/Scoreboard/ScoreboardPanel";
import { BreakdownPlayer } from "../components/BreakdownPlayer/BreakdownPlayer";
import { teamColor } from "../lib/teamColors";

type CardClip = { youtube_id: string; players: string[]; teams: string[] };
type FeaturedConcept = { concept: Concept; clip: Clip; beats: Beat[] };

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
  const tint = teamColor(team);

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

export function Home() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [clipsByConcept, setClipsByConcept] = useState<Record<string, CardClip>>({});
  const [featured, setFeatured] = useState<FeaturedConcept | null>(null);
  const [loading, setLoading] = useState(true);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);

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

      // The hero is the product demo, not a description of it: the first
      // concept's own breakdown, actually playing with its own beats.
      const firstConcept = (conceptsRes.data ?? []).find((c) => !c.parent_id);
      if (firstConcept) {
        const { data: breakdown } = await supabase
          .from("breakdowns")
          .select("beats, clip_id")
          .eq("concept_id", firstConcept.id)
          .limit(1)
          .maybeSingle();
        if (breakdown) {
          const { data: clip } = await supabase.from("clips").select("*").eq("id", breakdown.clip_id).single();
          if (clip) setFeatured({ concept: firstConcept, clip, beats: breakdown.beats });
        }
      }

      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="pb-grain mb-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
        <div>
          <h1 className="mb-3 font-display text-5xl uppercase leading-[0.95] tracking-wide sm:text-6xl">
            See the game the way coaches do.
          </h1>
          <p className="mb-6 max-w-md text-text-dim">
            Real film, broken down beat by beat, right on the clip, not a description of it.
          </p>
          <Link
            to={featured ? `/concepts/${featured.concept.slug}` : "#library"}
            className="pb-glow inline-block w-fit rounded-full bg-primary px-6 py-3 font-display text-lg uppercase tracking-wide text-black"
          >
            Watch a breakdown
          </Link>
        </div>
        <div>
          {featured ? (
            <BreakdownPlayer clip={featured.clip} beats={featured.beats} />
          ) : (
            <div className="pb-skeleton aspect-video w-full" />
          )}
        </div>
      </div>

      <div className="mb-10">
        <ScoreboardPanel />
      </div>

      <div id="library" />

      {!loading && (() => {
        const teams = [...new Set(Object.values(clipsByConcept).map((c) => c.teams[0]).filter(Boolean))].sort();
        if (teams.length === 0) return null;
        return (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-text-dim">Learn it through</span>
            <button
              type="button"
              onClick={() => setTeamFilter(null)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                teamFilter === null ? "border-primary bg-primary text-black" : "border-surface-border text-text-dim"
              }`}
            >
              All teams
            </button>
            {teams.map((team) => {
              const tint = teamColor(team);
              const active = teamFilter === team;
              return (
                <button
                  key={team}
                  type="button"
                  onClick={() => setTeamFilter(active ? null : team)}
                  className="rounded-full border px-3 py-1 text-xs font-semibold uppercase transition-colors duration-200"
                  style={{
                    borderColor: active ? tint ?? "var(--pb-primary)" : "var(--pb-surface-border)",
                    background: active ? `${tint ?? "var(--pb-primary)"}33` : "transparent",
                    color: active ? "var(--pb-text)" : "var(--pb-text-dim)",
                  }}
                >
                  {team}
                </button>
              );
            })}
          </div>
        );
      })()}

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading &&
        sports.map((sport) => {
          const sportConcepts = concepts.filter(
            (c) =>
              c.sport_id === sport.id &&
              !c.parent_id &&
              (!teamFilter || clipsByConcept[c.id]?.teams.includes(teamFilter)),
          );
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

      {!loading &&
        concepts.length > 0 &&
        teamFilter &&
        sports.every(
          (sport) =>
            concepts.filter(
              (c) => c.sport_id === sport.id && !c.parent_id && clipsByConcept[c.id]?.teams.includes(teamFilter),
            ).length === 0,
        ) && (
          <div className="rounded-[var(--radius-pb)] border border-dashed border-surface-border p-8 text-center text-text-dim">
            <p className="font-display text-xl text-text">No {teamFilter} breakdowns yet.</p>
            <p className="mt-1 text-sm">
              Here's the closest thing:{" "}
              <button type="button" onClick={() => setTeamFilter(null)} className="text-primary underline">
                see every concept
              </button>
              .
            </p>
          </div>
        )}
    </div>
  );
}
