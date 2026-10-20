import { Badge, Button, Group, Stack, Text, Title } from '@mantine/core'
import { IconClipboardList, IconSettings } from '@tabler/icons-react'
import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageRoles, isStaff } from '../../features/auth/permissions'
import {
  useActiveTournament,
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
  useTournamentRealtime,
} from '../../features/tournament/hooks'
import { getCurrentPhase, tourNumberFromPhase } from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'
import type { CatchRow, MiniTour, TournamentEntry } from '../../features/tournament/types'
import { BrandMark, EmptyState, LiveBadge } from '../../ui'
import { TournamentView } from './TournamentView'

function tourWeight(
  entryId: string,
  tourNumber: 1 | 2,
  catches: CatchRow[],
  miniTours: MiniTour[],
) {
  const miniIds = new Set(miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id))
  return catches
    .filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id))
    .reduce((s, c) => s + c.weight_grams, 0)
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
  const now = useNow(60_000)
  const { data: tournament, isLoading } = useActiveTournament()
  const id = tournament?.id
  const { data: entries = [] } = useEntries(id)
  const { data: catches = [] } = useCatches(id)
  const { data: miniTours = [] } = useMiniTours(id)
  const { data: segments = [] } = useSegments(id)
  useTournamentRealtime(id)

  const phase =
    tournament && tournament.status !== 'finished'
      ? getCurrentPhase(tournament, segments, now)
      : null

  const weighedProgress = useMemo(() => {
    if (!tournament) return null
    const tour: 1 | 2 = tourNumberFromPhase(phase) ?? 1
    const assigned = entries.filter((e) => e.start_zone)
    const weighed = assigned.filter(
      (e: TournamentEntry) => tourWeight(e.id, tour, catches, miniTours) > 0,
    ).length
    return { weighed, total: assigned.length || entries.length }
  }, [tournament, entries, catches, miniTours, phase])

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
        <Stack gap="lg" py="xl">
          <BrandMark size="xl" link={false} />
          <EmptyState
            title="Турнир скоро"
            description="Актуальный турнир ещё не опубликован. Посмотрите архив прошлых соревнований."
            action={
              <Button component={Link} to="/tournament" color="signal">
                Архив турниров
              </Button>
            }
          />
        </Stack>
      </div>
    )
  }

  return (
    <div className="pc-page pc-page--wide">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={3} className="pc-display" tt="capitalize">
            {formatHomeDateLine(now)}
          </Title>
          <Group gap={8} wrap="wrap">
            {tournament.status === 'live' && <LiveBadge />}
            {weighedProgress && weighedProgress.total > 0 && (
              <Badge variant="outline" color="gray" size="lg" radius={0}>
                Взвешено · {weighedProgress.weighed}/{weighedProgress.total}
              </Badge>
            )}
            {isStaff(role) && (
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
            {canManageRoles(role) && (
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
        </Stack>

        <TournamentView
          tournament={tournament}
          entries={entries}
          catches={catches}
          miniTours={miniTours}
          segments={segments}
        />
      </Stack>
    </div>
  )
}
