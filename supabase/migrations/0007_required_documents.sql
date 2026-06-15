-- ApplyTrack: ilanin sektorune ozel beklenen belge/sertifika kontrol listesi

alter table public.applications
  add column required_documents jsonb;
