-- Жеребьёвка individual: только зоны A/B, без секторов и бумажек.
alter table public.tournaments
  add column if not exists draw_zones_only boolean not null default false;

comment on column public.tournaments.draw_zones_only is
  'true = жеребьёвка только по зонам (напарник opposite); сектора/бумажки не используются';
