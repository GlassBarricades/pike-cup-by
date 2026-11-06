-- Глобальные настройки приложения (одна строка)

create table public.app_settings (
  id integer primary key default 1 check (id = 1),
  hide_registration boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (1);

alter table public.app_settings enable row level security;

create policy app_settings_select_all on public.app_settings
  for select using (true);

create policy app_settings_admin_update on public.app_settings
  for update using (public.is_admin())
  with check (public.is_admin());
