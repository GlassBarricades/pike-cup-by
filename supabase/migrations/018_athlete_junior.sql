-- Junior flag on athletes + snapshot on tournament roster.

alter table public.athletes
  add column if not exists is_junior boolean not null default false;

alter table public.tournament_roster_members
  add column if not exists is_junior boolean not null default false;
