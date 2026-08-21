import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Breakdown, Clip, Concept, Diagram, QuizItem } from "../types";
import { BreakdownPlayer } from "../components/BreakdownPlayer/BreakdownPlayer";
import { Chalkboard } from "../components/Chalkboard/Chalkboard";
import { Quiz } from "../components/Quiz/Quiz";
import { ChatPanel } from "../components/Chat/ChatPanel";

type Tab = "film" | "chalkboard" | "quiz" | "chat";

const TAB_META: Record<Tab, { label: string; icon: string }> = {
  film: { label: "Film", icon: "🎬" },
  chalkboard: { label: "Chalkboard", icon: "🖍️" },
  quiz: { label: "Quiz", icon: "✅" },
  chat: { label: "Ask about it", icon: "💬" },
};

// The explainer already has structure baked in (move → why it works →
// counter), it's just never rendered as such. Splitting on the two marker
// phrases every concept's body_md consistently uses.
function splitExplainer(body: string) {
  const whyMarker = "Why it works:";
  const counterMarker = "Counter:";
  const whyIdx = body.indexOf(whyMarker);
  if (whyIdx === -1) return { move: body.trim(), why: null as string | null, counter: null as string | null };

  const move = body.slice(0, whyIdx).trim();
  const counterIdx = body.indexOf(counterMarker, whyIdx);
  if (counterIdx === -1) {
    return { move, why: body.slice(whyIdx + whyMarker.length).trim(), counter: null };
  }
  const why = body.slice(whyIdx + whyMarker.length, counterIdx).trim();
  const counter = body.slice(counterIdx + counterMarker.length).trim();
  return { move, why, counter };
}

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
  const bannerClip = clipsById[breakdowns[0]?.clip_id];

  const tabs: Tab[] = (["film", "chalkboard", "quiz", "chat"] as Tab[]).filter((t) => {
    if (t === "film") return breakdowns.length > 0;
    if (t === "chalkboard") return !!diagram;
    if (t === "quiz") return quizItems.length > 0;
    return true;
  });

  const explainer = concept.body_md ? splitExplainer(concept.body_md) : null;

  return (
    <div>
      <div className="relative overflow-hidden border-b border-surface-border">
        {bannerClip?.youtube_id && (
          <img
            src={`https://img.youtube.com/vi/${bannerClip.youtube_id}/hqdefault.jpg`}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl"
          />
        )}
        <div className="relative mx-auto max-w-3xl px-6 py-10">
          <Link to="/" className="text-xs text-text-dim hover:text-text">
            ← back
          </Link>
          <h1 className="mt-2 font-display text-4xl uppercase tracking-wide">{concept.title}</h1>
          {concept.summary && <p className="mt-1 text-text-dim">{concept.summary}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <nav className="mb-6 flex gap-1 border-b border-surface-border">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors duration-200 ${
                tab === t
                  ? "border-accent text-text"
                  : "border-transparent text-text-dim hover:text-text"
              }`}
            >
              <span aria-hidden="true">{TAB_META[t].icon}</span>
              {TAB_META[t].label}
            </button>
          ))}
        </nav>

        <div>
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

          {explainer && (
            <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed">
              <div>
                <p className="mb-1 text-xs uppercase tracking-widest text-text-dim">The move</p>
                <p className="text-text-dim">{explainer.move}</p>
              </div>
              {explainer.why && (
                <div>
                  <p className="mb-1 text-xs uppercase tracking-widest text-text-dim">Why it works</p>
                  <p className="text-text-dim">{explainer.why}</p>
                </div>
              )}
              {explainer.counter && (
                <div className="border-l-4 border-secondary bg-surface py-2 pl-3">
                  <p className="mb-1 text-xs uppercase tracking-widest text-secondary">Counter</p>
                  <p className="text-text-dim">{explainer.counter}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
