-- Wisparkr: yapılandırılmış CV oluşturucu (CV Builder) verisi
-- profiles.cv_data tutar; her kayıtta ondan ATS-dostu düz metin türetilip
-- profiles.cv_text'e de yazılır (mevcut AI özellikleri değişmeden çalışsın).

alter table public.profiles
  add column cv_data jsonb;
