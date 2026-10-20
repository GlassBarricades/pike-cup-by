-- Draw slips: printed cards with a starting zone and sector per mini-tour.
-- Attaching a slip to an entry copies start_zone from the card.

create table public.draw_slips (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  start_zone public.zone_code not null,
  sort_order int not null,
  created_at timestamptz not null default now()
);

create index draw_slips_sort_idx on public.draw_slips (sort_order, code);

create table public.draw_slip_sectors (
  id uuid primary key default gen_random_uuid(),
  slip_id uuid not null references public.draw_slips (id) on delete cascade,
  tour_number int not null check (tour_number in (1, 2)),
  mini_number int not null check (mini_number between 1 and 5),
  sector_number int not null check (sector_number > 0),
  unique (slip_id, tour_number, mini_number)
);

create index draw_slip_sectors_slip_idx on public.draw_slip_sectors (slip_id);

alter table public.tournament_entries
  add column draw_slip_id uuid references public.draw_slips (id) on delete restrict;

create unique index tournament_entries_one_slip_idx
  on public.tournament_entries (tournament_id, draw_slip_id)
  where draw_slip_id is not null;

create or replace function public.sync_entry_draw_slip()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  slip_zone public.zone_code;
  slip_changed boolean;
begin
  if tg_op = 'INSERT' then
    slip_changed := new.draw_slip_id is not null;
  else
    slip_changed := new.draw_slip_id is distinct from old.draw_slip_id;
  end if;

  if new.draw_slip_id is not null then
    select start_zone into slip_zone
    from public.draw_slips
    where id = new.draw_slip_id;

    if slip_zone is null then
      raise exception 'Бумажка не найдена';
    end if;

    new.start_zone := slip_zone;
  elsif slip_changed then
    new.start_zone := null;
  end if;

  return new;
end;
$$;

create trigger tournament_entries_sync_draw_slip
  before insert or update on public.tournament_entries
  for each row
  execute function public.sync_entry_draw_slip();

alter table public.draw_slips enable row level security;
alter table public.draw_slip_sectors enable row level security;

create policy draw_slips_select_all on public.draw_slips
  for select using (true);

create policy draw_slip_sectors_select_all on public.draw_slip_sectors
  for select using (true);

create policy draw_slips_organizer_write on public.draw_slips
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

create policy draw_slip_sectors_organizer_write on public.draw_slip_sectors
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());
