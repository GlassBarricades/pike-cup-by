-- Какая карта у турнира: схема озера (PikeCup SVG) или OSM/Leaflet.
alter table public.tournaments
  add column if not exists map_mode text not null default 'schematic';

alter table public.tournaments
  drop constraint if exists tournaments_map_mode_check;

alter table public.tournaments
  add constraint tournaments_map_mode_check
  check (map_mode in ('schematic', 'geo'));

comment on column public.tournaments.map_mode is
  'schematic = LakeMap SVG (Повстынь); geo = Leaflet venue_map';

-- Турниры individual / без схемы по умолчанию — настоящая карта.
update public.tournaments
set map_mode = 'geo'
where coalesce(format->>'engine', 'pikecup') <> 'pikecup';
