import { Badge, Group, Text } from '@mantine/core'
import { ScoreSurface } from './ScoreSurface'

export type LiveStripPhase = {
  kind: 'before' | 'active' | 'after'
  label: string
  minutesLeft?: number | null
  paused?: boolean
  delayMinutes?: number
}

export function LiveStrip({
  phase,
  archiveLabel,
}: {
  phase: LiveStripPhase | null
  archiveLabel?: string
}) {
  if (!phase && !archiveLabel) return null

  return (
    <ScoreSurface p="sm" className="pc-live-enter" style={{ borderColor: 'var(--pc-live)' }}>
      <Group gap="sm" wrap="wrap">
        {archiveLabel ? (
          <Badge size="lg" color="gray" variant="filled">
            {archiveLabel}
          </Badge>
        ) : (
          phase && (
            <>
              <Badge
                size="lg"
                color={phase.kind === 'active' ? 'lure' : 'depth'}
                variant="filled"
              >
                {phase.kind === 'active' ? 'LIVE' : phase.label}
              </Badge>
              {phase.kind === 'active' && (
                <Text size="sm" fw={700}>
                  {phase.label}
                </Text>
              )}
              {phase.paused && <Badge color="yellow">Пауза</Badge>}
              {(phase.delayMinutes ?? 0) > 0 && (
                <Badge color="orange">+{phase.delayMinutes} мин</Badge>
              )}
              {phase.kind === 'active' && phase.minutesLeft != null && (
                <Text size="sm" fw={700} className="pc-tabular" c="depth">
                  ~{phase.minutesLeft} мин
                </Text>
              )}
            </>
          )
        )}
      </Group>
    </ScoreSurface>
  )
}
