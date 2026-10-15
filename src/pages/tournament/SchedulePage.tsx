import { Badge, Group, Stack, Text } from '@mantine/core'
import { useParams } from 'react-router-dom'
import { TournamentShell } from '../../components/TournamentShell'
import { ScoreSurface, SectionHead } from '../../components/ui'
import { useSegments, useTournament } from '../../features/tournament/hooks'
import { formatTime, getCurrentPhase } from '../../features/tournament/schedule'
import { useNow } from '../../features/tournament/useNow'

export function SchedulePage() {
  const { tournamentId } = useParams()
  const { data: tournament } = useTournament(tournamentId)
  const { data: segments = [] } = useSegments(tournament?.id)
  const now = useNow()
  const phase = tournament ? getCurrentPhase(tournament, segments, now) : null
  const delay = tournament?.schedule_delay_minutes ?? 0
  const showLive = tournament?.status === 'live' || tournament?.status === 'published'

  if (!tournament) {
    return <Text c="dimmed">Загрузка…</Text>
  }

  return (
    <TournamentShell tournament={tournament}>
      <SectionHead
        title="Расписание"
        description={
          delay > 0 && showLive
            ? `Учтён сдвиг +${delay} мин`
            : 'Этапы дня с учётом сдвига и паузы'
        }
        order={3}
      />
      {tournament.schedule_paused_at && showLive && (
        <Badge color="lure" variant="filled" w="fit-content">
          Пауза расписания
        </Badge>
      )}

      <Stack gap="xs">
        {segments.map((seg) => {
          const active = showLive && phase?.segment?.id === seg.id && phase.kind === 'active'
          return (
            <ScoreSurface key={seg.id} accent={active ? 'depth' : undefined} p="sm">
              <Group justify="space-between">
                <div>
                  <Text fw={active ? 800 : 600}>{seg.title}</Text>
                  {active && (
                    <Text size="xs" c="depth" fw={700}>
                      Сейчас
                    </Text>
                  )}
                </div>
                <Text size="sm" c="dimmed" className="pc-tabular">
                  {formatTime(seg.planned_starts_at, showLive ? delay : 0)} –{' '}
                  {formatTime(seg.planned_ends_at, showLive ? delay : 0)}
                </Text>
              </Group>
            </ScoreSurface>
          )
        })}
        {segments.length === 0 && (
          <Text c="dimmed" size="sm">
            Расписание ещё не задано
          </Text>
        )}
      </Stack>
    </TournamentShell>
  )
}
