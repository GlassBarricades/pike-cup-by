-- Правило места при нулевом улове: n+1 (true) или n (false), настраивается на турнир
alter table public.tournaments
  add column zero_place_is_group_size_plus_one boolean not null default true;
