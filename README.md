# PikeCup

Мобильное приложение турнира Pike Cup in Belarus (Vite + React + Mantine + Supabase + PWA).

## Стек

- Vite + React + TypeScript
- Mantine, TanStack Query, Zod
- Supabase (Auth, Postgres, RLS, Realtime)
- PWA, деплой Vercel

## Быстрый старт

```bash
npm install
cp .env.example .env
npm run dev
```

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

1. Создайте проект Supabase, включите Email Auth.
2. Выполните SQL из [`supabase/migrations/001_phase1.sql`](supabase/migrations/001_phase1.sql) в SQL Editor.
3. Зарегистрируйте пользователя в приложении.
4. В Table Editor → `profiles` выставьте роль:
   - `admin` — полный доступ + смена ролей (через SQL/Dashboard)
   - `organizer` — настройка турнира, команды, заявки, зоны, регламент
   - `judge` — уловы и сдвиг/пауза расписания в день турнира
   - `participant` — по умолчанию, только просмотр

Если Realtime на `catches`/`tournaments` не включился из миграции, добавьте таблицы в **Database → Replication**.

## Роли

| Действие | participant | judge | organizer | admin |
|----------|:-----------:|:-----:|:---------:|:-----:|
| Публичка / live | + | + | + | + |
| Уловы, сдвиг/пауза | | + | + | + |
| Команды, заявки, зоны, регламент, мета | | | + | + |
| Смена `profiles.role` | | | | + (Dashboard) |

Кабинет: `/staff` (пункт в профиле для staff-ролей).

## Экраны

- `/` — главная, текущий этап
- `/tournament` — список: актуальный + архив
- `/tournament/:id` — хаб турнира (регламент, расписание, команды)
- `/results/:id` — live или итоги архива
- `/staff/*` — кабинет; выбор рабочего турнира для ручного ввода протоколов

### Архив вручную

1. Кабинет → Турниры → создать со статусом «Завершён».
2. Заявки / зоны / улов — для выбранного турнира.
3. Для весов из протокола достаточно записать сумму в МТ1 I тура и МТ1 II тура.

## Расписание и сдвиги

Этап для зрителей считается автоматически по `schedule_segments` и `schedule_delay_minutes`.  
При заминке судья/организатор: `+5`/`+10` мин или пауза («Снять паузу и учесть сдвиг»).

## Составы

Текущий состав команды (`team_memberships`) отделён от снимка на турнир (`tournament_roster_members`).  
Смена справочника не меняет историю участия.

## Скрипты

| Команда | Описание |
|---------|----------|
| `npm run dev` | Разработка |
| `npm run build` | Сборка |
| `npm run preview` | Preview |

## Vercel

Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Framework: Vite. SPA rewrite уже в `vercel.json`.
