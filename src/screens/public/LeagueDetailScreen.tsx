import { useMemo } from 'react'
import { Button, Stack, Text } from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { formatTournamentDate } from '../../features/tournament/date'
import { LEAGUE_KIND_LABEL, regionLabel } from '../../features/tournament/leagueLabels'
import {
  useActiveTournament,
  useLeagueBySlug,
  useSegmentsForTournaments,
  useTournaments,
} from '../../features/tournament/hooks'
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

export function LeagueDetailScreen() {
  const { slug } = useParams()
  const { data: league, isLoading: leagueLoading } = useLeagueBySlug(slug)
  const { data: tournaments = [], isLoading: listLoading } = useTournaments(
    league ? { leagueId: league.id } : undefined,
    Boolean(league),
  )
  const { data: active } = useActiveTournament(
    league ? { kind: 'league', leagueId: league.id } : { kind: 'any' },
  )
  const ids = useMemo(() => tournaments.map((tournament) => tournament.id), [tournaments])
  const { data: segments = [], isSuccess: segmentsReady } = useSegmentsForTournaments(ids)
  const now = useNow(15_000)
  const { role } = useAuth()
  const canManage = canManageTournament(role)

  const { featured, restOpen, byYear } = useMemo(() => {
    const byId = segmentsByTournament(segments)
    const rows: TournamentRow[] = tournaments
      .filter((tournament) => tournament.status !== 'draft')
      .map((tournament) => ({
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

  if (leagueLoading || (league && listLoading) || (ids.length > 0 && !segmentsReady)) {
    return (
      <div className="pc-page">
        <Text c="dimmed">Загрузка…</Text>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="pc-page">
        <EmptyState
          title="Лига не найдена"
          description="Проверьте ссылку или вернитесь к списку лиг."
          action={
            <Button component={Link} to="/leagues" color="signal">
              К лигам
            </Button>
          }
        />
      </div>
    )
  }

  const meta = [LEAGUE_KIND_LABEL[league.kind], regionLabel(league.region_code)].filter(Boolean).join(' · ')

  return (
    <div className="pc-page">
      <Stack gap="lg">
        <PageHeader
          title={league.name}
          rightSection={
            canManage ? (
              <Button component={Link} to="/staff/tournament?create=1" color="signal" variant="outline" size="sm">
                Создать этап
              </Button>
            ) : undefined
          }
        />
        <Text size="sm" c="dimmed">
          {meta}
          {league.description ? ` · ${league.description}` : ''}
        </Text>

        {active && active.status === 'live' && (
          <SurfaceCard
            to={`/live/t/${active.id}`}
            title={active.name}
            featured
            stage="live"
            lines={[`${formatTournamentDate(active.event_date)} · ${active.location}`, 'LIVE']}
          />
        )}

        {tournaments.filter((t) => t.status !== 'draft').length === 0 ? (
          <EmptyState title="Этапов пока нет" description="Соревнования лиги появятся здесь после публикации." />
        ) : (
          <Stack gap="lg">
            {featured && <TournamentCard row={featured} featured />}
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
