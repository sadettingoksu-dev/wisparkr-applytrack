-- Wisparkr: Flowcase'den ilhamla CV/AI paketi
-- (AI ön yazı + CV cila kullanım sayacı + beceri açığı analizi)

-- Başvuruya özel üretilen ön yazı metni ve beceri açığı analizi (JSON).
alter table public.applications
  add column cover_letter_text text,
  add column skills_gap jsonb;

-- Aylık kullanım sayaçları (ai_usage; service-role ile yazılır).
alter table public.ai_usage
  add column cover_letters_used int not null default 0,
  add column cv_polish_used int not null default 0;
