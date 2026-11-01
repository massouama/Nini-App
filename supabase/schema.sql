-- Nini · schéma Supabase (PostgreSQL)
-- À exécuter une fois dans l'éditeur SQL de votre instance Supabase (cloud ou auto-hébergée).
-- Chaque utilisateur ne voit et ne modifie que ses propres lignes (Row Level Security).

create table if not exists public.clients (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.tasks (
  id          text primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_id   text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.settings (
  user_id     uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

create index if not exists clients_user_idx on public.clients (user_id);
create index if not exists tasks_user_idx on public.tasks (user_id);
create index if not exists tasks_client_idx on public.tasks (client_id);

alter table public.clients  enable row level security;
alter table public.tasks    enable row level security;
alter table public.settings enable row level security;

drop policy if exists "clients: own rows" on public.clients;
create policy "clients: own rows" on public.clients
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "tasks: own rows" on public.tasks;
create policy "tasks: own rows" on public.tasks
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists "settings: own row" on public.settings;
create policy "settings: own row" on public.settings
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Synchronisation en temps réel entre appareils
do $$
begin
  begin alter publication supabase_realtime add table public.clients;  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.tasks;    exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.settings; exception when duplicate_object then null; end;
end $$;
