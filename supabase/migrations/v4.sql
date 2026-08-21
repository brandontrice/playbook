-- Playbook v4 migration: real user accounts (progress + streaks + bookmarks)
-- Run whole file in Supabase > SQL Editor.
--
-- user_progress already existed (created in v1, unused until now, RLS
-- already scoped to auth.uid() = user_id). Adds completed_at so a daily
-- streak can be derived client-side from distinct completion dates rather
-- than maintaining a separate counter that could drift out of sync.
-- Adds a new bookmarks table with the same owner-only RLS shape.

alter table user_progress
  add column if not exists completed_at timestamptz;

create table if not exists bookmarks (
  user_id uuid not null,
  concept_id uuid not null references concepts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, concept_id)
);

alter table bookmarks enable row level security;

drop policy if exists bookmarks_owner on bookmarks;
create policy bookmarks_owner on bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
