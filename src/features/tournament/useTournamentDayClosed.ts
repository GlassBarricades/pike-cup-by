import { useSegments } from './hooks'
import { getCompetitionStage } from './schedule'
import { useStaffTournament } from './StaffTournamentContext'
import { useNow } from './useNow'

/** День закрыт: расписание уже кончилось или турнир помечен архивом. */
export function useTournamentDayClosed() {
  const { selected } = useStaffTournament()
  const { data: segments = [], isSuccess } = useSegments(selected?.id)
  const now = useNow(15_000)
  if (!selected) return false
  if (selected.status === 'finished') return true
  if (!isSuccess) return false
  return getCompetitionStage(selected, segments, now) === 'completed'
}
