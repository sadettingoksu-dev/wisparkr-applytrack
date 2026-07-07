-- Wisparkr: CV araba-tamiri sihirbazi teshis sonucu (overall_score + arizalar)
-- Faz 3. Teshis bedava uretilir ve burada saklanir; optimize CV uretimi
-- (tailor-cv) ayrica free_cv_credits/aylik kotayi harcar.

alter table public.applications
  add column if not exists cv_diagnosis jsonb;
