import { Text } from '@mantine/core'
import { Navigate } from 'react-router-dom'
import {
  useActiveTournament,
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
  useTournamentRealtime,
} from '../../features/tournament/hooks'
import { TournamentView } from './TournamentView'

export function LiveScreen() {
  const { data: tournament, isLoading } = useActiveTournament()
  const live = tournament?.status === 'live' ? tournament : null
  const id = live?.id
  const { data: entries = [] } = useEntries(id)
  const { data: catches = [] } = useCatches(id)
  const { data: miniTours = [] } = useMiniTours(id)
  const { data: segments = [] } = useSegments(id)
  useTournamentRealtime(id)

  if (isLoading) {
    return (
      <div className="pc-page">
        <Text c="dimmed">Загрузка…</Text>
      </div>
    )
  }

  if (!live) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="pc-page pc-page--wide">
      <TournamentView
        tournament={live}
        entries={entries}
        catches={catches}
        miniTours={miniTours}
        segments={segments}
        spectator
      />
    </div>
  )
}
