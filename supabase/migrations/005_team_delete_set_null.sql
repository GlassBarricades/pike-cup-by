-- Удаление команды из справочника: заявки/протоколы остаются (снимок названия),
-- ссылка team_id обнуляется — как athlete_id у roster members.

alter table public.tournament_entries
  alter column team_id drop not null;

alter table public.tournament_entries
  drop constraint tournament_entries_team_id_fkey;

alter table public.tournament_entries
  add constraint tournament_entries_team_id_fkey
  foreign key (team_id) references public.teams (id) on delete set null;
