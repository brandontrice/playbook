-- Playbook v2 migration: clip orientation
-- Run whole file in Supabase > SQL Editor.
--
-- The player frame was pillarboxing vertical clips (Shorts) inside a wide
-- landscape stage, mostly dead black space. Fixing that needs to know each
-- clip's orientation up front rather than guessing at render time, so this
-- adds it as a real column, set once per clip in the admin screen.

alter table clips
  add column if not exists orientation text not null default 'landscape'
    check (orientation in ('landscape', 'portrait'));
