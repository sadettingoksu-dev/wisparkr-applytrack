-- ApplyTrack: row level security policies
-- All tables are scoped to auth.uid() = user_id (or = id for profiles).
-- subscriptions/ai_usage are read-only for users; writes happen via the
-- service-role client (lib/supabase/admin.ts) from webhooks/usage helpers.

alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.ai_messages enable row level security;
alter table public.subscriptions enable row level security;
alter table public.ai_usage enable row level security;

-- ---------------- profiles ----------------
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- no insert/delete policy: rows are created by the handle_new_user trigger
-- (security definer) and deleted via cascade when the auth user is deleted.

-- ---------------- applications ----------------
create policy "applications_select_own"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "applications_insert_own"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "applications_update_own"
  on public.applications for update
  using (auth.uid() = user_id);

create policy "applications_delete_own"
  on public.applications for delete
  using (auth.uid() = user_id);

-- ---------------- ai_messages ----------------
create policy "ai_messages_select_own"
  on public.ai_messages for select
  using (auth.uid() = user_id);

create policy "ai_messages_insert_own"
  on public.ai_messages for insert
  with check (auth.uid() = user_id);

create policy "ai_messages_delete_own"
  on public.ai_messages for delete
  using (auth.uid() = user_id);

-- ---------------- subscriptions (read-only for users) ----------------
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- ---------------- ai_usage (read-only for users) ----------------
create policy "ai_usage_select_own"
  on public.ai_usage for select
  using (auth.uid() = user_id);
