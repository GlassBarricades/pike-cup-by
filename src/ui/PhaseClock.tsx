import { Group, Stack, Text } from '@mantine/core'
import type { CurrentPhase } from '../features/tournament/schedule'
import { LiveBadge } from './LiveBadge'
import { Panel } from './Panel'

export function PhaseClock({
  phase,
  delayMinutes = 0,
  paused = false,
  archiveLabel,
}: {
  phase: CurrentPhase | null
  delayMinutes?: number
  paused?: boolean
  archiveLabel?: string
}) {
  if (archiveLabel) {
    return (
      <Panel p="sm">
        <Text size="sm" c="dimmed">
          {archiveLabel}
        </Text>
      </Panel>
    )
  }

  if (!phase) return null

  const label =
    phase.kind === 'before' || phase.kind === 'gap'
      ? (phase.nextSegment?.title ?? 'До старта')
      : phase.kind === 'active'
        ? (phase.segment?.title ?? 'Этап')
        : 'Финиш дня'

  const msLeft =
    phase.endsAtEffective != null
      ? Math.max(0, phase.endsAtEffective.getTime() - phase.effectiveNow.getTime())
      : null
  const minutesLeft = msLeft != null ? Math.ceil(msLeft / 60_000) : null

  return (
    <Panel p="sm">
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Stack gap={2}>
          <Group gap="xs">
            {phase.kind === 'active' && <LiveBadge />}
            <Text className="pc-display" style={{ fontSize: '1.15rem' }}>
              {label}
            </Text>
          </Group>
          {(paused || delayMinutes > 0) && (
            <Text size="xs" c="dimmed">
              {paused ? 'Пауза' : null}
              {paused && delayMinutes > 0 ? ' · ' : null}
              {delayMinutes > 0 ? `Сдвиг +${delayMinutes} мин` : null}
            </Text>
          )}
        </Stack>
        {minutesLeft != null && (phase.kind === 'active' || phase.kind === 'gap') && (
          <Stack gap={0} align="flex-end">
            <Text className="pc-display pc-tabular" style={{ fontSize: '1.75rem', color: 'var(--pc-signal)' }}>
              {minutesLeft}
              <Text span size="sm" c="dimmed" ml={4} style={{ fontFamily: 'var(--pc-font-body)' }}>
                мин
              </Text>
            </Text>
            {phase.kind === 'gap' && (
              <Text size="xs" c="dimmed">
                до следующего этапа
              </Text>
            )}
          </Stack>
        )}
      </Group>
    </Panel>
  )
}
