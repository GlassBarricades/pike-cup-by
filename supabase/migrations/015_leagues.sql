-- Лиги (национальные / областные) + привязка турниров.
-- Фестиваль = tournament с league_id IS NULL.

create type public.league_kind as enum ('national', 'regional', 'other');

create table public.leagues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  kind public.league_kind not null default 'other',
  region_code text,
  description text not null default '',
  brand_color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leagues_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint leagues_region_for_regional check (
    (kind = 'regional' and region_code is not null)
    or (kind <> 'regional')
  )
);

create index leagues_active_idx on public.leagues (is_active, kind, name);

alter table public.tournaments
  add column league_id uuid references public.leagues (id) on delete set null;

create index tournaments_league_idx on public.tournaments (league_id);

-- Seed: PikeCup как национальная лига
insert into public.leagues (slug, name, short_name, kind, description)
values (
  'pikecup',
  'PikeCup',
  'PikeCup',
  'national',
  'Национальная серия соревнований по ловле щуки в Республике Беларусь.'
);

update public.tournaments
set league_id = (select id from public.leagues where slug = 'pikecup')
where league_id is null;

alter table public.leagues enable row level security;

create policy leagues_select_all on public.leagues
  for select using (true);

create policy leagues_organizer_write on public.leagues
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());
