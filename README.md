# Playbook

Sports concepts, taught through real film. Curated YouTube clips get a synced "breakdown" layer (pause, caption, arrow overlay at specific timestamps), plus a static X's-and-O's chalkboard tab, a quiz mode, and an AI chat explainer grounded in the concept library. See [CLAUDE.md](./CLAUDE.md) for style/conventions and the project plan for full scope.

Two themes: **MyPark** (modern, default) and **Showtime** (90s vibe) — toggle in the top-right nav.

## Stack

- Vite + React + TypeScript + Tailwind v4, talking to Supabase directly via `supabase-js` (no custom backend for reads/writes)
- Supabase (Postgres + pgvector + Auth) — free tier, cloud-hosted so it works from any network today
- One Vercel serverless function (`api/chat.ts`) proxies Groq for the AI chat feature — the only place a server-side secret is used at request time
- Deployed on Vercel, connected to this GitHub repo for auto-deploy on push to `main`

## First-time setup

1. **Apply the schema.** Open the Supabase project's SQL Editor and run the entire contents of `supabase/schema.sql` once. (Migrations after this ship as `supabase/migrations/vN.sql` — run each new one the same way, and fold it into `schema.sql` too.)
2. **Env vars.** Copy `.env.example` to `.env.local` and fill in the Supabase URL/keys and Groq key. Never commit `.env.local`.
3. **Install + run:**
   ```
   npm install
   npm run dev
   ```
4. **Seed content** (optional, once the schema is applied): `npm run seed` — populates `scripts/seed.ts`'s 10 concepts (uses the service-role key locally, bypasses RLS, never deploy this key).
5. **Deploy:** push to `main` — Vercel auto-deploys. Mirror the same env vars from `.env.local` into the Vercel project's Environment Variables (Production + Preview), using the non-`VITE_` names for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GROQ_API_KEY` since those are server-only.

## Admin / authoring

`/admin` is gated to a single admin email (`btrice9595@gmail.com`) via Supabase magic-link auth and RLS policies in `schema.sql`. Sign in there to add sports, concepts, clips, breakdowns (the beat timeline), chalkboard diagrams, and quiz items — beats/diagram/quiz shapes are JSON textareas for now (see the templates in the form), not yet a visual editor.

## What's deferred to v1.1 (EliteDesk self-host phase)

Real multi-user accounts + progress tracking, true pgvector RAG for chat (v1 stuffs the whole — small — concept corpus into the prompt instead), Remotion → TikTok export, a multi-frame animated diagram player, and a dead-YouTube-link sweep. See the project plan for the full list.
