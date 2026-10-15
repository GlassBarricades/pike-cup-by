import { Navigate, useParams } from 'react-router-dom'
import { useTournament } from '../../features/tournament/hooks'
import { EmptyState } from '../../ui'
import { Text } from '@mantine/core'

/** Legacy route → redirect to tournament ?tab=rules */
export function RulesScreen() {
  const { tournamentId } = useParams()
  const { data: tournament, isLoading } = useTournament(tournamentId)

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
        <EmptyState title="Турнир не найден" />
      </div>
    )
  }
  return <Navigate to={`/tournament/${tournament.id}?tab=rules`} replace />
}
