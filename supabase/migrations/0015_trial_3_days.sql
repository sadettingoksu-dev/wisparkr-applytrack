-- Deneme süresi 5 günden 3 güne düşürüldü (yeni kayıtlar için varsayılan).
-- Mevcut kullanıcıların trial_ends_at değeri DEĞİŞTİRİLMEZ — sadece varsayılan güncellenir.
alter table public.profiles
  alter column trial_ends_at set default (now() + interval '3 days');
