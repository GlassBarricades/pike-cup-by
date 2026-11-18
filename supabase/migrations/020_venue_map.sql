-- Гео-карта площадки турнира: точка сбора + полигоны зон (Leaflet).
alter table public.tournaments
  add column if not exists venue_map jsonb;

comment on column public.tournaments.venue_map is
  'OSM/Leaflet: { center, zoom, meetingPoint, zones:[{code, ring:[lat,lng]}] }';
