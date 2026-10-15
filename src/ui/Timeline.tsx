import { Stack, Text } from '@mantine/core'
import { formatTime } from '../features/tournament/schedule'
import type { ScheduleSegment } from '../features/tournament/types'
import { Panel } from './Panel'

export function Timeline({
  segments,
  activeKey,
  delayMinutes = 0,
  limit,
}: {
  segments: ScheduleSegment[]
  activeKey?: string | null
  delayMinutes?: number
  limit?: number
}) {
  const ordered = [...segments].sort((a, b) => a.sort_order - b.sort_order)
  const list = limit ? ordered.slice(0, limit) : ordered

  if (list.length === 0) {
    return (
      <Panel>
        <Text size="sm" c="dimmed">
          Расписание ещё не задано
        </Text>
      </Panel>
    )
  }

  return (
    <Stack gap={0}>
      {list.map((seg) => {
        const active = seg.key === activeKey
        return (
          <div
            key={seg.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '72px 12px 1fr',
              gap: 12,
              padding: '10px 0',
              borderBottom: '1px solid var(--pc-line)',
            }}
          >
            <Text className="pc-tabular" size="sm" c={active ? undefined : 'dimmed'} fw={active ? 700 : 400}>
              {formatTime(seg.planned_starts_at, delayMinutes)}
            </Text>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: active ? 'var(--pc-signal)' : 'var(--pc-line)',
                  boxShadow: active ? '0 0 0 3px color-mix(in srgb, var(--pc-signal) 25%, transparent)' : undefined,
                }}
              />
            </div>
            <Text
              className={active ? 'pc-display' : undefined}
              fw={active ? 700 : 500}
              style={{ color: active ? 'var(--pc-signal)' : undefined }}
            >
              {seg.title}
            </Text>
          </div>
        )
      })}
    </Stack>
  )
}
