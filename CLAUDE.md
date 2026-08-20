# Playbook

Sports concept-learning app — music-theory explainers, but for sports, and film-first. Curated YouTube clips (embedded via the official player, never hosted footage) carry a synced "breakdown" annotation layer (pause/caption/arrow overlay at timestamps); a static X's-and-O's "chalkboard" diagram is the secondary abstraction tab; a small quiz mode and an AI chat explainer round out the concept page. See `README.md` for the current architecture and `supabase/schema.sql` for the data model.

## Visual style

Two selectable themes, both implemented as CSS-variable token sets under `src/themes/` and toggled via `data-theme` on `<html>` (see `src/lib/theme.tsx`):

- **`modern`** ("MyPark") — the default. NBA 2K / MyPark vibe: dark court-at-night backdrop, neon accent glows, glassy/blurred surfaces, condensed display type.
- **`classic`** ("Showtime") — 90s Lakers-Celtics / Jordan-era vibe: parquet-floor texture, warm film-grain, vintage broadcast color (gold/purple, green/white, red/black/white), varsity/collegiate display type.

No team logos, wordmarks, or league branding assets — those are trademarked. The vibe is carried entirely by color, type, and CSS-generated texture (grain, parquet pattern, glow), not by ripped assets. When adding new UI, style both themes via the token layer rather than hardcoding colors in components, so new screens don't silently work in only one theme.

## SQL style for this project

(From `schema.sql`'s own header comment.) Keywords lowercase (`select`, `from`, `where`, `create table`, etc.), never capitalized; table and column identifiers keep whatever case they were created with. New migrations follow the `vN.sql` pattern used across Brandon's Supabase projects: a header comment stating what the file does and "Run whole file in Supabase > SQL Editor," full standalone runnable SQL (not a diff) — never a partial `ALTER`-only fragment that depends on a prior file's state. When a change ships, fold it into `schema.sql` too, same as `cate-photo`, so it stays the single source of truth for a fresh install.

## Secrets

`.env.local` holds real keys and is gitignored — never commit it, never put the Supabase service-role key or the Groq key in anything that ships to the browser (only `VITE_`-prefixed vars reach the client bundle). The service-role key is used only in local one-off scripts (e.g. `scripts/seed.ts`) that need to bypass RLS; the Groq key is used only inside the `api/chat` serverless function.

## Git

Commit and push to https://github.com/brandontrice/playbook at relevant milestone moments (not every small step) — see the milestone list in the project plan.
