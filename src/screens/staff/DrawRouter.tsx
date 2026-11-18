import { getFormat } from '../../features/tournament/formats'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { EmptyState } from '../../ui'
import { AthleteDrawScreen } from './AthleteDrawScreen'
import { DrawScreen } from './DrawScreen'

export function DrawRouter() {
  const { selected: tournament, loading } = useStaffTournament()
  if (loading) return null
  if (!tournament) {
    return <EmptyState title="Нет турнира" description="Выберите турнир сверху." />
  }
  const format = getFormat(tournament)
  if (format.draw === 'per_athlete_sectors') return <AthleteDrawScreen />
  if (format.draw === 'none') {
    return <EmptyState title="Жеребьёвка не используется" description="В формате турнира жеребьёвка отключена." />
  }
  return <DrawScreen />
}
