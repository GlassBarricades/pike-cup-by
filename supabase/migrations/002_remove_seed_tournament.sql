-- Удалить засеянный турнир 7 ноября 2026 (и связанные данные по cascade)
delete from public.tournaments
where event_date = '2026-11-07'
  and name = 'Pike Cup in Belarus';
