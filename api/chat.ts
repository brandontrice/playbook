import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Corpus-stuffed chat, not RAG. Fine while the concept library is small.
// RAG_UPGRADE_THRESHOLD below is the trigger to revisit that.
const RAG_UPGRADE_THRESHOLD = 40;

// This is a public, unauthenticated endpoint that calls Groq on every
// request, so it needs its own abuse protection: a simple per-IP sliding
// window backed by the chat_rate_limit table (checked/written with the
// service-role key, no public RLS policy needed), plus hard caps on
// request shape so one request can't blow up the prompt size either.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_PER_WINDOW = 8;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

function getIdentifier(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(",")[0];
  return (ip ?? req.socket?.remoteAddress ?? "unknown").trim();
}

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  new: "The user has never watched this sport. Avoid jargon entirely, or define it immediately in plain language the first time you use it.",
  casual: "The user watches casually and knows the basics. You can use common terms without defining them, but keep explanations grounded and concrete.",
  superfan: "The user knows the sport well. Go deep: technique, timing, reads, counters, without over-explaining fundamentals.",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  const groqKey = process.env.GROQ_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!groqKey || !supabaseUrl || !serviceRoleKey) {
    res.status(500).json({ error: "chat is not configured on the server yet" });
    return;
  }

  const { messages, conceptSlug, difficulty } = req.body as {
    messages: ChatMessage[];
    conceptSlug?: string;
    difficulty?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages required" });
    return;
  }
  if (messages.length > MAX_MESSAGES || messages.some((m) => (m.content?.length ?? 0) > MAX_MESSAGE_LENGTH)) {
    res.status(400).json({ error: "message too long or too many messages in this conversation" });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const identifier = getIdentifier(req);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  const { count: recentCount } = await supabase
    .from("chat_rate_limit")
    .select("id", { count: "exact", head: true })
    .eq("identifier", identifier)
    .gte("created_at", windowStart);

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX_PER_WINDOW) {
    res.status(429).json({ error: "Too many requests, slow down a bit and try again in a minute." });
    return;
  }
  await supabase.from("chat_rate_limit").insert({ identifier });
  // Cheap probabilistic cleanup instead of a separate cron job just for this.
  if (Math.random() < 0.05) {
    void supabase.from("chat_rate_limit").delete().lt("created_at", new Date(Date.now() - 3600_000).toISOString());
  }

  const { data: concepts, count: conceptCount } = await supabase
    .from("concepts")
    .select("title, summary, body_md, slug", { count: "exact" })
    .order("sort_order")
    .limit(50);

  // Corpus-stuffing (the whole library in the system prompt) is fine at
  // today's size, but silently degrades as the library grows: bigger
  // prompts, slower/costlier responses, and eventually truncation past the
  // .limit(50) cap above. This doesn't fix that, it just makes it loud
  // instead of silent, watch the Vercel function logs.
  if ((conceptCount ?? 0) >= RAG_UPGRADE_THRESHOLD) {
    console.warn(
      `[chat] concept count (${conceptCount}) has reached the RAG_UPGRADE_THRESHOLD (${RAG_UPGRADE_THRESHOLD}). Corpus-stuffing still works but this is the trigger to build real pgvector retrieval instead.`,
    );
  }

  const corpus = (concepts ?? [])
    .map((c) => `### ${c.title}${c.slug === conceptSlug ? " (current concept)" : ""}\n${c.summary ?? ""}\n${c.body_md ?? ""}`)
    .join("\n\n");

  const difficultyLine = DIFFICULTY_INSTRUCTIONS[difficulty ?? "casual"] ?? DIFFICULTY_INSTRUCTIONS.casual;

  const systemPrompt = `You are Playbook's film-room explainer. You teach sports concepts the way a good coach breaks down tape, grounded in real examples. ${difficultyLine}

Only use the concept library below as ground truth for specifics (names of plays/coverages, how they work, counters). If something isn't covered by it, say so plainly rather than inventing detail.

# Concept library
${corpus}`;

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature: 0.4,
    }),
  });

  if (!groqRes.ok) {
    const text = await groqRes.text();
    res.status(502).json({ error: "chat provider error", detail: text });
    return;
  }

  const data = (await groqRes.json()) as { choices?: { message?: { content?: string } }[] };
  const reply = data.choices?.[0]?.message?.content ?? "Hmm, I don't have an answer for that right now.";
  res.status(200).json({ reply });
}
