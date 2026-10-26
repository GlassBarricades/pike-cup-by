import { Stack, Text } from '@mantine/core'
import { slotTitle } from '../../features/tournament/schedule'
import { gramsLabel } from '../../features/tournament/spectator'
import { Panel } from '../../ui'
import { useV2Tournament } from './context'

export function V2Schedule() {
  const { story } = useV2Tournament()
  if (story.beats.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        В расписании нет окон ловли
      </Text>
    )
  }
  return (
    <Stack gap="xs">
      {story.beats.map((beat) => (
        <Panel
          key={beat.key}
          p="sm"
          style={beat.current ? { borderColor: 'var(--pc-signal)' } : undefined}
        >
          <Text size="xs" c="dimmed" tt="uppercase">
            {beat.current ? 'Сейчас' : beat.passed ? 'Пройдено' : 'Дальше'}
          </Text>
          <Text fw={700}>{beat.title}</Text>
          {beat.kind === 'move' ? (
            <Text size="sm" c="dimmed">
              {beat.note}
            </Text>
          ) : (
            <Stack gap={4} mt={6}>
              {beat.zones.map((zone) => (
                <Text key={zone.zone} size="sm">
                  Зона {zone.zone}: {zone.leaderNames[0] ?? '—'}
                  {zone.leaderGrams == null ? '' : ` · ${gramsLabel(zone.leaderGrams)}`}
                  {` · нули ${zone.zeros}`}
                  {zone.weighed > 0 ? ` · средний ${gramsLabel(Math.round(zone.averageGrams ?? 0))}` : ''}
                  <Text span c="dimmed">
                    {' '}
                    · {slotTitle(beat.slot)}
                  </Text>
                </Text>
              ))}
            </Stack>
          )}
        </Panel>
      ))}
    </Stack>
  )
}
