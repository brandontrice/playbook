import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Breakdown, Clip, Concept, Diagram, QuizItem } from "../types";
import { BreakdownPlayer } from "../components/BreakdownPlayer/BreakdownPlayer";
import { Chalkboard } from "../components/Chalkboard/Chalkboard";
import { Quiz } from "../components/Quiz/Quiz";
import { ChatPanel } from "../components/Chat/ChatPanel";

type Tab = "film" | "chalkboard" | "quiz" | "chat";

export function ConceptDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [concept, setConcept] = useState<Concept | null>(null);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [clipsById, setClipsById] = useState<Record<string, Clip>>({});
  const [diagram, setDiagram] = useState<Diagram | null>(null);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [tab, setTab] = useState<Tab>("film");
  const [activeClipIndex, setActiveClipIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data: conceptData } = await supabase.from("concepts").select("*").eq("slug", slug).single();
      if (!conceptData) {
        setLoading(false);
        return;
      }
      setConcept(conceptData);

      const [breakdownsRes, diagramRes, quizRes] = await Promise.all([
        supabase.from("breakdowns").select("*").eq("concept_id", conceptData.id),
        supabase.from("diagrams").select("*").eq("concept_id", conceptData.id).maybeSingle(),
        supabase.from("quiz_items").select("*").eq("concept_id", conceptData.id),
      ]);

      const bds: Breakdown[] = breakdownsRes.data ?? [];
      setBreakdowns(bds);
      setDiagram(diagramRes.data ?? null);
      setQuizItems(quizRes.data ?? []);

      const clipIds = [...new Set(bds.map((b) => b.clip_id))];
      if (clipIds.length > 0) {
        const { data: clips } = await supabase.from("clips").select("*").in("id", clipIds);
        const map: Record<string, Clip> = {};
        for (const c of clips ?? []) map[c.id] = c;
        setClipsById(map);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="pb-skeleton h-6 w-24" />
        <div className="pb-skeleton mt-3 h-9 w-2/3" />
        <div className="pb-skeleton mt-6 h-64 w-full" />
      </div>
    );
  }
  if (!concept) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10 text-center text-text-dim">
        <p className="font-display text-xl text-text">Air ball.</p>
        <p className="mt-1 text-sm">
          Couldn't find that concept.{" "}
          <Link to="/" className="text-primary underline">
            Back to the library
          </Link>
          .
        </p>
      </div>
    );
  }

  const activeBreakdown = breakdowns[activeClipIndex];
  const activeClip = activeBreakdown ? clipsById[activeBreakdown.clip_id] : null;

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: "film", label: "Film", show: breakdowns.length > 0 },
    { id: "chalkboard", label: "Chalkboard", show: !!diagram },
    { id: "quiz", label: "Quiz", show: quizItems.length > 0 },
    { id: "chat", label: "Ask about it", show: true },
  ];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/" className="text-xs text-text-dim hover:text-text">
        ← back
      </Link>
      <h1 className="mt-2 font-display text-3xl">{concept.title}</h1>
      {concept.summary && <p className="mt-1 text-text-dim">{concept.summary}</p>}

      <nav className="mt-6 flex gap-2 border-b border-surface-border pb-2">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                tab === t.id ? "bg-primary text-black font-semibold" : "text-text-dim hover:text-text"
              }`}
            >
              {t.label}
            </button>
          ))}
      </nav>

      <div className="mt-6">
        {tab === "film" && activeClip && activeBreakdown && (
          <div className="flex flex-col gap-4">
            {breakdowns.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {breakdowns.map((b, i) => {
                  const c = clipsById[b.clip_id];
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setActiveClipIndex(i)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        i === activeClipIndex ? "border-primary text-text" : "border-surface-border text-text-dim"
                      }`}
                    >
                      {c?.title ?? "clip"}
                    </button>
                  );
                })}
              </div>
            )}
            <BreakdownPlayer clip={activeClip} beats={activeBreakdown.beats} />
          </div>
        )}

        {tab === "chalkboard" && diagram && <Chalkboard diagram={diagram} />}
        {tab === "quiz" && <Quiz items={quizItems} />}
        {tab === "chat" && <ChatPanel conceptSlug={concept.slug} />}

        {concept.body_md && (
          <article className="mt-8 max-w-none whitespace-pre-wrap text-sm leading-relaxed text-text-dim">
            {concept.body_md}
          </article>
        )}
      </div>
    </div>
  );
}
