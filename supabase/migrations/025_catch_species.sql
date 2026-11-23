-- Optional species / bag-limit fields for formats with catch.species.enabled

alter table public.catches
  add column if not exists species text,
  add column if not exists length_mm int,
  add column if not exists counted boolean not null default true;

alter table public.catch_revisions
  add column if not exists species text,
  add column if not exists length_mm int,
  add column if not exists counted boolean;

comment on column public.catches.species is 'Fish species code/name when format.catch.species.enabled';
comment on column public.catches.length_mm is 'Optional length measurement (mm)';
comment on column public.catches.counted is 'False if below min weight / over bag / non-counted species';

create index if not exists catches_species_idx on public.catches (tournament_id, species)
  where species is not null;
