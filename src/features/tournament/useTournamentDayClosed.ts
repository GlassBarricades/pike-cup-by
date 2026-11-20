import { useSegments } from './hooks'
import { getCompetitionStage } from './schedule'
import { useStaffTournament } from './StaffTournamentContext'
import type { Tournament } from './types'
import { useNow } from './useNow'

/** День закрыт: расписание уже кончилось или турнир помечен архивом. */
export function useTournamentDayClosed(tournament?: Tournament | null) {
  const { selected } = useStaffTournament()
  const active = tournament !== undefined ? tournament : selected
  const { data: segments = [], isSuccess } = useSegments(active?.id)
  const now = useNow(15_000)
  if (!active) return false
  if (active.status === 'finished') return true
  if (!isSuccess) return false
  return getCompetitionStage(active, segments, now) === 'completed'
}
