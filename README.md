# Playbook

Sports concepts, taught through real film. Curated YouTube clips get a synced "breakdown" layer (caption/arrow overlay at specific timestamps while the video keeps playing, a beat can optionally pause instead), plus a chalk-textured X's-and-O's chalkboard tab, a quiz mode, and an AI chat explainer grounded in the concept library. Custom cinematic player (own scrubber, broadcast lower-third captions, arrows that draw themselves). See [CLAUDE.md](./CLAUDE.md) for style/conventions and the project plan for full scope.

Committed to one theme, **MyPark**. Showtime's tokens are still fully defined in `src/index.css` and `ThemeToggle.tsx` still exists, just not rendered in the nav, see `CLAUDE.md`.

## Stack

- Vite + React + TypeScript + Tailwind v4, talking to Supabase directly via `supabase-js` (no custom backend for reads/writes)
- Supabase (Postgres + pgvector + Auth), free tier, cloud-hosted so it works from any network today. Real accounts via magic-link auth, backing per-user progress/streaks and bookmarks (`user_progress`, `bookmarks` tables, owner-only RLS)
- One Vercel serverless function (`api/chat.ts`) proxies Groq for the AI chat feature, rate-limited per IP (`chat_rate_limit` table). It's the only place the Groq key is used
- `api/check-dead-links.ts`, invoked nightly by Vercel Cron (`vercel.json`), pings every active clip's YouTube oEmbed endpoint and flips dead ones to `status: 'dead'`, which the app then filters out everywhere clips are queried. Gated by `CRON_SECRET`
- `api/og.tsx` (Edge runtime, `@vercel/og`) generates a per-concept share-card image (film still + title + beat count) on request
- `middleware.ts` (Vercel Routing Middleware, project root) injects real per-concept `<meta>`/OG tags and schema.org VideoObject JSON-LD for `/concepts/:slug`, and generates `/sitemap.xml` from the live concept list. Needs a live post-deploy check with an actual link-preview tool for the OG piece, that can't be verified locally
- Error monitoring (`src/lib/sentry.ts`) and Vercel Analytics wired in, Sentry no-ops until `VITE_SENTRY_DSN` is set (see `.env.example`)
- CI: `.github/workflows/ci.yml` runs typecheck + build on every push/PR to `main`
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
5. **Deploy:** push to `main`. Vercel auto-deploys. Mirror the same env vars from `.env.local` into the Vercel project's Environment Variables (Production + Preview), using the non-`VITE_` names for `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `GROQ_API_KEY` since those are server-only, and also set `CRON_SECRET` there so `api/check-dead-links.ts` accepts Vercel Cron's invocation.

## Admin / authoring

`/admin` is gated to a single admin email (`btrice9595@gmail.com`) via Supabase magic-link auth and RLS policies in `schema.sql`. Sign in there to add sports, concepts, clips, breakdowns (the beat timeline), chalkboard diagrams, and quiz items, one at a time or several at once via the bulk-import textareas. Beats/diagram/quiz shapes are JSON textareas for now (see the templates in the form), not yet a visual editor. The "Existing concepts" list has a "Preview" link per concept, opening the live page in a new tab.

## What's still deferred

True pgvector RAG for chat (v1 stuffs the whole, currently small, concept corpus into the prompt instead, see `RAG_UPGRADE_THRESHOLD` in `api/chat.ts`), Remotion → TikTok export, a multi-frame animated diagram player, and curated concept collections/learning paths. See the project plan for the full list.
