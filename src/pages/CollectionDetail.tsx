import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Collection, Concept, Sport } from "../types";
import { CardSkeleton, PosterCard, type CardClip } from "../components/PosterCard";
import { useSession } from "../lib/auth";
import { useUserProgress } from "../lib/progress";
import { useBookmarks } from "../lib/bookmarks";

export function CollectionDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { session } = useSession();
  const { completedIds } = useUserProgress(session?.user.id);
  const { bookmarkedIds } = useBookmarks(session?.user.id);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [clipsByConcept, setClipsByConcept] = useState<Record<string, CardClip>>({});
  const [sportSlugById, setSportSlugById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: coll } = await supabase.from("collections").select("*").eq("slug", slug).maybeSingle();
      if (!coll) {
        setCollection(null);
        setLoading(false);
        return;
      }
      setCollection(coll);

      const [linksRes, sportsRes] = await Promise.all([
        supabase
          .from("collection_concepts")
          .select("sort_order, concepts(*)")
          .eq("collection_id", coll.id)
          .order("sort_order"),
        supabase.from("sports").select("*"),
      ]);

      const sportMap: Record<string, string> = {};
      for (const s of (sportsRes.data ?? []) as Sport[]) sportMap[s.id] = s.slug;
      setSportSlugById(sportMap);

      const ordered = (linksRes.data ?? [])
        .map((row) => row.concepts as unknown as Concept | null)
        .filter((c): c is Concept => !!c);
      setConcepts(ordered);

      const ids = ordered.map((c) => c.id);
      if (ids.length > 0) {
        const { data: links } = await supabase
          .from("clip_concepts")
          .select("concept_id, clips!inner(youtube_id, players, teams)")
          .eq("clips.status", "active")
          .in("concept_id", ids);
        const map: Record<string, CardClip> = {};
        for (const row of links ?? []) {
          const clip = row.clips as unknown as CardClip | null;
          if (clip && !map[row.concept_id]) map[row.concept_id] = clip;
        }
        setClipsByConcept(map);
      }

      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="pb-skeleton h-6 w-24" />
        <div className="pb-skeleton mt-3 h-9 w-2/3" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-center text-text-dim">
        <p className="font-display text-xl text-text">Air ball.</p>
        <p className="mt-1 text-sm">
          Couldn't find that collection.{" "}
          <Link to="/collections" className="text-primary underline">
            Back to collections
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link to="/collections" className="text-xs text-text-dim hover:text-text">
        ← back to collections
      </Link>
      <h1 className="mb-1 mt-2 font-display text-4xl uppercase tracking-wide">{collection.title}</h1>
      {collection.description && <p className="mb-8 max-w-xl text-text-dim">{collection.description}</p>}

      {concepts.length === 0 ? (
        <p className="text-sm text-text-dim">Nothing in this collection yet.</p>
      ) : (
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {concepts.map((c, i) => (
            <li key={c.id} className="relative">
              <span className="pb-numeral absolute -left-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-black">
                {i + 1}
              </span>
              <PosterCard
                concept={c}
                clip={clipsByConcept[c.id]}
                sportSlug={sportSlugById[c.sport_id] ?? ""}
                completed={completedIds.has(c.id)}
                bookmarked={bookmarkedIds.has(c.id)}
              />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
