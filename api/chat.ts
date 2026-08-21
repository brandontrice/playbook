import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

// Corpus-stuffed chat, not RAG. Fine while the concept library is small
// (a handful of concepts). Upgrade to real pgvector retrieval in v1.1 once
// the library outgrows what fits comfortably in a system prompt.

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  new: "The user has never watched this sport. Avoid jargon entirely, or define it immediately in plain language the first time you use it.",
  casual: "The user watches casually and knows the basics. You can use common terms without defining them, but keep explanations grounded and concrete.",
  "hoops-head": "The user knows the sport well. Go deep: technique, spacing, timing, counters, without over-explaining fundamentals.",
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

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: concepts } = await supabase
    .from("concepts")
    .select("title, summary, body_md, slug")
    .order("sort_order")
    .limit(50);

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
