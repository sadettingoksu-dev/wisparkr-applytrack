-- ApplyTrack: add interview_date to applications (Faz 1 - takvim görünümü)

alter table public.applications
  add column interview_date timestamptz;

create index applications_interview_date_idx on public.applications(interview_date);
