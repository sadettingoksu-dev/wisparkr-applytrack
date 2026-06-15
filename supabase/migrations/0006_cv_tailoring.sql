-- ApplyTrack: AI ile basvuruya ozel CV optimizasyonu + basvuru hazirlik skoru

alter table public.applications
  add column tailored_cv_text text,
  add column tailored_fit_score int check (tailored_fit_score between 0 and 100);

alter table public.ai_usage
  add column cv_tailors_used int not null default 0;
