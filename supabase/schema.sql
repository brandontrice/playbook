-- Playbook, full schema (source of truth for a fresh install)
-- Run whole file in Supabase > SQL Editor.
-- Kept in sync with supabase/migrations/ by hand: every migration that ships
-- gets folded in here too, so this file alone reproduces the current schema.
--
-- Sports concept library + synced film-breakdown player + chalkboard diagrams
-- + quiz items. Public read on all content tables; writes restricted to the
-- admin email via RLS (checked against auth.jwt()). embedding columns are
-- present now (pgvector) but unused until v1.1's RAG upgrade, v1's AI chat
-- stuffs the small concept corpus into the prompt directly instead.

create extension if not exists vector;
create extension if not exists pgcrypto;

create table if not exists sports (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists concepts (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references sports(id) on delete cascade,
  parent_id uuid references concepts(id) on delete set null,
  slug text unique not null,
  title text not null,
  summary text,
  body_md text,
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  embedding vector(768),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists concepts_sport_id_idx on concepts(sport_id);
create index if not exists concepts_parent_id_idx on concepts(parent_id);

create table if not exists clips (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,
  start_sec numeric not null default 0,
  end_sec numeric,
  title text not null,
  teams text[] not null default '{}',
  players text[] not null default '{}',
  season text,
  quality text not null default 'canonical' check (quality in ('canonical', 'counter', 'failed')),
  status text not null default 'active' check (status in ('active', 'dead')),
  created_at timestamptz not null default now()
);

create table if not exists clip_concepts (
  clip_id uuid not null references clips(id) on delete cascade,
  concept_id uuid not null references concepts(id) on delete cascade,
  primary key (clip_id, concept_id)
);

create table if not exists breakdowns (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid not null references clips(id) on delete cascade,
  concept_id uuid not null references concepts(id) on delete cascade,
  -- beats: [{t: 14.2, action: 'pause'|'note', caption: '...',
  --          overlay: {arrows: [{x1,y1,x2,y2}], circles: [{x,y,r}]} (percent-of-player coords),
  --          resume_after: number|null}]
  beats jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists breakdowns_concept_id_idx on breakdowns(concept_id);
create index if not exists breakdowns_clip_id_idx on breakdowns(clip_id);

create table if not exists diagrams (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references concepts(id) on delete cascade,
  surface text not null default 'halfcourt',
  -- spec: {players: [{id,x,y,team}], ball: {x,y}, annotations: [{type:'arrow'|'screen'|'label', ...}]}
  -- x/y are percent-of-surface coordinates (0-100), single static frame for v1.
  spec jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists quiz_items (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references concepts(id) on delete cascade,
  clip_id uuid references clips(id) on delete set null,
  diagram_id uuid references diagrams(id) on delete set null,
  prompt text not null,
  choices jsonb not null default '[]',
  answer_idx smallint not null,
  created_at timestamptz not null default now()
);

create table if not exists concept_links (
  from_id uuid not null references concepts(id) on delete cascade,
  to_id uuid not null references concepts(id) on delete cascade,
  relation text not null check (relation in ('counter', 'prereq', 'variant')),
  primary key (from_id, to_id, relation)
);

-- created now, wired up in v1.1 once real user accounts exist
create table if not exists user_progress (
  user_id uuid not null,
  concept_id uuid not null references concepts(id) on delete cascade,
  status text not null default 'seen' check (status in ('seen', 'learning', 'known')),
  next_review timestamptz,
  streak int not null default 0,
  primary key (user_id, concept_id)
);

-- row level security: public read on all content, writes restricted to the admin account
alter table sports enable row level security;
alter table concepts enable row level security;
alter table clips enable row level security;
alter table clip_concepts enable row level security;
alter table breakdowns enable row level security;
alter table diagrams enable row level security;
alter table quiz_items enable row level security;
alter table concept_links enable row level security;
alter table user_progress enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'sports', 'concepts', 'clips', 'clip_concepts',
    'breakdowns', 'diagrams', 'quiz_items', 'concept_links'
  ])
  loop
    execute format('drop policy if exists %I_public_read on %I', t, t);
    execute format(
      'create policy %I_public_read on %I for select using (true)', t, t
    );
    execute format('drop policy if exists %I_admin_write on %I', t, t);
    execute format(
      'create policy %I_admin_write on %I for all using ((auth.jwt() ->> ''email'') = ''btrice9595@gmail.com'') with check ((auth.jwt() ->> ''email'') = ''btrice9595@gmail.com'')',
      t, t
    );
  end loop;
end $$;

drop policy if exists user_progress_owner on user_progress;
create policy user_progress_owner on user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
