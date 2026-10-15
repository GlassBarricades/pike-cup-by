import { Navigate, useParams } from 'react-router-dom'
import { useActiveTournament, useTournament } from '../../features/tournament/hooks'
import { EmptyState } from '../../ui'

/** Legacy route → redirect to tournament ?tab=results */
export function LeaderboardScreen() {
  const { tournamentId } = useParams()
  const activeQuery = useActiveTournament()
  const byIdQuery = useTournament(tournamentId)
  const tournament = tournamentId ? byIdQuery.data : activeQuery.data
  const loading = tournamentId ? byIdQuery.isLoading : activeQuery.isLoading

  if (loading) return null
  if (!tournament) {
    return (
      <div className="pc-page">
        <EmptyState title="Турнир не найден" />
      </div>
    )
  }
  return <Navigate to={`/tournament/${tournament.id}?tab=results`} replace />
}
