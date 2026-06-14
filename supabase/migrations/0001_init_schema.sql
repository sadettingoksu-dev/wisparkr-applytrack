-- ApplyTrack: initial schema
-- Tables: profiles, applications, ai_messages, subscriptions, ai_usage

-- ============================================================
-- profiles (1:1 with auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  cv_text text,
  cv_filename text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'career_coach')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Automatically create a profile row whenever a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- applications
-- ============================================================
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_name text not null,
  position_title text not null,
  job_url text,
  job_description text,
  status text not null default 'pending'
    check (status in ('pending', 'interview', 'offer', 'rejected')),
  fit_score int check (fit_score between 0 and 100),
  fit_suggestions jsonb,
  notes text,
  applied_at timestamptz default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_user_id_idx on public.applications(user_id);
create index applications_status_idx on public.applications(status);

-- ============================================================
-- ai_messages (interview prep chat history)
-- ============================================================
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index ai_messages_application_id_idx on public.ai_messages(application_id);
create index ai_messages_user_id_idx on public.ai_messages(user_id);

-- ============================================================
-- subscriptions (synced from Lemon Squeezy webhooks)
-- ============================================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ls_subscription_id text unique,
  ls_customer_id text,
  ls_order_id text,
  plan text not null check (plan in ('free', 'pro', 'career_coach')),
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'expired', 'past_due', 'on_trial')),
  renews_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);

-- ============================================================
-- ai_usage (monthly AI usage counters per user)
-- ============================================================
create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  period_month date not null,
  ai_questions_used int not null default 0,
  fit_scores_used int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, period_month)
);

create index ai_usage_user_period_idx on public.ai_usage(user_id, period_month);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.applications
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

create trigger set_updated_at before update on public.ai_usage
  for each row execute procedure public.set_updated_at();
