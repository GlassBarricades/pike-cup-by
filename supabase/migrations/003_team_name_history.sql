-- История названий команд + снимок имени в заявке на турнир

create table public.team_name_history (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  name text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index team_name_history_team_idx on public.team_name_history (team_id, started_at desc);

create unique index team_name_history_one_active
  on public.team_name_history (team_id)
  where ended_at is null;

alter table public.team_name_history enable row level security;

create policy team_name_history_select_all on public.team_name_history
  for select using (true);

create policy team_name_history_organizer_write on public.team_name_history
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

-- Начальная история из текущих названий
insert into public.team_name_history (team_id, name, started_at)
select id, name, created_at
from public.teams;

-- Снимок названия в заявке
alter table public.tournament_entries
  add column team_name_snapshot text;

update public.tournament_entries e
set team_name_snapshot = t.name
from public.teams t
where e.team_id = t.id
  and e.team_name_snapshot is null;

alter table public.tournament_entries
  alter column team_name_snapshot set not null;
