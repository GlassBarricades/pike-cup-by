import { Center, Loader, Text } from '@mantine/core'
import { Navigate, useParams } from 'react-router-dom'
import { useActiveTournament } from '../../features/tournament/hooks'

export function RedirectToCurrent({ suffix = '' }: { suffix?: string }) {
  const { data: tournament, isLoading, isError } = useActiveTournament()

  if (isLoading) {
    return (
      <Center mih={200}>
        <Loader color="depth" />
      </Center>
    )
  }

  if (isError || !tournament) {
    return <Navigate to="/tournament" replace />
  }

  return <Navigate to={`/tournament/${tournament.id}${suffix}`} replace />
}

/** /results → протокол текущего турнира */
export function RedirectResultsToCurrent() {
  const { data: tournament, isLoading } = useActiveTournament()

  if (isLoading) {
    return (
      <Center mih={200}>
        <Loader color="depth" />
      </Center>
    )
  }

  if (!tournament) {
    return <Text c="dimmed">Нет турниров</Text>
  }

  return <Navigate to={`/tournament/${tournament.id}/results`} replace />
}

/** /results/:tournamentId → /tournament/:id/results */
export function RedirectLegacyResults() {
  const { tournamentId } = useParams()
  if (!tournamentId) return <Navigate to="/tournament" replace />
  return <Navigate to={`/tournament/${tournamentId}/results`} replace />
}
