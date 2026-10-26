-- История улова: кто записал, какое значение было до правки, что удалили.

create table public.catch_revisions (
  id uuid primary key default gen_random_uuid(),
  catch_id uuid references public.catches (id) on delete set null,
  entry_id uuid not null references public.tournament_entries (id) on delete cascade,
  mini_tour_id uuid not null references public.mini_tours (id) on delete cascade,
  weight_grams int not null check (weight_grams > 0),
  action text not null check (action in ('insert', 'update', 'delete')),
  actor_id uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index catch_revisions_entry_idx on public.catch_revisions (entry_id, created_at desc);
create index catch_revisions_catch_idx on public.catch_revisions (catch_id);

alter table public.catch_revisions enable row level security;

create policy catch_revisions_select_org on public.catch_revisions
  for select using (public.is_organizer_or_admin());

create policy catch_revisions_insert_judge on public.catch_revisions
  for insert with check (public.is_judge_or_above());

create policy catch_revisions_delete_org on public.catch_revisions
  for delete using (public.is_organizer_or_admin());
