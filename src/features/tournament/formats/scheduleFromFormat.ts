/**
 * Generate a day (or multi-day) schedule from format.structure.tours + setup.scheduleTemplate.
 * Fishing slots are derived from tours; extras and move windows fill the gaps.
 */
import type { TournamentFormat } from './types'
import { daysCount, toursOnDay } from './capabilities'

export type GeneratedScheduleRow = {
  key: string
  title: string
  sort_order: number
  /** Minutes from midnight on the event's calendar day offset */
  startMinOfDay: number
  endMinOfDay: number
  day: number
  tour?: number
  mini?: number
  windowKind?: 'fishing' | 'move'
  moveTour?: number
  moveMini?: number
}

function parseDayStart(time: string | undefined): number {
  if (!time) return 7 * 60
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function roman(n: number): string {
  const map = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
  return map[n] ?? String(n)
}

/**
 * Build schedule rows for all days in the format.
 * `eventDate` is the first day (YYYY-MM-DD); callers convert startMinOfDay + day → ISO.
 */
export function generateScheduleFromFormat(format: TournamentFormat): GeneratedScheduleRow[] {
  const tpl = format.setup.scheduleTemplate
  const fishingMin = tpl.fishingMinutes
  const moveMin = tpl.moveMinutes
  const rows: GeneratedScheduleRow[] = []
  let sort = 10
  const totalDays = daysCount(format)

  for (let day = 1; day <= totalDays; day += 1) {
    let cursor = parseDayStart(tpl.dayStartTime)
    const dayTours = toursOnDay(format, day)

    if (day === 1) {
      rows.push({
        key: 'briefing',
        title: 'Брифинг / жеребьёвка',
        sort_order: sort,
        startMinOfDay: Math.max(0, cursor - 60),
        endMinOfDay: cursor,
        day,
      })
      sort += 10
    } else {
      rows.push({
        key: `day${day}_open`,
        title: `День ${day}: построение`,
        sort_order: sort,
        startMinOfDay: Math.max(0, cursor - 30),
        endMinOfDay: cursor,
        day,
      })
      sort += 10
    }

    for (let ti = 0; ti < dayTours.length; ti += 1) {
      const tour = dayTours[ti]!
      for (let mini = 1; mini <= tour.minis; mini += 1) {
        const isFirst = ti === 0 && mini === 1
        if (!isFirst && moveMin > 0) {
          rows.push({
            key: `move_t${tour.number}_mt${mini}`,
            title: `Переход · тур ${roman(tour.number)} · мт ${mini}`,
            sort_order: sort,
            startMinOfDay: cursor,
            endMinOfDay: cursor + moveMin,
            day,
            windowKind: 'move',
            moveTour: tour.number,
            moveMini: mini,
          })
          sort += 5
          cursor += moveMin
        } else if (isFirst) {
          rows.push({
            key: `to_t${tour.number}_mt1`,
            title: `Выход на тур ${roman(tour.number)}`,
            sort_order: sort,
            startMinOfDay: cursor,
            endMinOfDay: cursor + Math.min(30, moveMin || 30),
            day,
            windowKind: 'move',
            moveTour: tour.number,
            moveMini: 1,
          })
          sort += 5
          cursor += Math.min(30, moveMin || 30)
        }

        rows.push({
          key: `tour${tour.number}_mt${mini}`,
          title: `${roman(tour.number)} тур · мини-тур ${mini}`,
          sort_order: sort,
          startMinOfDay: cursor,
          endMinOfDay: cursor + fishingMin,
          day,
          tour: tour.number,
          mini,
          windowKind: 'fishing',
        })
        sort += 10
        cursor += fishingMin
      }

      // Break between tours on same day
      if (ti < dayTours.length - 1) {
        const breakMin = 60
        rows.push({
          key: `break_d${day}_after_t${tour.number}`,
          title: 'Перерыв',
          sort_order: sort,
          startMinOfDay: cursor,
          endMinOfDay: cursor + breakMin,
          day,
          windowKind: 'move',
          moveTour: dayTours[ti + 1]!.number,
          moveMini: 1,
        })
        sort += 10
        cursor += breakMin
      }
    }

    rows.push({
      key: day === totalDays ? 'awards' : `day${day}_close`,
      title: day === totalDays ? 'Подсчёт и награждение' : `Конец дня ${day}`,
      sort_order: sort,
      startMinOfDay: cursor,
      endMinOfDay: cursor + 40,
      day,
    })
    sort += 10
  }

  return rows
}

/** Convert generated rows to the seed shape used by api.seedScheduleFromFormat. */
export function generatedToSeedRows(
  rows: GeneratedScheduleRow[],
  eventDate: string,
): {
  key: string
  title: string
  sort_order: number
  startHour: number
  startMin: number
  endHour: number
  endMin: number
  tour?: number
  mini?: number
  windowKind?: 'fishing' | 'move'
  moveTour?: number
  moveMini?: number
  /** Extra: calendar date for multi-day (YYYY-MM-DD) */
  eventDate: string
}[] {
  return rows.map((row) => {
    const date = addDays(eventDate, row.day - 1)
    return {
      key: row.key,
      title: row.title,
      sort_order: row.sort_order,
      startHour: Math.floor(row.startMinOfDay / 60) % 24,
      startMin: row.startMinOfDay % 60,
      endHour: Math.floor(row.endMinOfDay / 60) % 24,
      endMin: row.endMinOfDay % 60,
      tour: row.tour,
      mini: row.mini,
      windowKind: row.windowKind,
      moveTour: row.moveTour,
      moveMini: row.moveMini,
      eventDate: date,
    }
  })
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
