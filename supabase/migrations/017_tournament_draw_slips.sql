-- Tournament-owned draw slips (no shared global catalog).

alter table public.draw_slips
  add column if not exists tournament_id uuid references public.tournaments (id) on delete cascade;

-- Must drop global unique(code) before cloning the same codes per tournament.
alter table public.draw_slips
  drop constraint if exists draw_slips_code_key;
drop index if exists draw_slips_code_key;

-- Clone global slips to each existing tournament and remap entry assignments.
do $$
declare
  t record;
  new_id uuid;
  slip record;
  code_map jsonb;
begin
  for t in select id from public.tournaments loop
    -- Skip tournaments that already have a pack (re-run safe).
    if exists (select 1 from public.draw_slips s where s.tournament_id = t.id) then
      continue;
    end if;

    code_map := '{}'::jsonb;

    for slip in
      select * from public.draw_slips where tournament_id is null order by sort_order, code
    loop
      insert into public.draw_slips (code, start_zone, sort_order, tournament_id)
      values (slip.code, slip.start_zone, slip.sort_order, t.id)
      returning id into new_id;

      code_map := code_map || jsonb_build_object(slip.code, new_id::text);

      insert into public.draw_slip_sectors (slip_id, tour_number, mini_number, sector_number)
      select new_id, dss.tour_number, dss.mini_number, dss.sector_number
      from public.draw_slip_sectors dss
      where dss.slip_id = slip.id;
    end loop;

    update public.tournament_entries e
    set draw_slip_id = (code_map ->> old_slip.code)::uuid
    from public.draw_slips old_slip
    where e.tournament_id = t.id
      and e.draw_slip_id = old_slip.id
      and old_slip.tournament_id is null
      and code_map ? old_slip.code;
  end loop;
end $$;

-- Drop leftovers (global catalog rows).
delete from public.draw_slips where tournament_id is null;

-- If somehow empty table after delete with no tournaments, allow null until seed from app.
-- With tournaments present every slip must belong to one.
alter table public.draw_slips
  alter column tournament_id set not null;

alter table public.draw_slips
  drop constraint if exists draw_slips_tournament_code_key;

alter table public.draw_slips
  add constraint draw_slips_tournament_code_key unique (tournament_id, code);

drop index if exists draw_slips_sort_idx;
create index if not exists draw_slips_tournament_sort_idx
  on public.draw_slips (tournament_id, sort_order, code);

alter table public.draw_slip_sectors
  drop constraint if exists draw_slip_sectors_tour_number_check;
alter table public.draw_slip_sectors
  drop constraint if exists draw_slip_sectors_mini_number_check;
alter table public.draw_slip_sectors
  add constraint draw_slip_sectors_tour_number_check check (tour_number between 1 and 9),
  add constraint draw_slip_sectors_mini_number_check check (mini_number between 1 and 20);

alter table public.tournament_roster_members
  add column if not exists draw_slip_id uuid references public.draw_slips (id) on delete restrict;

create index if not exists tournament_roster_members_draw_slip_idx
  on public.tournament_roster_members (draw_slip_id)
  where draw_slip_id is not null;
