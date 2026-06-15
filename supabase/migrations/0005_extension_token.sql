-- ApplyTrack: Faz 3 - tarayici eklentisi icin kisisel API token

alter table public.profiles
  add column extension_token uuid not null default gen_random_uuid();

create unique index profiles_extension_token_idx on public.profiles(extension_token);
