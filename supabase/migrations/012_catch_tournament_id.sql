-- Denormalize tournament_id onto catches for filtered realtime and cheaper reads.

alter table public.catches
  add column if not exists tournament_id uuid references public.tournaments (id) on delete cascade;

update public.catches c
set tournament_id = e.tournament_id
from public.tournament_entries e
where c.entry_id = e.id
  and c.tournament_id is null;

alter table public.catches
  alter column tournament_id set not null;

create index if not exists catches_tournament_idx
  on public.catches (tournament_id);

create or replace function public.catches_set_tournament_id()
returns trigger
language plpgsql
as $$
begin
  if new.tournament_id is null then
    select e.tournament_id into new.tournament_id
    from public.tournament_entries e
    where e.id = new.entry_id;
  end if;
  if new.tournament_id is null then
    raise exception 'catch entry % has no tournament', new.entry_id;
  end if;
  return new;
end;
$$;

drop trigger if exists catches_set_tournament_id on public.catches;
create trigger catches_set_tournament_id
  before insert or update of entry_id on public.catches
  for each row
  execute function public.catches_set_tournament_id();
