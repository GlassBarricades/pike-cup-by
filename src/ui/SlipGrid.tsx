import { Group, Stack, Text } from '@mantine/core'
import { slipSector } from '../features/tournament/slips'
import type { DrawSlip } from '../features/tournament/types'

const MINIS = [1, 2, 3, 4, 5] as const

export function SlipGrid({ slip }: { slip: DrawSlip }) {
  return (
    <Stack gap={4}>
      <Group gap={4} wrap="nowrap">
        <Text size="xs" c="dimmed" w={28} />
        {MINIS.map((mini) => (
          <Text key={mini} size="xs" c="dimmed" ta="center" style={{ flex: 1 }}>
            МТ{mini}
          </Text>
        ))}
      </Group>
      {([1, 2] as const).map((tour) => (
        <Group key={tour} gap={4} wrap="nowrap">
          <Text size="xs" fw={700} w={28}>
            {tour === 1 ? 'I' : 'II'}
          </Text>
          {MINIS.map((mini) => (
            <Text
              key={mini}
              size="sm"
              fw={700}
              ta="center"
              className="pc-tabular"
              style={{ flex: 1 }}
            >
              {slipSector(slip, tour, mini) ?? '—'}
            </Text>
          ))}
        </Group>
      ))}
    </Stack>
  )
}
