import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Beat, Clip, Concept, Sport } from "../types";
import { BreakdownPlayer } from "../components/BreakdownPlayer/BreakdownPlayer";

type Film = { clip: Clip; beats: Beat[] } | null;

function ConceptPicker({
  sports,
  concepts,
  value,
  onChange,
  label,
}: {
  sports: Sport[];
  concepts: Concept[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-text-dim">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-surface-border bg-bg-2 px-3 py-2 text-sm text-text outline-none focus:border-primary"
      >
        <option value="">Pick a concept…</option>
        {sports.map((sport) => {
          const options = concepts.filter((c) => c.sport_id === sport.id && !c.parent_id);
          if (options.length === 0) return null;
          return (
            <optgroup key={sport.id} label={sport.name}>
              {options.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}

function useConceptFilm(conceptId: string) {
  const [film, setFilm] = useState<Film>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!conceptId) {
      setFilm(null);
      return;
    }
    setLoading(true);
    (async () => {
      const { data: breakdown } = await supabase
        .from("breakdowns")
        .select("beats, clip_id")
        .eq("concept_id", conceptId)
        .limit(1)
        .maybeSingle();
      if (!breakdown) {
        setFilm(null);
        setLoading(false);
        return;
      }
      const { data: clip } = await supabase.from("clips").select("*").eq("id", breakdown.clip_id).single();
      setFilm(clip ? { clip, beats: breakdown.beats } : null);
      setLoading(false);
    })();
  }, [conceptId]);

  return { film, loading };
}

function CompareSlot({
  sports,
  concepts,
  label,
}: {
  sports: Sport[];
  concepts: Concept[];
  label: string;
}) {
  const [conceptId, setConceptId] = useState("");
  const { film, loading } = useConceptFilm(conceptId);
  const concept = concepts.find((c) => c.id === conceptId);

  return (
    <div className="flex flex-col gap-3">
      <ConceptPicker sports={sports} concepts={concepts} value={conceptId} onChange={setConceptId} label={label} />
      {concept && (
        <div>
          <p className="font-display text-lg uppercase tracking-wide">{concept.title}</p>
          {concept.summary && <p className="text-sm text-text-dim">{concept.summary}</p>}
        </div>
      )}
      {loading && <div className="pb-skeleton aspect-video w-full" />}
      {!loading && film && <BreakdownPlayer clip={film.clip} beats={film.beats} />}
      {!loading && conceptId && !film && (
        <p className="text-sm text-text-dim">No film breakdown for this concept yet.</p>
      )}
    </div>
  );
}

export function Compare() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);

  useEffect(() => {
    (async () => {
      const [sportsRes, conceptsRes] = await Promise.all([
        supabase.from("sports").select("*").order("name"),
        supabase.from("concepts").select("*").order("sort_order"),
      ]);
      setSports(sportsRes.data ?? []);
      setConcepts(conceptsRes.data ?? []);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link to="/" className="text-xs text-text-dim hover:text-text">
        ← back
      </Link>
      <h1 className="mb-1 mt-2 font-display text-4xl uppercase tracking-wide">Compare</h1>
      <p className="mb-8 max-w-xl text-text-dim">
        Two concepts, side by side, same film-room breakdown tools on each. Useful for putting two players' takes
        on the same move next to each other.
      </p>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <CompareSlot sports={sports} concepts={concepts} label="Left" />
        <CompareSlot sports={sports} concepts={concepts} label="Right" />
      </div>
    </div>
  );
}
