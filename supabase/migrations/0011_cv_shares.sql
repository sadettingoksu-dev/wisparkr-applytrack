-- Wisparkr: paylaşılabilir CV linkleri (monetizasyon kaldıracı)
-- Free linkler 7 gün yaşar; süre dolunca owner Pro değilse pasifleşir.
-- Owner Pro'ya geçince kontrol canlı yapıldığı için tüm linkler yeniden canlanır.

create table public.cv_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  label text,
  cv_snapshot jsonb not null,
  template text not null default 'classic',
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  view_count int not null default 0,
  last_viewed_at timestamptz,
  revoked boolean not null default false
);

create index cv_shares_user_id_idx on public.cv_shares(user_id);

alter table public.cv_shares enable row level security;

-- Sahibi kendi linklerini yönetir. Public okuma service-role (admin) ile yapılır
-- (public sayfa oturumsuz; RLS'i admin bypass eder), bu yüzden public policy yok.
create policy "cv_shares_select_own"
  on public.cv_shares for select
  using (auth.uid() = user_id);

create policy "cv_shares_insert_own"
  on public.cv_shares for insert
  with check (auth.uid() = user_id);

create policy "cv_shares_update_own"
  on public.cv_shares for update
  using (auth.uid() = user_id);

create policy "cv_shares_delete_own"
  on public.cv_shares for delete
  using (auth.uid() = user_id);

-- 7 günlük ücretsiz indirme penceresi için (ilk CV kaydında set edilir).
alter table public.profiles
  add column cv_trial_started_at timestamptz;
