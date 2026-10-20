-- Schedule windows for new tournaments. Existing rows stay null and keep their old meaning.

alter table public.schedule_segments
  add column window_kind text,
  add column move_tour int,
  add column move_mini int;

alter table public.schedule_segments
  add constraint schedule_segments_window_kind_check
  check (window_kind is null or window_kind in ('fishing', 'move'));

alter table public.schedule_segments
  add constraint schedule_segments_move_tour_check
  check (move_tour is null or move_tour in (1, 2));

alter table public.schedule_segments
  add constraint schedule_segments_move_mini_check
  check (move_mini is null or move_mini between 1 and 5);

alter table public.schedule_segments
  add constraint schedule_segments_move_target_check
  check (
    window_kind is distinct from 'move'
    or (move_tour is not null and move_mini is not null)
  );
