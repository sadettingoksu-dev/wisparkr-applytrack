-- Kullanıcı geri bildirimleri (feedback widget) + bildirim tercihleri.

-- ---------------- feedback ----------------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  category text,
  page text,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

-- Kullanıcı yalnızca kendi adına geri bildirim ekleyebilir; okuma yok
-- (yönetim service-role ile yapılır, kullanıcı başkalarının geri bildirimini görmez).
create policy "feedback_insert_own"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- ---------------- bildirim tercihleri ----------------
-- Hangi olaylarda bildirim alınacağını kullanıcı seçebilir. Varsayılan: hepsi açık.
alter table public.profiles
  add column if not exists notify_status_change boolean not null default true,
  add column if not exists notify_interview boolean not null default true,
  add column if not exists notify_product boolean not null default true;
