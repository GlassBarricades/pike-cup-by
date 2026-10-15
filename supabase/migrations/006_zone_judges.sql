-- Zone judges: assign users with judge role to physical zone A/B per tournament

create table public.tournament_zone_judges (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  zone public.zone_code not null,
  created_at timestamptz not null default now(),
  unique (tournament_id, user_id)
);

create index tournament_zone_judges_tournament_idx
  on public.tournament_zone_judges (tournament_id);

create index tournament_zone_judges_user_idx
  on public.tournament_zone_judges (user_id);

alter table public.tournament_zone_judges enable row level security;

create policy zone_judges_select_staff on public.tournament_zone_judges
  for select using (public.is_judge_or_above());

create policy zone_judges_organizer_write on public.tournament_zone_judges
  for all using (public.is_organizer_or_admin())
  with check (public.is_organizer_or_admin());

alter publication supabase_realtime add table public.tournament_zone_judges;
