import { Anchor, Stack, Text } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import {
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
  useTournament,
  useTournamentRealtime,
} from '../../features/tournament/hooks'
import { TournamentView } from './TournamentView'

export function EventScreen() {
  const { tournamentId } = useParams()
  const { data: tournament, isLoading } = useTournament(tournamentId)
  const { data: entries = [] } = useEntries(tournament?.id)
  const { data: catches = [] } = useCatches(tournament?.id)
  const { data: miniTours = [] } = useMiniTours(tournament?.id)
  const { data: segments = [] } = useSegments(tournament?.id)
  useTournamentRealtime(tournament?.id)

  if (isLoading) {
    return (
      <div className="pc-page">
        <Text c="dimmed">Загрузка…</Text>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="pc-page">
        <Stack gap="sm">
          <Text>Турнир не найден</Text>
          <Anchor component={Link} to="/tournament" c="signal">
            К турнирам
          </Anchor>
        </Stack>
      </div>
    )
  }

  return (
    <div className="pc-page pc-page--wide">
      <TournamentView
        tournament={tournament}
        entries={entries}
        catches={catches}
        miniTours={miniTours}
        segments={segments}
        showBack
      />
    </div>
  )
}
