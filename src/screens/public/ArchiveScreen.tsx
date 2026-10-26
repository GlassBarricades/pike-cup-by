import { Button, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { formatTournamentDate } from '../../features/tournament/date'
import { useSegmentsForTournaments, useTournaments } from '../../features/tournament/hooks'
import { getCompetitionStage, type CompetitionStage } from '../../features/tournament/schedule'
import type { ScheduleSegment, Tournament } from '../../features/tournament/types'
import { useNow } from '../../features/tournament/useNow'
import { EmptyState, PageHeader, SurfaceCard } from '../../ui'

type TournamentRow = {
  tournament: Tournament
  stage: CompetitionStage
}

function segmentsByTournament(rows: ScheduleSegment[]): Map<string, ScheduleSegment[]> {
  const map = new Map<string, ScheduleSegment[]>()
  for (const row of rows) {
    const list = map.get(row.tournament_id) ?? []
    list.push(row)
    map.set(row.tournament_id, list)
  }
  return map
}

export function ArchiveScreen() {
  const { data: tournaments = [], isLoading } = useTournaments()
  const ids = useMemo(() => tournaments.map((tournament) => tournament.id), [tournaments])
  const { data: segments = [], isSuccess: segmentsReady } = useSegmentsForTournaments(ids)
  const now = useNow(15_000)
  const { role } = useAuth()
  const canManage = canManageTournament(role)

  const { featured, restOpen, byYear } = useMemo(() => {
    const byId = segmentsByTournament(segments)
    const rows: TournamentRow[] = tournaments.map((tournament) => ({
      tournament,
      stage: getCompetitionStage(tournament, byId.get(tournament.id) ?? [], now),
    }))
    const open = rows.filter((row) => row.stage !== 'completed')
    const done = rows.filter((row) => row.stage === 'completed')
    const ranked = [...open].sort((a, b) => {
      if (a.stage === 'live' && b.stage !== 'live') return -1
      if (b.stage === 'live' && a.stage !== 'live') return 1
      return b.tournament.event_date.localeCompare(a.tournament.event_date)
    })
    const [current, ...others] = ranked
    const map = new Map<string, TournamentRow[]>()
    for (const row of done) {
      const year = row.tournament.event_date.slice(0, 4)
      const list = map.get(year) ?? []
      list.push(row)
      map.set(year, list)
    }
    return {
      featured: current ?? null,
      restOpen: others,
      byYear: [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])),
    }
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
          title="Турниры"
          rightSection={
            canManage ? (
              <Button component={Link} to="/staff/tournament" color="signal" variant="outline" size="sm">
                Создать
              </Button>
            ) : undefined
          }
        />
        <Text size="sm" c="dimmed">
          Все соревнования PikeCup.
        </Text>

        {tournaments.length === 0 ? (
          <EmptyState title="Турниров пока нет" description="Соревнования появятся здесь после публикации." />
        ) : (
          <Stack gap="lg">
            {featured && (
              <TournamentCard row={featured} featured />
            )}
            {restOpen.map((row) => (
              <TournamentCard key={row.tournament.id} row={row} />
            ))}
            {byYear.map(([year, list]) => (
              <Stack key={year} gap="xs">
                <Text className="pc-display" size="sm" c="dimmed">
                  {year}
                </Text>
                {list.map((row) => (
                  <TournamentCard key={row.tournament.id} row={row} />
                ))}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </div>
  )
}

function TournamentCard({ row, featured = false }: { row: TournamentRow; featured?: boolean }) {
  const { tournament, stage } = row
  return (
    <SurfaceCard
      to={`/tournament/${tournament.id}`}
      title={tournament.name}
      stage={stage}
      featured={featured}
      lines={[`${formatTournamentDate(tournament.event_date)} · ${tournament.location}`]}
    />
  )
}
