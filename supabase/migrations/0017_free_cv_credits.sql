-- Faz 2 monetizasyon: ücretsiz planda CV AI-uyarlama (tailor-cv) için ömür boyu
-- kredi. Varsayılan 1 → her kullanıcı (mevcut dahil) 1 ücretsiz uyarlama hakkı alır.
-- Kullandıkça düşer; 0 olunca kilitlenir. Referral ödülü bu krediyi +1 artırır.
-- Aylık AI havuzundan (ai_usage) BAĞIMSIZDIR — bu tek seferlik/ömür boyu bir sayaçtır.
alter table public.profiles
  add column if not exists free_cv_credits integer not null default 1;
