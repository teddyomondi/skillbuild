-- ============================================================================
-- CodePulse AI IDE — Supabase Schema for Adaptive Learning Paths & User Progress
-- Run this script in your Supabase Project -> SQL Editor
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Learner Profiles & Adaptive Path Snapshot
create table if not exists public.learner_profiles (
  learner_id text primary key,
  display_name text default 'Student',
  active_track_id text not null default 'frontend',
  active_node_id text not null default 'html-semantic-structure',
  tracks_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Per-Module Progress, Saved Code Files & Custom Generated Modules
create table if not exists public.learner_module_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id text not null references public.learner_profiles(learner_id) on delete cascade,
  track_id text not null,
  node_id text not null,
  node_title text,
  status text not null default 'in-progress',
  is_custom_module boolean not null default false,
  concept_tag text,
  saved_files jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0,
  tutor_messages jsonb not null default '[]'::jsonb,
  custom_module_definition jsonb,
  updated_at timestamptz not null default now(),
  unique (learner_id, track_id, node_id)
);

-- Indexes for fast lookups
create index if not exists idx_module_progress_learner
  on public.learner_module_progress(learner_id, track_id);

-- Enable Row Level Security (with open policies for anon/authenticated client sync)
alter table public.learner_profiles enable row level security;
alter table public.learner_module_progress enable row level security;

drop policy if exists "Allow learner profile access" on public.learner_profiles;
create policy "Allow learner profile access"
  on public.learner_profiles
  for all
  using (true)
  with check (true);

drop policy if exists "Allow learner module progress access" on public.learner_module_progress;
create policy "Allow learner module progress access"
  on public.learner_module_progress
  for all
  using (true)
  with check (true);
