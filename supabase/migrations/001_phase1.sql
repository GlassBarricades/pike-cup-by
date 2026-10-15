-- PikeCup phase 1 schema
create extension if not exists "pgcrypto";

create type public.app_role as enum ('participant', 'judge', 'organizer', 'admin');
create type public.team_quota as enum ('open', 'prize', 'org');
create type public.entry_status as enum ('registered', 'confirmed', 'withdrawn', 'dq');
create type public.zone_code as enum ('A', 'B');
create type public.tournament_status as enum ('draft', 'published', 'live', 'finished');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role public.app_role not null default 'participant',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'participant'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role helpers
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'participant'::public.app_role
  );
$$;

create or replace function public.is_judge_or_above()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('judge', 'organizer', 'admin');
$$;

create or replace function public.is_organizer_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('organizer', 'admin');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'admin';
$$;

-- Tournaments
create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  location text not null,
  organizers text[] not null default '{}',
  max_teams int not null default 70,
  open_slots int not null default 50,
  prize_slots int not null default 10,
  org_slots int not null default 10,
  status public.tournament_status not null default 'published',
  rules_content text not null default '',
  rules_updated_at timestamptz not null default now(),
  rules_locked_at timestamptz,
  schedule_delay_minutes int not null default 0,
  schedule_paused_at timestamptz,
  live_phase_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Schedule segments
create table public.schedule_segments (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  key text not null,
  title text not null,
  sort_order int not null,
  planned_starts_at timestamptz not null,
  planned_ends_at timestamptz not null,
  unique (tournament_id, key)
);

create index schedule_segments_tournament_idx on public.schedule_segments (tournament_id, sort_order);

-- Mini tours (fishing slots)
create table public.mini_tours (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  segment_id uuid not null unique references public.schedule_segments (id) on delete cascade,
  tour_number int not null check (tour_number in (1, 2)),
  mini_number int not null check (mini_number between 1 and 5),
  unique (tournament_id, tour_number, mini_number)
);

-- Teams / athletes / memberships
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.athletes (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  athlete_id uuid not null references public.athletes (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (team_id, athlete_id, started_at)
);

create unique index team_memberships_one_active_athlete
  on public.team_memberships (athlete_id)
  where ended_at is null;

-- Tournament entries + roster snapshots
create table public.tournament_entries (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete restrict,
  quota public.team_quota not null default 'open',
  status public.entry_status not null default 'registered',
  contact_phone text,
  start_zone public.zone_code,
  roster_locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, team_id)
);

create table public.tournament_roster_members (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.tournament_entries (id) on delete cascade,
  athlete_id uuid references public.athletes (id) on delete set null,
  full_name_snapshot text not null,
  slot smallint not null check (slot in (1, 2)),
  unique (entry_id, slot)
);

-- Catches
create table public.catches (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.tournament_entries (id) on delete cascade,
  mini_tour_id uuid not null references public.mini_tours (id) on delete cascade,
  weight_grams int not null check (weight_grams > 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index catches_entry_idx on public.catches (entry_id);
create index catches_created_idx on public.catches (created_at desc);

-- RLS
alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.schedule_segments enable row level security;
alter table public.mini_tours enable row level security;
alter table public.teams enable row level security;
alter table public.athletes enable row level security;
alter table public.team_memberships enable row level security;
alter table public.tournament_entries enable row level security;
alter table public.tournament_roster_members enable row level security;
alter table public.catches enable row level security;

-- Profiles policies
create policy profiles_select_own_or_staff on public.profiles
  for select using (auth.uid() = id or public.is_judge_or_above());

create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

create policy profiles_admin_update_role on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

-- Public read for tournament data
create policy tournaments_select_all on public.tournaments for select using (true);
create policy schedule_select_all on public.schedule_segments for select using (true);
create policy mini_tours_select_all on public.mini_tours for select using (true);
create policy teams_select_all on public.teams for select using (true);
create policy athletes_select_all on public.athletes for select using (true);
create policy memberships_select_all on public.team_memberships for select using (true);
create policy entries_select_all on public.tournament_entries for select using (true);
create policy roster_select_all on public.tournament_roster_members for select using (true);
create policy catches_select_all on public.catches for select using (true);

-- Organizer writes: tournament meta/rules/delay fields
create policy tournaments_organizer_write on public.tournaments
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

-- Judge+ can update only operational schedule fields via a narrower approach:
-- organizers already have full write; allow judges to update delay/pause/override
create policy tournaments_judge_ops on public.tournaments
  for update using (public.is_judge_or_above())
  with check (public.is_judge_or_above());

create policy schedule_organizer_write on public.schedule_segments
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy mini_tours_organizer_write on public.mini_tours
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy teams_organizer_write on public.teams
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy athletes_organizer_write on public.athletes
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy memberships_organizer_write on public.team_memberships
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy entries_organizer_write on public.tournament_entries
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy roster_organizer_write on public.tournament_roster_members
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy catches_judge_write on public.catches
  for all using (public.is_judge_or_above())
  with check (public.is_judge_or_above());

-- Realtime
alter publication supabase_realtime add table public.catches;
alter publication supabase_realtime add table public.tournaments;

-- Турниры создаются вручную в кабинете организатора (без seed).
