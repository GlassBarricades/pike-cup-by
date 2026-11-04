-- Анонимные «болею за» внутри турнира + агрегаты для зрителей

create table public.tournament_cheers (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  entry_id uuid not null references public.tournament_entries (id) on delete cascade,
  spectator_key text not null,
  created_at timestamptz not null default now(),
  unique (tournament_id, entry_id, spectator_key),
  constraint tournament_cheers_key_len check (char_length(spectator_key) between 8 and 80)
);

create index tournament_cheers_tournament_idx
  on public.tournament_cheers (tournament_id);

create index tournament_cheers_entry_idx
  on public.tournament_cheers (tournament_id, entry_id);

alter table public.tournament_cheers enable row level security;
-- Прямой доступ закрыт: только security definer RPC ниже.

create or replace function public.cheer_set(
  p_tournament_id uuid,
  p_entry_id uuid,
  p_spectator_key text,
  p_on boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_spectator_key is null
     or char_length(p_spectator_key) < 8
     or char_length(p_spectator_key) > 80 then
    raise exception 'invalid spectator_key';
  end if;

  if not exists (
    select 1
    from public.tournament_entries e
    where e.id = p_entry_id
      and e.tournament_id = p_tournament_id
  ) then
    raise exception 'entry not in tournament';
  end if;

  if p_on then
    insert into public.tournament_cheers (tournament_id, entry_id, spectator_key)
    values (p_tournament_id, p_entry_id, p_spectator_key)
    on conflict (tournament_id, entry_id, spectator_key) do nothing;
  else
    delete from public.tournament_cheers
    where tournament_id = p_tournament_id
      and entry_id = p_entry_id
      and spectator_key = p_spectator_key;
  end if;
end;
$$;

create or replace function public.cheer_counts(p_tournament_id uuid)
returns table (entry_id uuid, fans integer)
language sql
stable
security definer
set search_path = public
as $$
  select c.entry_id, count(*)::integer as fans
  from public.tournament_cheers c
  where c.tournament_id = p_tournament_id
  group by c.entry_id;
$$;

create or replace function public.cheer_mine(p_tournament_id uuid, p_spectator_key text)
returns table (entry_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select c.entry_id
  from public.tournament_cheers c
  where c.tournament_id = p_tournament_id
    and c.spectator_key = p_spectator_key;
$$;

revoke all on table public.tournament_cheers from anon, authenticated;
grant execute on function public.cheer_set(uuid, uuid, text, boolean) to anon, authenticated;
grant execute on function public.cheer_counts(uuid) to anon, authenticated;
grant execute on function public.cheer_mine(uuid, text) to anon, authenticated;
