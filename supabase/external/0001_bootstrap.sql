-- ============================================================
-- Deadly — bootstrap complet du schéma sur le projet Supabase
-- jtrlygzozzivpfinfraf
-- À exécuter UNE FOIS dans SQL Editor (Supabase Dashboard).
-- 100% non destructif : uniquement des CREATE ... IF NOT EXISTS.
-- ============================================================

-- 1) Types -----------------------------------------------------
do $$ begin
  create type public.deadline_status as enum ('upcoming','in_progress','completed','overdue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_type as enum ('free','pro');
exception when duplicate_object then null; end $$;

-- 2) Utilitaire updated_at ------------------------------------
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- 3) profiles --------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  reminder_email text,
  timezone text default 'Europe/Paris',
  plan public.plan_type not null default 'free',
  plan_since timestamptz,
  has_active_sub boolean not null default false,
  telegram_chat_id bigint,
  language text not null default 'fr',
  summary_enabled boolean not null default true,
  summary_hour integer not null default 9,
  summary_minute integer not null default 0,
  summary_last_sent_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

do $$ begin
  create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.tg_touch_updated_at();

-- 4) deadlines -------------------------------------------------
create table if not exists public.deadlines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  category text,
  client_name text,
  due_at timestamptz not null,
  priority text not null default 'normal',
  color text not null default '#111111',
  status public.deadline_status not null default 'upcoming',
  reminder_offsets integer[] not null default '{}',
  alert_rules integer[] not null default '{}',
  alert_hour integer not null default 9,
  alerts_sent text[] not null default '{}',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.deadlines to authenticated;
grant all on public.deadlines to service_role;
alter table public.deadlines enable row level security;

do $$ begin
  create policy "own deadlines all" on public.deadlines for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

drop trigger if exists deadlines_touch_updated_at on public.deadlines;
create trigger deadlines_touch_updated_at before update on public.deadlines
for each row execute function public.tg_touch_updated_at();

create index if not exists deadlines_user_due_idx on public.deadlines (user_id, due_at);

-- 5) notifications ---------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

do $$ begin
  create policy "own notif all" on public.notifications for all to authenticated
    using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

-- 6) telegram_link_codes (serveur uniquement) -------------------
create table if not exists public.telegram_link_codes (
  code text primary key,
  chat_id bigint not null,
  telegram_username text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '15 minutes')
);

grant all on public.telegram_link_codes to service_role;
alter table public.telegram_link_codes enable row level security;
-- aucune policy : table réservée au service_role (webhook Telegram)

-- 7) Création automatique du profil à l'inscription -------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url, reminder_email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 8) Cron : rappels + résumés toutes les 5 minutes --------------
-- Remplacez <APP_URL> par l'URL de production (ex. https://dedly.co)
-- create extension if not exists pg_cron;
-- create extension if not exists pg_net;
-- select cron.schedule(
--   'deadly-reminders',
--   '*/5 * * * *',
--   $$
--   select net.http_post(
--     url := '<APP_URL>/api/public/hooks/reminders',
--     headers := '{"Content-Type":"application/json","apikey":"sb_publishable_eAkm1gZoSF3NjQH-4oGmoA_hONhRnWs"}'::jsonb,
--     body := '{}'::jsonb
--   );
--   $$
-- );
