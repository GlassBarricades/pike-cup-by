import { Stack, Text } from '@mantine/core'
import { formatTournamentDate } from '../../features/tournament/date'
import { useSeasonDigest } from '../../features/tournament/season'
import { formatPlace } from '../../features/tournament/scoring'
import { podiumRows } from '../../features/tournament/spectator'
import { EmptyState, SurfaceCard } from '../../ui'

export function V2Archive() {
  const { data: bundles = [], isLoading } = useSeasonDigest()
  if (isLoading) return <Text c="dimmed">Считаем итоги…</Text>
  if (bundles.length === 0) return <EmptyState title="Архив пуст" />
  return (
    <Stack gap="xs">
      {bundles.map((bundle) => {
        const podium = podiumRows(bundle.standings)
        const lines = [
          `${formatTournamentDate(bundle.tournament.event_date)} · ${bundle.tournament.location}`,
          `${bundle.standings.length} команд`,
          podium.length
            ? podium.map((row, index) => `${index + 1}. ${row.teamName} (${formatPlace(row.placeSum)})`).join(' · ')
            : 'Итога ещё нет',
        ]
        return <SurfaceCard key={bundle.tournament.id} to={`/live/t/${bundle.tournament.id}`} title={bundle.tournament.name} lines={lines} />
      })}
    </Stack>
  )
}
