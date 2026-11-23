-- Shared format preset library. Tournaments store a snapshot; presets only seed it.

create table if not exists public.format_presets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  format jsonb not null,
  is_system boolean not null default false,
  archived_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint format_presets_version_check check (coalesce((format->>'version')::int, 0) = 2)
);

create index if not exists format_presets_active_idx
  on public.format_presets (name)
  where archived_at is null;

alter table public.format_presets enable row level security;

create policy format_presets_select_all on public.format_presets
  for select using (true);

create policy format_presets_organizer_insert on public.format_presets
  for insert
  with check (public.is_organizer_or_admin());

create policy format_presets_organizer_update on public.format_presets
  for update
  using (
    public.is_organizer_or_admin()
    and (not is_system or public.is_admin())
  )
  with check (
    public.is_organizer_or_admin()
    and (not is_system or public.is_admin())
  );

create policy format_presets_organizer_delete on public.format_presets
  for delete
  using (
    public.is_organizer_or_admin()
    and not is_system
  );

alter table public.tournaments
  add column if not exists format_preset_id uuid references public.format_presets (id) on delete set null;

alter table public.leagues
  add column if not exists default_preset_id uuid references public.format_presets (id) on delete set null;

-- Seed system presets (idempotent by slug)
insert into public.format_presets (slug, name, description, format, is_system)
values
(
  'pikecup',
  'PikeCup',
  'Командный формат: 2×5 мини-туров, улов на команду, бумажки, схема озера.',
  '{
    "version":2,
    "structure":{
      "tours":[{"number":1,"day":1,"minis":5},{"number":2,"day":1,"minis":5}],
      "zones":[{"code":"A","label":"Зона A"},{"code":"B","label":"Зона B"}],
      "zoneRotation":"swap_pairs"
    },
    "participants":{
      "mode":"teams",
      "catchUnit":"entry",
      "roster":{"minAthletes":2,"maxAthletes":2,"captain":false,"representative":false},
      "juniors":{"mark":false,"separateStandings":false}
    },
    "catch":{
      "measure":"weight",
      "species":{"enabled":false,"list":[],"counted":[]},
      "bagLimit":null,
      "minFishWeightG":null
    },
    "scoring":{
      "group":"zone_tour",
      "zeroPlace":"group_size_plus_one",
      "tieAverage":true,
      "teamScore":"own_places",
      "tiebreakers":[{"kind":"total_weight"},{"kind":"last_tour_weight"},{"kind":"zone_weight","zone":"B"}]
    },
    "standings":{"team":true,"individual":false,"juniors":false},
    "draw":{"level":"entry","method":"slips","zonesOnly":false,"slipPackId":"pikecup"},
    "setup":{
      "scheduleTemplate":{"fishingMinutes":50,"moveMinutes":10,"dayStartTime":"07:00","extras":[]},
      "mapMode":"schematic",
      "rulesTemplate":null,
      "spectatorRulesHint":true
    }
  }'::jsonb,
  true
),
(
  'boor_individual',
  'Западный Кордон (БООР)',
  'Индивидуально-командный: 2×3, улов на спортсмена, секторы, личный + командный зачёт.',
  '{
    "version":2,
    "structure":{
      "tours":[{"number":1,"day":1,"minis":3},{"number":2,"day":1,"minis":3}],
      "zones":[{"code":"A","label":"Зона A"},{"code":"B","label":"Зона B"}],
      "zoneRotation":"swap_pairs"
    },
    "participants":{
      "mode":"teams_and_solo",
      "catchUnit":"athlete",
      "roster":{"minAthletes":2,"maxAthletes":2,"captain":true,"representative":true},
      "juniors":{"mark":true,"separateStandings":false}
    },
    "catch":{
      "measure":"weight",
      "species":{"enabled":false,"list":[],"counted":[]},
      "bagLimit":null,
      "minFishWeightG":null
    },
    "scoring":{
      "group":"zone_tour",
      "zeroPlace":"group_size_plus_one",
      "tieAverage":true,
      "teamScore":"sum_athlete_places",
      "tiebreakers":[{"kind":"total_weight"},{"kind":"best_tour_weight"}]
    },
    "standings":{"team":true,"individual":true,"juniors":false},
    "draw":{"level":"athlete","method":"slips","zonesOnly":false,"slipPackId":"boor"},
    "setup":{
      "scheduleTemplate":{"fishingMinutes":50,"moveMinutes":10,"dayStartTime":"07:30","extras":[]},
      "mapMode":"geo",
      "rulesTemplate":null,
      "spectatorRulesHint":false
    }
  }'::jsonb,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  format = excluded.format,
  is_system = true,
  updated_at = now();

-- Point leagues at system presets when default_format matches
update public.leagues l
set default_preset_id = p.id
from public.format_presets p
where l.default_preset_id is null
  and (
    (l.slug = 'pikecup' and p.slug = 'pikecup')
    or (l.slug <> 'pikecup' and p.slug = 'boor_individual' and l.default_format is not null
        and coalesce(l.default_format->>'engine', l.default_format->'participants'->>'catchUnit') in ('individual', 'athlete'))
  );

update public.leagues l
set default_preset_id = p.id
from public.format_presets p
where l.default_preset_id is null and l.slug = 'pikecup' and p.slug = 'pikecup';
