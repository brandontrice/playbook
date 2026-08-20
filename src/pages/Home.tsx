import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Concept, Sport } from "../types";

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

  if (loading) return <p className="p-6 text-text-dim">Loading…</p>;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 font-display text-4xl">Learn the game, from the film.</h1>
      <p className="mb-8 text-text-dim">
        Real clips, broken down beat by beat — then the chalkboard version, then a quiz.
      </p>

      {sports.map((sport) => {
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
                  className="pb-glow rounded-[var(--radius-pb)] border border-surface-border bg-surface p-4 transition-transform hover:-translate-y-0.5"
                >
                  <p className="font-display text-lg">{c.title}</p>
                  {c.summary && <p className="mt-1 text-sm text-text-dim">{c.summary}</p>}
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {concepts.length === 0 && (
        <p className="text-text-dim">No concepts yet — add some from the admin screen.</p>
      )}
    </div>
  );
}
