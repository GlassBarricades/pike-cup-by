-- Slip assignment is allowed for any tournament status.

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
