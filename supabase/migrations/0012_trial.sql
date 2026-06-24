-- Wisparkr: ücretsiz plan kaldırıldı, yerine 5 günlük tam erişimli deneme.
-- Deneme bitince (ve ücretli plana geçilmemişse) paylaşılan CV linkleri pasifleşir.

-- Her yeni kullanıcı kayıt anından itibaren 5 gün tam erişimli denemeye sahip.
alter table public.profiles
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '5 days');

-- Ücretli plana geçiş tarihi (faturalama sayfasında "X tarihinde geçtiniz" için).
alter table public.profiles
  add column if not exists plan_started_at timestamptz;

-- Mevcut kullanıcılar: hâlâ free ise hesap oluşturma tarihinden 5 gün deneme;
-- zaten ücretli olanlara plan başlangıcı olarak created_at yazılır.
update public.profiles
  set trial_ends_at = created_at + interval '5 days'
  where trial_ends_at is null;

update public.profiles
  set plan_started_at = created_at
  where plan in ('pro', 'career_coach') and plan_started_at is null;
