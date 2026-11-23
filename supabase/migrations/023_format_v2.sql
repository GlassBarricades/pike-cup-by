-- Tournament format schema v2: nested structure/participants/scoring/draw/setup.
-- Converts existing v1 JSON on tournaments and leagues; folds draw_zones_only + map_mode into format.setup/draw.

-- Helper: build v2 from v1-shaped jsonb (PikeCup or individual).
create or replace function public.upgrade_format_v1_to_v2(v1 jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
  engine text := coalesce(v1->>'engine', 'pikecup');
  is_pike boolean := engine = 'pikecup';
  zones jsonb;
  tours jsonb;
  tiebreakers jsonb;
  draw_method text;
  slip_pack text;
  standings_team boolean;
  standings_ind boolean;
  separate_juniors boolean;
  zone_codes text[];
  z text;
  t jsonb;
  tb text;
  out_tb jsonb := '[]'::jsonb;
begin
  -- zones → [{code,label}]
  zones := '[]'::jsonb;
  for z in select jsonb_array_elements_text(coalesce(v1->'zones', '["A","B"]'::jsonb))
  loop
    zones := zones || jsonb_build_array(jsonb_build_object('code', z, 'label', 'Зона ' || z));
  end loop;

  -- tours → add day:1
  tours := '[]'::jsonb;
  for t in select jsonb_array_elements(coalesce(v1->'tours', '[{"number":1,"minis":5},{"number":2,"minis":5}]'::jsonb))
  loop
    tours := tours || jsonb_build_array(t || jsonb_build_object('day', 1));
  end loop;

  -- tiebreakers
  for tb in select jsonb_array_elements_text(coalesce(v1->'tiebreakers', '["total_weight"]'::jsonb))
  loop
    out_tb := out_tb || jsonb_build_array(jsonb_build_object('kind', tb));
  end loop;
  if is_pike and not exists (
    select 1 from jsonb_array_elements(out_tb) e where e->>'kind' = 'zone_weight'
  ) then
    out_tb := out_tb || jsonb_build_array(jsonb_build_object('kind', 'zone_weight', 'zone', 'B'));
  end if;

  if coalesce(v1->>'draw', 'none') = 'none' then
    draw_method := 'none';
    slip_pack := null;
  else
    draw_method := 'slips';
    if v1->>'draw' = 'pikecup_slips' then
      slip_pack := 'pikecup';
    else
      slip_pack := 'boor';
    end if;
  end if;

  standings_team := coalesce(v1->'standings', '["team"]'::jsonb) ? 'team';
  standings_ind := coalesce(v1->'standings', '[]'::jsonb) ? 'individual';
  separate_juniors := coalesce((v1->'ranking'->>'separateJuniors')::boolean, false);

  return jsonb_build_object(
    'version', 2,
    'structure', jsonb_build_object(
      'tours', tours,
      'zones', zones,
      'zoneRotation', case when jsonb_array_length(zones) = 2 then 'swap_pairs' else 'fixed' end
    ),
    'participants', jsonb_build_object(
      'mode', case when is_pike then 'teams' else 'teams_and_solo' end,
      'catchUnit', case when is_pike then 'entry' else 'athlete' end,
      'roster', coalesce(v1->'roster', jsonb_build_object(
        'minAthletes', 2, 'maxAthletes', 2, 'captain', false, 'representative', false
      )),
      'juniors', jsonb_build_object(
        'mark', not is_pike,
        'separateStandings', separate_juniors
      )
    ),
    'catch', jsonb_build_object(
      'measure', 'weight',
      'species', jsonb_build_object('enabled', false, 'list', '[]'::jsonb, 'counted', '[]'::jsonb),
      'bagLimit', null,
      'minFishWeightG', null
    ),
    'scoring', jsonb_build_object(
      'group', coalesce(v1->'ranking'->>'group', 'zone_tour'),
      'zeroPlace', coalesce(v1->'ranking'->>'zeroPlace', 'group_size_plus_one'),
      'tieAverage', coalesce((v1->'ranking'->>'tieAverage')::boolean, true),
      'teamScore', case when is_pike then 'own_places' else 'sum_athlete_places' end,
      'tiebreakers', out_tb
    ),
    'standings', jsonb_build_object(
      'team', standings_team,
      'individual', standings_ind,
      'juniors', separate_juniors
    ),
    'draw', jsonb_build_object(
      'level', case when is_pike then 'entry' else 'athlete' end,
      'method', draw_method,
      'zonesOnly', false,
      'slipPackId', to_jsonb(slip_pack)
    ),
    'setup', jsonb_build_object(
      'scheduleTemplate', jsonb_build_object(
        'fishingMinutes', 50,
        'moveMinutes', 10,
        'dayStartTime', case when is_pike then '07:00' else '07:30' end,
        'extras', '[]'::jsonb
      ),
      'mapMode', case when is_pike then 'schematic' else 'geo' end,
      'rulesTemplate', null,
      'spectatorRulesHint', is_pike
    )
  );
end;
$$;

-- Convert tournaments still on v1
update public.tournaments
set format = public.upgrade_format_v1_to_v2(format)
where format is not null
  and coalesce((format->>'version')::int, 1) < 2;

-- Fold draw_zones_only + map_mode into format
update public.tournaments
set format = jsonb_set(
  jsonb_set(
    format,
    '{draw,zonesOnly}',
    to_jsonb(coalesce(draw_zones_only, false)),
    true
  ),
  '{setup,mapMode}',
  to_jsonb(coalesce(map_mode, 'schematic')),
  true
)
where format is not null
  and coalesce((format->>'version')::int, 1) >= 2;

-- Convert league defaults
update public.leagues
set default_format = public.upgrade_format_v1_to_v2(default_format)
where default_format is not null
  and coalesce((default_format->>'version')::int, 1) < 2;

-- New default for tournaments.format column
alter table public.tournaments
  alter column format set default '{
    "version":2,
    "structure":{
      "tours":[{"number":1,"day":1,"minis":5},{"number":2,"day":1,"minis":5}],
      "zones":[{"code":"A","label":"Зона A"},{"code":"B","label":"Зона B"}],
      "zoneRotation":"swap_pairs"
    },
    "participants":{
      "mode":"teams",
      "catchUnit":"entry",
      "roster":{"minAthletes":2,"maxAthletes":2,"captain":false,"representative":false},
      "juniors":{"mark":false,"separateStandings":false}
    },
    "catch":{
      "measure":"weight",
      "species":{"enabled":false,"list":[],"counted":[]},
      "bagLimit":null,
      "minFishWeightG":null
    },
    "scoring":{
      "group":"zone_tour",
      "zeroPlace":"group_size_plus_one",
      "tieAverage":true,
      "teamScore":"own_places",
      "tiebreakers":[{"kind":"total_weight"},{"kind":"last_tour_weight"},{"kind":"zone_weight","zone":"B"}]
    },
    "standings":{"team":true,"individual":false,"juniors":false},
    "draw":{"level":"entry","method":"slips","zonesOnly":false,"slipPackId":"pikecup"},
    "setup":{
      "scheduleTemplate":{"fishingMinutes":50,"moveMinutes":10,"dayStartTime":"07:00","extras":[]},
      "mapMode":"schematic",
      "rulesTemplate":null,
      "spectatorRulesHint":true
    }
  }'::jsonb;

comment on column public.tournaments.format is 'Tournament format snapshot (schema version 2). Presets only seed this; never mutate historical tournaments via preset edits.';
comment on column public.tournaments.draw_zones_only is 'Deprecated: mirrored from format.draw.zonesOnly; kept for sync until removed.';
comment on column public.tournaments.map_mode is 'Deprecated: mirrored from format.setup.mapMode; kept for sync until removed.';
