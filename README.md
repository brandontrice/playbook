# Playbook

Sports concepts, taught through real film. Curated YouTube clips get a synced "breakdown" layer (caption/arrow overlay at specific timestamps while the video keeps playing, a beat can optionally pause instead), plus a chalk-textured X's-and-O's chalkboard tab, a quiz mode, and an AI chat explainer grounded in the concept library. Custom cinematic player (own scrubber, broadcast lower-third captions, arrows that draw themselves). See [CLAUDE.md](./CLAUDE.md) for style/conventions and the project plan for full scope.

Two themes: **MyPark** (modern, default) and **Showtime** (90s vibe). Toggle in the top-right nav.

## Stack

- Vite + React + TypeScript + Tailwind v4, talking to Supabase directly via `supabase-js` (no custom backend for reads/writes)
- Supabase (Postgres + pgvector + Auth), free tier, cloud-hosted so it works from any network today
- One Vercel serverless function (`api/chat.ts`) proxies Groq for the AI chat feature. It's the only place a server-side secret is used at request time
- `api/og.tsx` (Edge runtime, `@vercel/og`) generates a per-concept share-card image (film still + title + beat count) on request
- `middleware.ts` (Vercel Routing Middleware, project root) injects real per-concept `<meta>`/OG tags for `/concepts/:slug` so link previews (Slack, iMessage, Twitter/X, etc.) show the actual concept instead of one generic card for the whole SPA. Needs a live post-deploy check with an actual link-preview tool, this can't be verified locally
- Deployed on Vercel, connected to this GitHub repo for auto-deploy on push to `main`

## First-time setup

1. **Apply the schema.** Open the Supabase project's SQL Editor and run the entire contents of `supabase/schema.sql` once. (Migrations after this ship as `supabase/migrations/vN.sql`, run each new one the same way, and fold it into `schema.sql` too.)
2. **Env vars.** Copy `.env.example` to `.env.local` and fill in the Supabase URL/keys and Groq key. Never commit `.env.local`.
3. **Install + run:**
   ```
   npm install
   npm run dev
   ```
4. **Seed content** (optional, once the schema is applied): `npm run seed` populates `scripts/seed.ts`'s 16 concepts across basketball and football (uses the service-role key locally, bypasses RLS, never deploy this key).
5. **Deploy:** push to `main`. Vercel auto-deploys. Mirror the same env vars from `.env.local` into the Vercel project's Environment Variables (Production + Preview), using the non-`VITE_` names for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GROQ_API_KEY` since those are server-only.

## Admin / authoring

`/admin` is gated to a single admin email (`btrice9595@gmail.com`) via Supabase magic-link auth and RLS policies in `schema.sql`. Sign in there to add sports, concepts, clips, breakdowns (the beat timeline), chalkboard diagrams, and quiz items. Beats/diagram/quiz shapes are JSON textareas for now (see the templates in the form), not yet a visual editor.

## What's deferred to v1.1 (EliteDesk self-host phase)

Real multi-user accounts + progress tracking, true pgvector RAG for chat (v1 stuffs the whole, currently small, concept corpus into the prompt instead), Remotion → TikTok export, a multi-frame animated diagram player, and a dead-YouTube-link sweep. See the project plan for the full list.
