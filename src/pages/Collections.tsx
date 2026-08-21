import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Collection } from "../types";
import { CardSkeleton } from "../components/PosterCard";

export function Collections() {
  const [collections, setCollections] = useState<(Collection & { conceptCount: number })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [collectionsRes, linksRes] = await Promise.all([
        supabase.from("collections").select("*").order("sort_order"),
        supabase.from("collection_concepts").select("collection_id"),
      ]);
      const countByCollection: Record<string, number> = {};
      for (const row of linksRes.data ?? []) {
        countByCollection[row.collection_id] = (countByCollection[row.collection_id] ?? 0) + 1;
      }
      setCollections((collectionsRes.data ?? []).map((c) => ({ ...c, conceptCount: countByCollection[c.id] ?? 0 })));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-xs text-text-dim hover:text-text">
        ← back
      </Link>
      <h1 className="mb-1 mt-2 font-display text-4xl uppercase tracking-wide">Collections</h1>
      <p className="mb-8 max-w-xl text-text-dim">
        Curated sequences, not just a flat library. Work through one in order to build a concept up from the ground.
      </p>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && collections.length === 0 && (
        <div className="rounded-[var(--radius-pb)] border border-dashed border-surface-border p-8 text-center text-text-dim">
          <p className="font-display text-xl text-text">Nothing curated yet.</p>
          <p className="mt-1 text-sm">Check back soon.</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {collections.map((coll) => (
          <Link
            key={coll.id}
            to={`/collections/${coll.slug}`}
            className="pb-card rounded-[var(--radius-pb)] border border-surface-border bg-surface p-5"
          >
            <p className="font-display text-xl uppercase leading-tight tracking-wide">{coll.title}</p>
            {coll.description && <p className="mt-1.5 text-sm text-text-dim">{coll.description}</p>}
            <p className="mt-3 text-xs text-primary">{coll.conceptCount} concepts</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
