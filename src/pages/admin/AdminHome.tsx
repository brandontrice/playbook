import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";
import type { Collection, Concept, Sport } from "../../types";

const BULK_CLIPS_TEMPLATE = `dQw4w9WgXcQ,Nuggets vs Lakers Spain PnR,124,DEN|LAL,Jokic|Murray,2023-24,canonical,landscape`;
const BULK_CONCEPTS_TEMPLATE = `basketball,Spain Pick-and-Roll,spain-pnr,A back screen on the screener's defender,3`;

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

type BeatRow = {
  t: string;
  action: "note" | "pause";
  caption: string;
  arrow: boolean;
  x1: string;
  y1: string;
  x2: string;
  y2: string;
};

function emptyBeatRow(): BeatRow {
  return { t: "", action: "note", caption: "", arrow: false, x1: "", y1: "", x2: "", y2: "" };
}

function beatRowsToJson(rows: BeatRow[]) {
  return rows
    .filter((r) => r.t !== "" && r.caption.trim() !== "")
    .map((r) => {
      const beat: Record<string, unknown> = { t: Number(r.t), action: r.action, caption: r.caption.trim() };
      if (r.arrow && r.x1 !== "" && r.y1 !== "" && r.x2 !== "" && r.y2 !== "") {
        beat.overlay = { arrows: [{ x1: Number(r.x1), y1: Number(r.y1), x2: Number(r.x2), y2: Number(r.y2) }] };
      }
      return beat;
    });
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="mb-4 rounded-[var(--radius-pb)] border border-surface-border bg-surface">
      <summary className="cursor-pointer select-none px-5 py-3 font-display text-lg">{title}</summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
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

function BeatRowEditor({
  row,
  onChange,
  onRemove,
}: {
  row: BeatRow;
  onChange: (row: BeatRow) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-surface-border bg-bg-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          step="0.5"
          placeholder="t (sec)"
          value={row.t}
          onChange={(e) => onChange({ ...row, t: e.target.value })}
          className="w-24 rounded-lg border border-surface-border bg-bg px-2 py-1 text-sm"
        />
        <select
          value={row.action}
          onChange={(e) => onChange({ ...row, action: e.target.value as BeatRow["action"] })}
          className="rounded-lg border border-surface-border bg-bg px-2 py-1 text-sm"
        >
          <option value="note">note (keeps playing)</option>
          <option value="pause">pause (stops, auto-resumes)</option>
        </select>
        <label className="ml-auto flex items-center gap-1.5 text-xs text-text-dim">
          <input
            type="checkbox"
            checked={row.arrow}
            onChange={(e) => onChange({ ...row, arrow: e.target.checked })}
          />
          arrow overlay
        </label>
        <button type="button" onClick={onRemove} className="text-xs text-accent-2 hover:underline">
          remove
        </button>
      </div>
      <input
        type="text"
        placeholder="Caption, what should the viewer notice right here"
        value={row.caption}
        onChange={(e) => onChange({ ...row, caption: e.target.value })}
        className="rounded-lg border border-surface-border bg-bg px-2 py-1 text-sm"
      />
      {row.arrow && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-text-dim">
          arrow from
          {(["x1", "y1", "x2", "y2"] as const).map((k) => (
            <input
              key={k}
              type="number"
              placeholder={k}
              value={row[k]}
              onChange={(e) => onChange({ ...row, [k]: e.target.value })}
              className="w-16 rounded-lg border border-surface-border bg-bg px-2 py-1 text-sm"
            />
          ))}
          <span>(0-100 scale, x1/y1 start, x2/y2 end)</span>
        </div>
      )}
    </div>
  );
}

export function AdminHome() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [clips, setClips] = useState<{ id: string; title: string }[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [beatRows, setBeatRows] = useState<BeatRow[]>([emptyBeatRow()]);
  const [useRawBeatsJson, setUseRawBeatsJson] = useState(false);
  const [rawBeatsJson, setRawBeatsJson] = useState("[]");
  const [bulkConceptsText, setBulkConceptsText] = useState("");
  const [bulkClipsText, setBulkClipsText] = useState("");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionMembers, setCollectionMembers] = useState<Record<string, { concept_id: string; title: string }[]>>({});

  async function refresh() {
    const [s, c, cl, coll, links] = await Promise.all([
      supabase.from("sports").select("*").order("name"),
      supabase.from("concepts").select("*").order("sort_order"),
      supabase.from("clips").select("id,title").order("title"),
      supabase.from("collections").select("*").order("sort_order"),
      supabase.from("collection_concepts").select("collection_id, concept_id, sort_order, concepts(title)").order("sort_order"),
    ]);
    setSports(s.data ?? []);
    setConcepts(c.data ?? []);
    setClips(cl.data ?? []);
    setCollections(coll.data ?? []);

    const membersByCollection: Record<string, { concept_id: string; title: string }[]> = {};
    for (const row of links.data ?? []) {
      const concept = row.concepts as unknown as { title: string } | null;
      (membersByCollection[row.collection_id] ??= []).push({
        concept_id: row.concept_id,
        title: concept?.title ?? "(unknown concept)",
      });
    }
    setCollectionMembers(membersByCollection);
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
      orientation: form.get("orientation") || "landscape",
    });
    flash(error ? error.message : "Clip created.");
    e.currentTarget.reset();
    refresh();
  }

  async function bulkImportConcepts(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const sportIdBySlug: Record<string, string> = {};
    for (const s of sports) sportIdBySlug[s.slug] = s.id;
    try {
      const rows = bulkConceptsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [sportSlug, title, slug, summary, difficulty] = line.split(",").map((s) => s.trim());
          const sport_id = sportIdBySlug[sportSlug];
          if (!sport_id) throw new Error(`Unknown sport slug "${sportSlug}", add that sport first.`);
          if (!title || !slug) throw new Error(`Missing title/slug on line: ${line}`);
          return { sport_id, title, slug, summary: summary || null, difficulty: Number(difficulty) || 1 };
        });
      if (rows.length === 0) throw new Error("Nothing to import.");
      const { error } = await supabase.from("concepts").insert(rows);
      flash(error ? error.message : `Imported ${rows.length} concept(s).`);
      setBulkConceptsText("");
      refresh();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Couldn't parse that, check the format.");
    }
  }

  async function bulkImportClips(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const rows = bulkClipsText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [youtube_id, title, start_sec, teams, players, season, quality, orientation] = line
            .split(",")
            .map((s) => s.trim());
          if (!youtube_id || !title) throw new Error(`Missing youtube_id/title on line: ${line}`);
          return {
            youtube_id,
            title,
            start_sec: Number(start_sec) || 0,
            teams: teams ? teams.split("|").map((s) => s.trim()).filter(Boolean) : [],
            players: players ? players.split("|").map((s) => s.trim()).filter(Boolean) : [],
            season: season || null,
            quality: quality || "canonical",
            orientation: orientation || "landscape",
          };
        });
      if (rows.length === 0) throw new Error("Nothing to import.");
      const { error } = await supabase.from("clips").insert(rows);
      flash(error ? error.message : `Imported ${rows.length} clip(s).`);
      setBulkClipsText("");
      refresh();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Couldn't parse that, check the format.");
    }
  }

  async function createCollection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("collections").insert({
      title: form.get("title"),
      slug: form.get("slug"),
      description: form.get("description") || null,
      sort_order: Number(form.get("sort_order")) || 0,
    });
    flash(error ? error.message : "Collection created.");
    e.currentTarget.reset();
    refresh();
  }

  async function addToCollection(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { error } = await supabase.from("collection_concepts").insert({
      collection_id: form.get("collection_id"),
      concept_id: form.get("concept_id"),
      sort_order: Number(form.get("sort_order")) || 0,
    });
    flash(error ? error.message : "Added to collection.");
    e.currentTarget.reset();
    refresh();
  }

  async function removeFromCollection(collectionId: string, conceptId: string) {
    const { error } = await supabase
      .from("collection_concepts")
      .delete()
      .eq("collection_id", collectionId)
      .eq("concept_id", conceptId);
    flash(error ? error.message : "Removed.");
    refresh();
  }

  async function createBreakdown(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    try {
      const beats = useRawBeatsJson ? JSON.parse(rawBeatsJson) : beatRowsToJson(beatRows);
      const { error } = await supabase.from("breakdowns").insert({
        clip_id: form.get("clip_id"),
        concept_id: form.get("concept_id"),
        beats,
      });
      flash(error ? error.message : "Breakdown created.");
      e.currentTarget.reset();
      setBeatRows([emptyBeatRow()]);
      setRawBeatsJson("[]");
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
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="mb-1 font-display text-2xl">Authoring</h1>
      <p className="mb-6 text-sm text-text-dim">Create sports, concepts, clips, and their breakdowns.</p>
      {status && <p className="mb-4 text-sm text-primary">{status}</p>}

      <div className="grid grid-cols-1 gap-x-6 lg:grid-cols-2">
        <div>
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

          <Section title="Existing concepts">
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {concepts.length === 0 && <p className="text-xs text-text-dim">None yet.</p>}
              {concepts.map((c) => (
                <div key={c.id} className="flex items-center justify-between gap-2 rounded-lg bg-bg-2 px-2.5 py-1.5 text-xs">
                  <span className="truncate text-text-dim">{c.title}</span>
                  <a
                    href={`/concepts/${c.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-primary hover:underline"
                  >
                    Preview ↗
                  </a>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Collections">
            <form onSubmit={createCollection} className="mb-3 flex flex-col gap-2">
              <TextInput name="title" placeholder="Defense 101" required />
              <TextInput name="slug" placeholder="defense-101" required />
              <TextInput name="description" placeholder="One-line description" />
              <TextInput name="sort_order" type="number" placeholder="Sort order (lower first)" />
              <SubmitButton label="Add collection" />
            </form>

            <form onSubmit={addToCollection} className="mb-4 flex flex-wrap items-end gap-2 border-t border-surface-border pt-3">
              <select name="collection_id" required className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
                <option value="">Collection…</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <select name="concept_id" required className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
                <option value="">Concept…</option>
                {concepts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <TextInput name="sort_order" type="number" placeholder="Order" />
              <SubmitButton label="Add to collection" />
            </form>

            <div className="flex flex-col gap-3">
              {collections.length === 0 && <p className="text-xs text-text-dim">No collections yet.</p>}
              {collections.map((coll) => (
                <div key={coll.id} className="rounded-lg bg-bg-2 p-2.5">
                  <p className="text-xs font-semibold text-text">{coll.title}</p>
                  <div className="mt-1 flex flex-col gap-1">
                    {(collectionMembers[coll.id] ?? []).map((m) => (
                      <div key={m.concept_id} className="flex items-center justify-between gap-2 text-xs text-text-dim">
                        <span className="truncate">{m.title}</span>
                        <button
                          type="button"
                          onClick={() => removeFromCollection(coll.id, m.concept_id)}
                          className="shrink-0 text-accent-2 hover:underline"
                        >
                          remove
                        </button>
                      </div>
                    ))}
                    {(collectionMembers[coll.id] ?? []).length === 0 && (
                      <p className="text-xs text-text-dim">Empty.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Bulk import concepts">
            <form onSubmit={bulkImportConcepts} className="flex flex-col gap-2">
              <p className="text-xs text-text-dim">
                One concept per line: <code className="text-[11px]">sport_slug,title,slug,summary,difficulty</code>
              </p>
              <TextArea
                value={bulkConceptsText}
                onChange={(e) => setBulkConceptsText(e.target.value)}
                placeholder={BULK_CONCEPTS_TEMPLATE}
                rows={5}
              />
              <SubmitButton label="Import concepts" />
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
              <select name="orientation" className="rounded-lg border border-surface-border bg-bg-2 px-3 py-1.5 text-sm">
                <option value="landscape">landscape (most YouTube videos)</option>
                <option value="portrait">portrait (Shorts, phone-recorded clips)</option>
              </select>
              <SubmitButton label="Add clip" />
            </form>
          </Section>

          <Section title="Bulk import clips">
            <form onSubmit={bulkImportClips} className="flex flex-col gap-2">
              <p className="text-xs text-text-dim">
                One clip per line:{" "}
                <code className="text-[11px]">youtube_id,title,start_sec,teams|pipe,players|pipe,season,quality,orientation</code>
              </p>
              <TextArea
                value={bulkClipsText}
                onChange={(e) => setBulkClipsText(e.target.value)}
                placeholder={BULK_CLIPS_TEMPLATE}
                rows={5}
              />
              <SubmitButton label="Import clips" />
            </form>
          </Section>
        </div>

        <div>
          <Section title="Breakdown (beats)" defaultOpen>
            <form onSubmit={createBreakdown} className="flex flex-col gap-3">
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

              <label className="flex items-center gap-1.5 text-xs text-text-dim">
                <input
                  type="checkbox"
                  checked={useRawBeatsJson}
                  onChange={(e) => setUseRawBeatsJson(e.target.checked)}
                />
                Use raw JSON instead of the beat builder
              </label>

              {useRawBeatsJson ? (
                <TextArea
                  value={rawBeatsJson}
                  onChange={(e) => setRawBeatsJson(e.target.value)}
                  rows={8}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  {beatRows.map((row, i) => (
                    <BeatRowEditor
                      key={i}
                      row={row}
                      onChange={(next) => setBeatRows((rows) => rows.map((r, ri) => (ri === i ? next : r)))}
                      onRemove={() => setBeatRows((rows) => rows.filter((_, ri) => ri !== i))}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setBeatRows((rows) => [...rows, emptyBeatRow()])}
                    className="w-fit rounded-full border border-surface-border px-3 py-1 text-xs text-text-dim hover:border-primary hover:text-text"
                  >
                    + add beat
                  </button>
                </div>
              )}

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
      </div>
    </div>
  );
}
