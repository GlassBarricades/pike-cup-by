-- Гибкие форматы: JSON-конфиг турнира, ослабление CHECK, улов на спортсмена, жеребьёвка.

-- 1. format jsonb на турнирах (PikeCup по умолчанию для существующих)
alter table public.tournaments
  add column if not exists format jsonb;

update public.tournaments
set format = jsonb_build_object(
  'engine', 'pikecup',
  'tours', jsonb_build_array(
    jsonb_build_object('number', 1, 'minis', 5),
    jsonb_build_object('number', 2, 'minis', 5)
  ),
  'zones', jsonb_build_array('A', 'B'),
  'roster', jsonb_build_object(
    'minAthletes', 2,
    'maxAthletes', 2,
    'captain', false,
    'representative', false
  ),
  'ranking', jsonb_build_object(
    'group', 'zone_tour',
    'zeroPlace', case
      when coalesce(zero_place_is_group_size_plus_one, true) then 'group_size_plus_one'
      else 'group_size'
    end,
    'tieAverage', true
  ),
  'tiebreakers', jsonb_build_array('total_weight', 'last_tour_weight'),
  'standings', jsonb_build_array('team'),
  'draw', 'pikecup_slips'
)
where format is null;

alter table public.tournaments
  alter column format set not null,
  alter column format set default '{
    "engine":"pikecup",
    "tours":[{"number":1,"minis":5},{"number":2,"minis":5}],
    "zones":["A","B"],
    "roster":{"minAthletes":2,"maxAthletes":2,"captain":false,"representative":false},
    "ranking":{"group":"zone_tour","zeroPlace":"group_size_plus_one","tieAverage":true},
    "tiebreakers":["total_weight","last_tour_weight"],
    "standings":["team"],
    "draw":"pikecup_slips"
  }'::jsonb;

-- 2. default_format на лигах
alter table public.leagues
  add column if not exists default_format jsonb;

update public.leagues
set default_format = '{
  "engine":"pikecup",
  "tours":[{"number":1,"minis":5},{"number":2,"minis":5}],
  "zones":["A","B"],
  "roster":{"minAthletes":2,"maxAthletes":2,"captain":false,"representative":false},
  "ranking":{"group":"zone_tour","zeroPlace":"group_size_plus_one","tieAverage":true},
  "tiebreakers":["total_weight","last_tour_weight"],
  "standings":["team"],
  "draw":"pikecup_slips"
}'::jsonb
where slug = 'pikecup' and default_format is null;

-- 3. Ослабить CHECK на mini_tours и schedule move_*
alter table public.mini_tours drop constraint if exists mini_tours_tour_number_check;
alter table public.mini_tours drop constraint if exists mini_tours_mini_number_check;
alter table public.mini_tours
  add constraint mini_tours_tour_number_check check (tour_number between 1 and 9),
  add constraint mini_tours_mini_number_check check (mini_number between 1 and 20);

alter table public.schedule_segments drop constraint if exists schedule_segments_move_tour_check;
alter table public.schedule_segments drop constraint if exists schedule_segments_move_mini_check;
alter table public.schedule_segments
  add constraint schedule_segments_move_tour_check check (move_tour is null or move_tour between 1 and 9),
  add constraint schedule_segments_move_mini_check check (move_mini is null or move_mini between 1 and 20);

-- 4. Roster: слоты 1..10 + роль
alter table public.tournament_roster_members drop constraint if exists tournament_roster_members_slot_check;
alter table public.tournament_roster_members
  add constraint tournament_roster_members_slot_check check (slot between 1 and 10);

alter table public.tournament_roster_members
  add column if not exists role text not null default 'athlete';

alter table public.tournament_roster_members drop constraint if exists tournament_roster_members_role_check;
alter table public.tournament_roster_members
  add constraint tournament_roster_members_role_check
  check (role in ('athlete', 'captain', 'representative'));

-- 5. Улов на спортсмена (nullable для PikeCup)
alter table public.catches
  add column if not exists roster_member_id uuid references public.tournament_roster_members (id) on delete cascade;

create index if not exists catches_roster_member_idx on public.catches (roster_member_id);

alter table public.catch_revisions
  add column if not exists roster_member_id uuid references public.tournament_roster_members (id) on delete set null;

-- 6. Жеребьёвка спортсменов (формат individual)
create table if not exists public.athlete_draws (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  roster_member_id uuid not null references public.tournament_roster_members (id) on delete cascade,
  tour_number int not null check (tour_number between 1 and 9),
  mini_number int not null check (mini_number between 1 and 20),
  zone text not null,
  sector int not null check (sector > 0),
  created_at timestamptz not null default now(),
  unique (roster_member_id, tour_number, mini_number)
);

create index if not exists athlete_draws_tournament_idx
  on public.athlete_draws (tournament_id, tour_number, mini_number);

create index if not exists athlete_draws_zone_idx
  on public.athlete_draws (tournament_id, zone, tour_number, mini_number);

alter table public.athlete_draws enable row level security;

create policy athlete_draws_select_all on public.athlete_draws
  for select using (true);

create policy athlete_draws_organizer_write on public.athlete_draws
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

do $$
begin
  alter publication supabase_realtime add table public.athlete_draws;
exception
  when duplicate_object then null;
end $$;
