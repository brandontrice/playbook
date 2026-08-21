import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import type { Concept, Sport } from "../../types";

// A "pause" beat auto-resumes after ~2.5s by default (no need to set
// resume_after for that). Set resume_after to a number for a custom delay,
// or to null if you genuinely want it to wait for a manual "Continue"
// click (e.g. a quiz-style "guess what happens next" moment).
const BEATS_TEMPLATE = `[
  { "t": 4.5, "action": "pause", "caption": "Watch the screener's angle here.",
    "overlay": { "arrows": [{ "x1": 30, "y1": 60, "x2": 45, "y2": 40 }] } },
  { "t": 9, "action": "pause", "caption": "That's the slip, weak-side help never rotates in time.",
    "resume_after": 3 }
]`;

const DIAGRAM_TEMPLATE = `{
  "players": [
    { "id": "1", "x": 50, "y": 50, "team": "offense" },
    { "id": "X", "x": 45, "y": 30, "team": "defense" }
  ],
  "ball": { "x": 50, "y": 50 },
  "annotations": [
    { "type": "arrow", "x1": 50, "y1": 50, "x2": 70, "y2": 30 }
  ]
}`;

const QUIZ_TEMPLATE = `["Choice A", "Choice B", "Choice C", "Choice D"]`;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 rounded-[var(--radius-pb)] border border-surface-border bg-surface p-5">
      <h2 className="mb-3 font-display text-lg">{title}</h2>
      {children}
    </section>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm outline-none focus:border-primary"
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 font-mono text-xs outline-none focus:border-primary"
    />
  );
}

function SubmitButton({ label }: { label: string }) {
  return (
    <button type="submit" className="w-fit rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-black">
      {label}
    </button>
  );
}

export function AdminHome() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [clips, setClips] = useState<{ id: string; title: string }[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  async function refresh() {
    const [s, c, cl] = await Promise.all([
      supabase.from("sports").select("*").order("name"),
      supabase.from("concepts").select("*").order("sort_order"),
      supabase.from("clips").select("id,title").order("title"),
    ]);
    setSports(s.data ?? []);
    setConcepts(c.data ?? []);
    setClips(cl.data ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  function flash(msg: string) {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3000);
  }

  async function createSport(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const slug = form.get("slug") as string;
    const { error } = await supabase.from("sports").insert({ name, slug });
    flash(error ? error.message : "Sport created.");
    e.currentTarget.reset();
    refresh();
  }

  async function createConcept(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("concepts").insert({
      sport_id: form.get("sport_id"),
      title: form.get("title"),
      slug: form.get("slug"),
      summary: form.get("summary"),
      body_md: form.get("body_md"),
      difficulty: Number(form.get("difficulty")) || 1,
    });
    flash(error ? error.message : "Concept created.");
    e.currentTarget.reset();
    refresh();
  }

  async function createClip(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const teams = (form.get("teams") as string).split(",").map((s) => s.trim()).filter(Boolean);
    const players = (form.get("players") as string).split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("clips").insert({
      youtube_id: form.get("youtube_id"),
      title: form.get("title"),
      start_sec: Number(form.get("start_sec")) || 0,
      teams,
      players,
      season: form.get("season") || null,
      quality: form.get("quality") || "canonical",
    });
    flash(error ? error.message : "Clip created.");
    e.currentTarget.reset();
    refresh();
  }

  async function createBreakdown(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const beats = JSON.parse(form.get("beats") as string);
      const { error } = await supabase.from("breakdowns").insert({
        clip_id: form.get("clip_id"),
        concept_id: form.get("concept_id"),
        beats,
      });
      flash(error ? error.message : "Breakdown created.");
      e.currentTarget.reset();
    } catch {
      flash("Beats JSON is invalid, check the format.");
    }
  }

  async function createDiagram(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const spec = JSON.parse(form.get("spec") as string);
      const { error } = await supabase.from("diagrams").insert({
        concept_id: form.get("concept_id"),
        spec,
      });
      flash(error ? error.message : "Diagram created.");
      e.currentTarget.reset();
    } catch {
      flash("Diagram JSON is invalid, check the format.");
    }
  }

  async function createQuizItem(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const choices = JSON.parse(form.get("choices") as string);
      const { error } = await supabase.from("quiz_items").insert({
        concept_id: form.get("concept_id"),
        prompt: form.get("prompt"),
        choices,
        answer_idx: Number(form.get("answer_idx")) || 0,
      });
      flash(error ? error.message : "Quiz item created.");
      e.currentTarget.reset();
    } catch {
      flash("Choices JSON is invalid, check the format.");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-1 font-display text-2xl">Authoring</h1>
      <p className="mb-6 text-sm text-text-dim">Create sports, concepts, clips, and their breakdowns.</p>
      {status && <p className="mb-4 text-sm text-primary">{status}</p>}

      <Section title="Sport">
        <form onSubmit={createSport} className="flex flex-wrap items-end gap-2">
          <TextInput name="name" placeholder="Basketball" required />
          <TextInput name="slug" placeholder="basketball" required />
          <SubmitButton label="Add sport" />
        </form>
      </Section>

      <Section title="Concept">
        <form onSubmit={createConcept} className="flex flex-col gap-2">
          <select name="sport_id" required className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
            <option value="">Sport…</option>
            {sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <TextInput name="title" placeholder="Spain Pick-and-Roll" required />
          <TextInput name="slug" placeholder="spain-pnr" required />
          <TextInput name="summary" placeholder="One-line summary" />
          <TextArea name="body_md" placeholder="Full explainer (markdown)" rows={3} />
          <TextInput name="difficulty" type="number" min={1} max={5} placeholder="Difficulty 1-5" />
          <SubmitButton label="Add concept" />
        </form>
      </Section>

      <Section title="Clip">
        <form onSubmit={createClip} className="flex flex-col gap-2">
          <TextInput name="youtube_id" placeholder="YouTube video ID (e.g. dQw4w9WgXcQ)" required />
          <TextInput name="title" placeholder="Nuggets vs Lakers, Spain PnR" required />
          <TextInput name="start_sec" type="number" placeholder="Start second" />
          <TextInput name="teams" placeholder="DEN, LAL (comma separated)" />
          <TextInput name="players" placeholder="Jokic, Murray (comma separated)" />
          <TextInput name="season" placeholder="2023-24" />
          <select name="quality" className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
            <option value="canonical">canonical</option>
            <option value="counter">counter</option>
            <option value="failed">failed</option>
          </select>
          <SubmitButton label="Add clip" />
        </form>
      </Section>

      <Section title="Breakdown (beats)">
        <form onSubmit={createBreakdown} className="flex flex-col gap-2">
          <select name="concept_id" required className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
            <option value="">Concept…</option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <select name="clip_id" required className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
            <option value="">Clip…</option>
            {clips.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <TextArea name="beats" defaultValue={BEATS_TEMPLATE} rows={8} />
          <SubmitButton label="Add breakdown" />
        </form>
      </Section>

      <Section title="Chalkboard diagram">
        <form onSubmit={createDiagram} className="flex flex-col gap-2">
          <select name="concept_id" required className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
            <option value="">Concept…</option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <TextArea name="spec" defaultValue={DIAGRAM_TEMPLATE} rows={8} />
          <SubmitButton label="Add diagram" />
        </form>
      </Section>

      <Section title="Quiz item">
        <form onSubmit={createQuizItem} className="flex flex-col gap-2">
          <select name="concept_id" required className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
            <option value="">Concept…</option>
            {concepts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <TextInput name="prompt" placeholder="What coverage is this?" required />
          <TextArea name="choices" defaultValue={QUIZ_TEMPLATE} rows={2} />
          <TextInput name="answer_idx" type="number" min={0} placeholder="Correct choice index (0-based)" />
          <SubmitButton label="Add quiz item" />
        </form>
      </Section>
    </div>
  );
}
