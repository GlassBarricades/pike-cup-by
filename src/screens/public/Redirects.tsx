import { Navigate, useParams } from 'react-router-dom'
import { useActiveTournament } from '../../features/tournament/hooks'

export function RedirectToCurrent({ suffix = '' }: { suffix?: string }) {
  const { data, isLoading } = useActiveTournament()
  if (isLoading) return null
  if (!data) return <Navigate to="/tournament" replace />
  return <Navigate to={`/tournament/${data.id}${suffix}`} replace />
}

export function RedirectResultsToCurrent() {
  return <RedirectToCurrent suffix="?tab=results" />
}

export function RedirectLegacyResults() {
  const { tournamentId } = useParams()
  if (!tournamentId) return <Navigate to="/tournament" replace />
  return <Navigate to={`/tournament/${tournamentId}?tab=results`} replace />
}

export function RedirectToTab({ tab }: { tab: string }) {
  const { tournamentId } = useParams()
  if (!tournamentId) return <Navigate to="/tournament" replace />
  return <Navigate to={`/tournament/${tournamentId}?tab=${tab}`} replace />
}
