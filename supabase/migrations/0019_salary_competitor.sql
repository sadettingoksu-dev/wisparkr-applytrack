-- Wisparkr: Faz 5 gercek ozellikler
-- Maas muzakere kocu (salary_coach) ve rakip analizi (competitor_analysis)
-- sonuclarini basvuru bazinda saklar. Kod bu kolonlar olmadan da calisir
-- (sonuc kalici olmaz); kolon eklenince kalicilik gelir.

alter table public.applications
  add column if not exists salary_coach jsonb;

alter table public.applications
  add column if not exists competitor_analysis jsonb;
