import { Button, Group, Stack, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { BrandMark, LiveStrip, TopStrip } from '../components/ui'
import { PageFrame } from '../components/PageFrame'
import {
  useActiveTournament,
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
} from '../features/tournament/hooks'
import { formatTournamentDate } from '../features/tournament/date'
import { getCurrentPhase } from '../features/tournament/schedule'
import { computeStandings } from '../features/tournament/scoring'
import { useNow } from '../features/tournament/useNow'
import { useMemo } from 'react'

export function HomePage() {
  const { data: tournament } = useActiveTournament()
  const { data: segments = [] } = useSegments(tournament?.id)
  const { data: entries = [] } = useEntries(tournament?.id)
  const { data: catches = [] } = useCatches(tournament?.id)
  const { data: miniTours = [] } = useMiniTours(tournament?.id)
  const now = useNow()
  const isArchive = tournament?.status === 'finished'
  const phase =
    tournament && !isArchive ? getCurrentPhase(tournament, segments, now) : null

  const msLeft =
    phase?.endsAtEffective != null
      ? Math.max(0, phase.endsAtEffective.getTime() - now.getTime())
      : null

  const livePhase = phase
    ? {
        kind: phase.kind,
        label:
          phase.kind === 'before'
            ? (phase.nextSegment?.title ?? 'До старта')
            : phase.kind === 'active'
              ? (phase.segment?.title ?? 'Этап')
              : 'Финиш дня',
        minutesLeft: msLeft != null ? Math.ceil(msLeft / 60_000) : null,
        paused: Boolean(tournament?.schedule_paused_at),
        delayMinutes: tournament?.schedule_delay_minutes ?? 0,
      }
    : null

  const topRows = useMemo(() => {
    if (!tournament) return []
    return computeStandings(entries, catches, miniTours, {
      zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one,
    }).slice(0, 5)
  }, [tournament, entries, catches, miniTours])

  return (
    <PageFrame>
      <Stack gap="lg" className="pc-hero-enter">
        <div className="pc-hero">
          <div className="pc-hero-content">
            <BrandMark size="xl" inverted />
            <Text mt="md" maw={440} style={{ color: 'rgba(230, 242, 241, 0.88)' }}>
              {tournament
                ? `${tournament.name} · ${formatTournamentDate(tournament.event_date)} · ${tournament.location}`
                : 'Рыболовное соревнование по щуке в Республике Беларусь'}
            </Text>
            <Group mt="lg" gap="sm">
              {tournament && (
                <Button
                  component={Link}
                  to={`/tournament/${tournament.id}/results`}
                  color="lure"
                  size="md"
                >
                  {isArchive ? 'К протоколу' : 'К протоколу'}
                </Button>
              )}
              <Button
                component={Link}
                to={tournament ? `/tournament/${tournament.id}/schedule` : '/tournament'}
                variant="white"
                color="dark"
                size="md"
              >
                {tournament ? 'Расписание' : 'Турниры'}
              </Button>
            </Group>
          </div>
        </div>

        {tournament && (
          <LiveStrip
            phase={isArchive ? null : livePhase}
            archiveLabel={isArchive ? 'Архивный турнир' : undefined}
          />
        )}

        {topRows.length > 0 && (
          <TopStrip
            rows={topRows.map((r) => ({
              entryId: r.entryId,
              teamId: r.teamId,
              teamName: r.teamName,
              finalPlace: r.finalPlace,
              placeSum: r.placeSum,
              totalWeight: r.totalWeight,
            }))}
          />
        )}

        <Group gap="sm">
          <Button component={Link} to="/tournament" variant="outline" color="depth">
            Все турниры
          </Button>
          {tournament && (
            <Button component={Link} to={`/tournament/${tournament.id}`} variant="subtle" color="depth">
              Обзор турнира
            </Button>
          )}
        </Group>
      </Stack>
    </PageFrame>
  )
}
