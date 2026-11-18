-- Per-zone «weighing finished» flag for judges (toggleable).

alter table public.tournament_zone_judges
  add column if not exists weighing_completed_at timestamptz;

-- Judges of the zone (or organizers) may toggle the flag for everyone on that zone.
create or replace function public.set_zone_weighing_completed(
  p_tournament_id uuid,
  p_zone public.zone_code,
  p_completed boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated int;
begin
  if auth.uid() is null then
    raise exception 'Не авторизован';
  end if;

  if not (
    public.is_organizer_or_admin()
    or exists (
      select 1
      from public.tournament_zone_judges z
      where z.tournament_id = p_tournament_id
        and z.zone = p_zone
        and z.user_id = auth.uid()
    )
  ) then
    raise exception 'Нет доступа к взвешиванию этой зоны';
  end if;

  update public.tournament_zone_judges
  set weighing_completed_at = case when p_completed then now() else null end
  where tournament_id = p_tournament_id
    and zone = p_zone;

  get diagnostics updated = row_count;
  if updated = 0 then
    raise exception 'На зону % не назначены судьи', p_zone;
  end if;
end;
$$;

revoke all on function public.set_zone_weighing_completed(uuid, public.zone_code, boolean) from public;
grant execute on function public.set_zone_weighing_completed(uuid, public.zone_code, boolean) to authenticated;
