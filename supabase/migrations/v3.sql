-- Playbook v3 migration: chat rate limiting
-- Run whole file in Supabase > SQL Editor.
--
-- api/chat.ts is a public, unauthenticated endpoint that calls Groq on
-- every request, nothing was stopping abuse from burning through the
-- Groq key's budget. This table backs a simple per-identifier (IP) sliding
-- window rate limit, checked/written server-side with the service-role
-- key, so no public RLS policies are needed here at all.

create table if not exists chat_rate_limit (
  id bigint generated always as identity primary key,
  identifier text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_rate_limit_identifier_idx on chat_rate_limit(identifier, created_at);

alter table chat_rate_limit enable row level security;
