  -- ApplyTrack: yazili mock mulakat simulasyonu

  create table public.mock_interviews (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    application_id uuid not null references public.applications(id) on delete cascade,
    status text not null default 'in_progress' check (status in ('in_progress','completed')),
    question_count int not null default 0,
    overall_score int check (overall_score between 0 and 100),
    feedback jsonb,
    created_at timestamptz not null default now(),
    completed_at timestamptz
  );

  create index mock_interviews_user_id_idx on public.mock_interviews(user_id);
  create index mock_interviews_application_id_idx on public.mock_interviews(application_id);

  create table public.mock_interview_messages (
    id uuid primary key default gen_random_uuid(),
    mock_interview_id uuid not null references public.mock_interviews(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    role text not null check (role in ('interviewer','candidate')),
    content text not null,
    -- clock_timestamp(): adayin cevabi + mulakatcinin yaniti aynı insert
    -- cumlesinde yazilir; now() tum statement icin sabit kalir ve iki satira
    -- ayni created_at verir, clock_timestamp() her satirda artar.
    created_at timestamptz not null default clock_timestamp()
  );

  create index mock_interview_messages_interview_id_idx on public.mock_interview_messages(mock_interview_id);

  alter table public.ai_usage
    add column mock_interviews_used int not null default 0;

  alter table public.mock_interviews enable row level security;
  alter table public.mock_interview_messages enable row level security;

  create policy "mock_interviews_select_own" on public.mock_interviews
    for select using (auth.uid() = user_id);
  create policy "mock_interviews_insert_own" on public.mock_interviews
    for insert with check (auth.uid() = user_id);
  create policy "mock_interviews_update_own" on public.mock_interviews
    for update using (auth.uid() = user_id);

  create policy "mock_interview_messages_select_own" on public.mock_interview_messages
    for select using (auth.uid() = user_id);
  create policy "mock_interview_messages_insert_own" on public.mock_interview_messages
    for insert with check (auth.uid() = user_id);
