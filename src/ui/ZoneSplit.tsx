import { Group, Progress, Stack, Text } from '@mantine/core'
import { Panel } from './Panel'

export function ZoneSplit({
  zoneA,
  zoneB,
}: {
  zoneA: { weighed: number; total: number }
  zoneB: { weighed: number; total: number }
}) {
  const pct = (w: number, t: number) => (t > 0 ? Math.round((w / t) * 100) : 0)

  return (
    <Group align="stretch" grow preventGrowOverflow={false} wrap="wrap">
      <ZoneCard
        title="Зона A"
        color="var(--pc-zone-a)"
        weighed={zoneA.weighed}
        total={zoneA.total}
        percent={pct(zoneA.weighed, zoneA.total)}
      />
      <ZoneCard
        title="Зона B"
        color="var(--pc-zone-b)"
        weighed={zoneB.weighed}
        total={zoneB.total}
        percent={pct(zoneB.weighed, zoneB.total)}
      />
    </Group>
  )
}

function ZoneCard({
  title,
  color,
  weighed,
  total,
  percent,
}: {
  title: string
  color: string
  weighed: number
  total: number
  percent: number
}) {
  return (
    <Panel p="sm" style={{ flex: 1, minWidth: 140 }}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text className="pc-display" style={{ color, fontSize: '1.1rem' }}>
            {title}
          </Text>
          <Text className="pc-tabular" size="sm" c="dimmed">
            {weighed}/{total}
          </Text>
        </Group>
        <Progress value={percent} color={title.includes('A') ? 'zoneA' : 'zoneB'} size="sm" radius={2} />
      </Stack>
    </Panel>
  )
}
