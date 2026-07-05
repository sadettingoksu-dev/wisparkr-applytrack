-- Plan yenileme hatırlatması: bitişe/yenilemeye ~1 gün kala gönderilen
-- e-postanın aynı döngüde tekrarlanmasını önlemek için işaret sütunu.
-- Cron her gün çalışır; bu sütun "bu döngü için gönderildi mi?" bilgisini tutar.
alter table public.subscriptions
  add column if not exists renewal_reminder_sent_at timestamptz;
