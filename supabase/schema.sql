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

-- ============================================================================
-- 3. ACADEMIC SYSTEM OF RECORD (SoR): PRACTICAL LAB GRADING LEDGER & AUDIT TRAIL
-- Turns Upskill into the official, unremovable institutional database of practical
-- programming and applied mathematics lab examinations.
-- ============================================================================

-- Institutions (Universities, Colleges & Engineering Bootcamps)
create table if not exists public.academic_institutions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,               -- e.g. 'STANFORD', 'MIT', 'STRATHMORE'
  name text not null,                      -- e.g. 'Stanford University'
  department text not null,                -- e.g. 'Department of Computer Science & Engineering'
  accreditation_body text default 'ABET',  -- e.g. 'ABET-CAC', 'QAA', 'HEC'
  created_at timestamptz not null default now()
);

-- Academic Courses & Cohorts
create table if not exists public.academic_courses (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.academic_institutions(id) on delete cascade,
  course_code text not null,               -- e.g. 'CS201', 'MATH105'
  course_name text not null,               -- e.g. 'Systems Programming & API Design'
  term text not null,                      -- e.g. 'Fall 2026'
  created_at timestamptz not null default now(),
  unique (institution_id, course_code, term)
);

-- Practical Lab Assignments
create table if not exists public.practical_lab_assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.academic_courses(id) on delete cascade,
  lab_number text not null,                -- e.g. 'Lab 4'
  title text not null,                     -- e.g. 'In-Memory Token Bucket Rate Limiter'
  target_node_id text not null,            -- points to roadmap curriculum node (e.g. 'node-rate-limiter')
  max_points numeric(5,2) not null default 100.00,
  rubric_weights jsonb not null default '{
    "correctness": 0.40,
    "resilience": 0.20,
    "anti_cheat": 0.20,
    "voice_defense": 0.20
  }'::jsonb,
  socratic_defense_prompt text,
  max_allowed_paste_chars integer not null default 0,
  created_at timestamptz not null default now()
);

-- The Official Practical Lab Grading Ledger (Immutable System of Record)
create table if not exists public.practical_lab_grading_ledger (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid references public.practical_lab_assignments(id) on delete cascade,
  student_id text not null,                -- University Student ID e.g. 'SID-84920'
  student_name text not null,
  student_email text,
  final_grade numeric(5,2) not null,       -- 0.00 - 100.00
  letter_grade text not null,              -- 'A+', 'A', 'B', etc.
  rubric_breakdown jsonb not null,         -- { correctness, resilience, antiCheat, voiceDefense }
  integrity_status text not null default 'VERIFIED_HUMAN', -- 'VERIFIED_HUMAN' | 'FLAGGED_PASTE' | 'FLAGGED_CADENCE'
  thinking_ratio numeric(4,2) not null,    -- e.g. 0.70 (70% thinking, 30% typing)
  clipboard_paste_count integer not null default 0,
  pasted_chars integer not null default 0,
  terminal_failure_count integer not null default 0,
  time_spent_total_sec integer not null,
  merkle_root text not null,               -- Cryptographic SHA-256 Merkle root
  platform_signature text not null,        -- Cryptographic attestation signature
  lti_grade_passback_status text default 'PENDING', -- 'PENDING' | 'SYNCED' | 'FAILED'
  lti_synced_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Granular Keystroke & AST Audit Stream (Forensic Evidence)
create table if not exists public.telemetry_audit_stream (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid references public.practical_lab_grading_ledger(id) on delete cascade,
  keystroke_total integer not null,
  avg_inter_keystroke_ms integer not null,
  ast_mutation_count integer not null,
  cadence_samples jsonb not null default '[]'::jsonb,
  paste_interceptions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Terminal Debugging Trajectory (Resilience Audit)
create table if not exists public.terminal_debug_traces (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid references public.practical_lab_grading_ledger(id) on delete cascade,
  step_number integer not null,
  command text not null,
  exit_code integer not null,
  error_output text not null,
  time_spent_sec integer not null,
  resolution_diff text not null,
  hypothesis text,
  created_at timestamptz not null default now()
);

-- Socratic AI Audio Defenses (Oral Exam Archive)
create table if not exists public.socratic_voice_audits (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid references public.practical_lab_grading_ledger(id) on delete cascade,
  duration_sec numeric(4,1) not null,
  prompt text not null,
  transcript text not null,
  audio_url text,
  audio_waveform jsonb not null default '[]'::jsonb,
  semantic_alignment_score numeric(4,2) not null default 1.00,
  created_at timestamptz not null default now()
);

-- Indexes for rapid ledger queries & accreditation audits
create index if not exists idx_academic_ledger_student
  on public.practical_lab_grading_ledger(student_id);

create index if not exists idx_academic_ledger_assignment
  on public.practical_lab_grading_ledger(assignment_id, final_grade);

create index if not exists idx_academic_ledger_integrity
  on public.practical_lab_grading_ledger(integrity_status);
