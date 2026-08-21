-- Playbook v5 migration: concept collections (curated playlists)
-- Run whole file in Supabase > SQL Editor.
--
-- A collection is an ordered sequence of concepts ("Defense 101: 5 concepts
-- in order"), same public-read / admin-write RLS shape as every other
-- content table.

create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists collection_concepts (
  collection_id uuid not null references collections(id) on delete cascade,
  concept_id uuid not null references concepts(id) on delete cascade,
  sort_order int not null default 0,
  primary key (collection_id, concept_id)
);

alter table collections enable row level security;
alter table collection_concepts enable row level security;

do $$
declare
  t text;
begin
  for t in select unnest(array['collections', 'collection_concepts'])
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
