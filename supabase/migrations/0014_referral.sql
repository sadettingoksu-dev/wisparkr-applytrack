-- Davet/referans programı. Davet eden, her başarılı davet için +5 gün Pro
-- (trial_ends_at uzatımı = Pro seviyesi erişim) kazanır.

alter table public.profiles
  add column if not exists referral_code text unique,
  add column if not exists referred_by uuid references auth.users(id) on delete set null,
  add column if not exists referral_count integer not null default 0;
