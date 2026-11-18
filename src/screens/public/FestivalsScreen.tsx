import { useMemo } from 'react'
import { Button, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { formatTournamentDate } from '../../features/tournament/date'
import { useSegmentsForTournaments, useTournaments } from '../../features/tournament/hooks'
import { getCompetitionStage } from '../../features/tournament/schedule'
import type { ScheduleSegment } from '../../features/tournament/types'
import { useNow } from '../../features/tournament/useNow'
import { EmptyState, PageHeader, SurfaceCard } from '../../ui'

function segmentsByTournament(rows: ScheduleSegment[]): Map<string, ScheduleSegment[]> {
  const map = new Map<string, ScheduleSegment[]>()
  for (const row of rows) {
    const list = map.get(row.tournament_id) ?? []
    list.push(row)
    map.set(row.tournament_id, list)
  }
  return map
}

export function FestivalsScreen() {
  const { data: tournaments = [], isLoading } = useTournaments({ festivalsOnly: true })
  const ids = useMemo(() => tournaments.map((tournament) => tournament.id), [tournaments])
  const { data: segments = [], isSuccess: segmentsReady } = useSegmentsForTournaments(ids)
  const now = useNow(15_000)
  const { role } = useAuth()
  const canManage = canManageTournament(role)

  const rows = useMemo(() => {
    const byId = segmentsByTournament(segments)
    return tournaments
      .filter((tournament) => tournament.status !== 'draft')
      .map((tournament) => ({
        tournament,
        stage: getCompetitionStage(tournament, byId.get(tournament.id) ?? [], now),
      }))
      .sort((a, b) => b.tournament.event_date.localeCompare(a.tournament.event_date))
  }, [tournaments, segments, now])

  if (isLoading || (ids.length > 0 && !segmentsReady)) {
    return (
      <div className="pc-page">
        <Text c="dimmed">Загрузка…</Text>
      </div>
    )
  }

  return (
    <div className="pc-page">
      <Stack gap="lg">
        <PageHeader
          title="Фестивали"
          rightSection={
            canManage ? (
              <Button component={Link} to="/staff/tournament?create=1" color="signal" variant="outline" size="sm">
                Создать
              </Button>
            ) : undefined
          }
        />
        <Text size="sm" c="dimmed">
          Соревнования вне лиг — без кубкового сезона.
        </Text>

        {rows.length === 0 ? (
          <EmptyState title="Фестивалей пока нет" description="События без привязки к лиге появятся здесь." />
        ) : (
          <Stack gap="xs">
            {rows.map((row) => (
              <SurfaceCard
                key={row.tournament.id}
                to={`/tournament/${row.tournament.id}`}
                title={row.tournament.name}
                stage={row.stage}
                lines={[`${formatTournamentDate(row.tournament.event_date)} · ${row.tournament.location}`]}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </div>
  )
}
