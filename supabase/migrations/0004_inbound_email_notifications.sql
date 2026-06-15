-- ApplyTrack: Faz 2 - inbound email siniflandirma + bildirimler

create table public.inbound_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  from_address text not null,
  subject text,
  body text,
  classification text not null
    check (classification in ('interview_invitation', 'rejection', 'info_request', 'other')),
  created_at timestamptz not null default now()
);

create index inbound_emails_user_id_idx on public.inbound_emails(user_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  title text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications(user_id);

alter table public.inbound_emails enable row level security;
alter table public.notifications enable row level security;

create policy "inbound_emails_select_own" on public.inbound_emails
  for select using (auth.uid() = user_id);

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);
