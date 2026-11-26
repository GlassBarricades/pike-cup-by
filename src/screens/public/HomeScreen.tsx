import { Badge, Button, Group, Stack, Text, Title, UnstyledButton } from '@mantine/core'
import { IconClipboardList, IconSettings } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageRoles, isStaff } from '../../features/auth/permissions'
import {
  useActiveTournament,
  useCatches,
  useEntries,
  useLeagues,
  useMiniTours,
  useSegments,
  useTournaments,
} from '../../features/tournament/hooks'
import { LEAGUE_KIND_LABEL, regionLabel } from '../../features/tournament/leagueLabels'
import { formatTournamentDate } from '../../features/tournament/date'
import { getCompetitionStage, getCurrentPhase, tourNumberFromPhase, type CurrentPhase } from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'
import type { CatchRow, MiniTour, TournamentEntry } from '../../features/tournament/types'
import { BrandMark, EmptyState, SectionTitle, SurfaceCard } from '../../ui'
import { InstallAppGuide } from './InstallAppGuide'

function tourWeight(
  entryId: string,
  tourNumber: number,
  catches: CatchRow[],
  miniTours: MiniTour[],
) {
  const miniIds = new Set(miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id))
  return catches
    .filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id))
    .reduce((s, c) => s + c.weight_grams, 0)
}

function liveAnnounceLine(phase: CurrentPhase | null, paused: boolean) {
  if (!phase) return paused ? 'Пауза' : 'Идёт турнир'
  const label =
    phase.kind === 'before' || phase.kind === 'gap'
      ? (phase.nextSegment?.title ?? 'До старта')
      : phase.kind === 'active'
        ? (phase.segment?.title ?? 'Этап')
        : 'Завершено'
  const msLeft =
    phase.endsAtEffective != null && (phase.kind === 'active' || phase.kind === 'gap')
      ? Math.max(0, phase.endsAtEffective.getTime() - phase.effectiveNow.getTime())
      : null
  const minutes = msLeft != null ? `${Math.ceil(msLeft / 60_000)} мин` : null
  return [paused ? 'Пауза' : null, label, minutes].filter(Boolean).join(' · ')
}

function formatHomeDateLine(now: Date) {
  return now.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function HomeScreen() {
  const { role } = useAuth()
  const now = useNow(5_000)
  const { data: tournament, isLoading: activeLoading } = useActiveTournament()
  const { data: leagues = [], isLoading: leaguesLoading } = useLeagues()
  const { data: festivals = [], isLoading: festivalsLoading } = useTournaments({ festivalsOnly: true })
  const id = tournament?.id
  const { data: entries = [] } = useEntries(id)
  const { data: catches = [] } = useCatches(id)
  const { data: miniTours = [] } = useMiniTours(id)
  const { data: segments = [], isSuccess: segmentsReady } = useSegments(id)

  const stage = tournament && segmentsReady ? getCompetitionStage(tournament, segments, now) : null
  const phase = tournament && stage !== 'completed' ? getCurrentPhase(tournament, segments, now) : null

  const weighedProgress = useMemo(() => {
    if (!tournament) return null
    const tour = tourNumberFromPhase(phase) ?? 1
    const assigned = entries.filter((e) => e.start_zone)
    const weighed = assigned.filter(
      (e: TournamentEntry) => tourWeight(e.id, tour, catches, miniTours) > 0,
    ).length
    return { weighed, total: assigned.length || entries.length }
  }, [tournament, entries, catches, miniTours, phase])

  const sortedLeagues = useMemo(
    () =>
      [...leagues].sort((a, b) => {
        const kindOrder = { national: 0, regional: 1, other: 2 } as const
        const byKind = kindOrder[a.kind] - kindOrder[b.kind]
        if (byKind !== 0) return byKind
        return a.name.localeCompare(b.name, 'ru')
      }),
    [leagues],
  )

  const openFestivals = useMemo(
    () =>
      festivals
        .filter((item) => item.status !== 'draft' && item.status !== 'finished')
        .slice(0, 3),
    [festivals],
  )

  if (activeLoading || leaguesLoading || festivalsLoading || (id && !segmentsReady)) {
    return (
      <div className="pc-page">
        <Text c="dimmed">Загрузка…</Text>
      </div>
    )
  }

  const live = stage === 'live'
  const showWeighed = !live && weighedProgress && weighedProgress.total > 0
  const showStaff = isStaff(role)
  const showAdmin = canManageRoles(role)

  return (
    <div className="pc-page">
      <Stack gap="lg">
        <Stack gap="xs">
          <BrandMark size="lg" link={false} />
          <Title order={3} className="pc-display" tt="capitalize">
            {formatHomeDateLine(now)}
          </Title>
          <Text size="sm" c="dimmed">
            Рыболовный спорт Республики Беларусь — лиги, этапы и фестивали.
          </Text>
          {(showWeighed || showStaff || showAdmin) && (
            <Group gap={8} wrap="wrap">
              {showWeighed && (
                <Badge variant="outline" color="gray" size="lg" radius={0}>
                  Взвешено · {weighedProgress.weighed}/{weighedProgress.total}
                </Badge>
              )}
              {showStaff && (
                <Badge
                  variant="light"
                  color="gray"
                  size="lg"
                  radius={0}
                  component={Link}
                  to="/staff"
                  leftSection={<IconClipboardList size={14} />}
                  style={{ cursor: 'pointer', minHeight: 28 }}
                >
                  Штаб
                </Badge>
              )}
              {showAdmin && (
                <Badge
                  variant="light"
                  color="gray"
                  size="lg"
                  radius={0}
                  component={Link}
                  to="/admin"
                  leftSection={<IconSettings size={14} />}
                  style={{ cursor: 'pointer', minHeight: 28 }}
                >
                  Админ
                </Badge>
              )}
            </Group>
          )}
        </Stack>

        <InstallAppGuide />

        {live && tournament ? (
          <UnstyledButton component={Link} to="/live" className="pc-live-card">
            <Stack gap={6}>
              <Text className="pc-display" style={{ fontSize: '1.45rem', lineHeight: 1.1 }}>
                {tournament.name}
              </Text>
              <Text>
                {liveAnnounceLine(phase, Boolean(tournament.schedule_paused_at))}
              </Text>
              {weighedProgress && weighedProgress.total > 0 && (
                <Text size="sm" c="dimmed">
                  Взвешено · {weighedProgress.weighed}/{weighedProgress.total}
                </Text>
              )}
              <Text size="sm" fw={700} style={{ color: 'var(--pc-live)' }}>
                Смотреть
              </Text>
            </Stack>
          </UnstyledButton>
        ) : null}

        <Stack gap="xs">
          <Group justify="space-between" align="baseline">
            <SectionTitle>Лиги</SectionTitle>
            <Button component={Link} to="/leagues" variant="subtle" color="gray" size="compact-sm">
              Все
            </Button>
          </Group>
          {sortedLeagues.length === 0 ? (
            <EmptyState title="Лиг пока нет" description="Серии соревнований появятся после публикации." />
          ) : (
            sortedLeagues.map((league) => (
              <SurfaceCard
                key={league.id}
                to={`/leagues/${league.slug}`}
                title={league.name}
                lines={[
                  [LEAGUE_KIND_LABEL[league.kind], regionLabel(league.region_code)].filter(Boolean).join(' · '),
                ]}
              />
            ))
          )}
        </Stack>

        <Stack gap="xs">
          <Group justify="space-between" align="baseline">
            <SectionTitle>Фестивали</SectionTitle>
            <Button component={Link} to="/festivals" variant="subtle" color="gray" size="compact-sm">
              Все
            </Button>
          </Group>
          {openFestivals.length === 0 ? (
            <Text size="sm" c="dimmed">
              Открытых фестивалей сейчас нет.{' '}
              <Text span component={Link} to="/festivals" style={{ color: 'var(--pc-signal)' }}>
                Архив
              </Text>
            </Text>
          ) : (
            openFestivals.map((item) => (
              <SurfaceCard
                key={item.id}
                to={`/tournament/${item.id}`}
                title={item.name}
                lines={[`${formatTournamentDate(item.event_date)} · ${item.location}`]}
              />
            ))
          )}
        </Stack>

        <Button component={Link} to="/tournament" variant="outline" color="gray">
          Все турниры
        </Button>
      </Stack>
    </div>
  )
}
