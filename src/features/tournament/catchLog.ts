import { physicalZone } from './schedule'
import { slipSector } from './slips'
import type { TournamentFormat } from './formats/types'
import { entryTeamName, type CatchRow, type MiniTour, type TournamentEntry, type ZoneCode } from './types'

export type CatchLogItem = {
  id: string
  createdAt: string
  entryId: string
  teamId: string | null
  teamName: string
  rosterNames: string[]
  grams: number
  tour: number | null
  mini: number | null
  zone: ZoneCode | null
  sector: number | null
}

export function buildCatchLog(
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  format?: TournamentFormat | null,
): CatchLogItem[] {
  const entryById = new Map(entries.map((entry) => [entry.id, entry]))
  const miniById = new Map(miniTours.map((mini) => [mini.id, mini]))
  return catches
    .map((row) => {
      const entry = entryById.get(row.entry_id)
      const mini = miniById.get(row.mini_tour_id)
      const tour = mini?.tour_number ?? null
      const miniNumber = mini?.mini_number ?? null
      const start = entry?.start_zone ?? entry?.draw_slip?.start_zone ?? null
      return {
        id: row.id,
        createdAt: row.created_at,
        entryId: row.entry_id,
        teamId: entry?.team_id ?? null,
        teamName: entry ? entryTeamName(entry) : 'Команда',
        rosterNames: entry?.roster?.map((member) => member.full_name_snapshot) ?? [],
        grams: row.weight_grams,
        tour,
        mini: miniNumber,
        zone:
          tour != null && start
            ? ((format ? physicalZone(start, tour, format) : physicalZone(start, tour)) as ZoneCode | null)
            : null,
        sector: entry && tour != null && miniNumber != null ? slipSector(entry.draw_slip, tour, miniNumber) : null,
      }
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function formatCatchClock(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Minsk',
  })
}
