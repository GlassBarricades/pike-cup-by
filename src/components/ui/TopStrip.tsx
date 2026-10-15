import { Group, Text, UnstyledButton } from '@mantine/core'
import { Link } from 'react-router-dom'
import { RankMark } from './RankMark'
import { ScoreSurface } from './ScoreSurface'

export type TopStripRow = {
  entryId: string
  teamId: string | null
  teamName: string
  finalPlace: number
  placeSum: number
  totalWeight: number
}

export function TopStrip({ rows }: { rows: TopStripRow[] }) {
  if (rows.length === 0) return null

  return (
    <ScoreSurface p="sm">
      <Text size="xs" tt="uppercase" fw={800} c="dimmed" mb="xs" style={{ letterSpacing: '0.06em' }}>
        Топ {rows.length}
      </Text>
      <Group gap="xs" grow preventGrowOverflow={false} wrap="wrap">
        {rows.map((row) => {
          const body = (
            <Group gap="sm" wrap="nowrap">
              <RankMark place={row.finalPlace} />
              <div style={{ minWidth: 0 }}>
                <Text size="sm" fw={800} truncate>
                  {row.teamName}
                </Text>
                <Text size="xs" c="dimmed" className="pc-tabular">
                  Σ {row.placeSum} · {row.totalWeight} г
                </Text>
              </div>
            </Group>
          )

          const style = {
            minWidth: 140,
            flex: '1 1 140px',
            padding: '6px 8px',
            border: '1px solid var(--pc-hairline)',
            borderRadius: 'var(--mantine-radius-sm)',
            background: 'var(--pc-surface-raised)',
            color: 'inherit',
          } as const

          if (!row.teamId) {
            return (
              <div key={row.entryId} style={style}>
                {body}
              </div>
            )
          }

          return (
            <UnstyledButton
              key={row.entryId}
              component={Link}
              to={`/teams/${row.teamId}`}
              style={style}
            >
              {body}
            </UnstyledButton>
          )
        })}
      </Group>
    </ScoreSurface>
  )
}
