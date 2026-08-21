import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Concept, Sport } from "../types";

function CardSkeleton() {
  return (
    <div className="pb-skeleton h-24" />
  );
}

export function Home() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [sportsRes, conceptsRes] = await Promise.all([
        supabase.from("sports").select("*").order("name"),
        supabase.from("concepts").select("*").order("sort_order"),
      ]);
      setSports(sportsRes.data ?? []);
      setConcepts(conceptsRes.data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 font-display text-4xl">Learn the game, from the film.</h1>
      <p className="mb-8 text-text-dim">
        Real clips, broken down beat by beat, then the chalkboard version, then a quiz.
      </p>

      {loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sportConcepts.map((c) => (
                  <Link
                    key={c.id}
                    to={`/concepts/${c.slug}`}
                    className="pb-card pb-glow rounded-[var(--radius-pb)] border border-surface-border bg-surface p-4"
                  >
                    <p className="font-display text-lg">{c.title}</p>
                    {c.summary && <p className="mt-1 text-sm text-text-dim">{c.summary}</p>}
                  </Link>
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
