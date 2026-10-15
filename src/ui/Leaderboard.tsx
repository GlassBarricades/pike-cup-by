import { Anchor, Table, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { formatPlace, type StandingRow } from '../features/tournament/scoring'
import { Panel } from './Panel'

export function Leaderboard({
  rows,
  flashIds,
  compact,
}: {
  rows: StandingRow[]
  flashIds?: Set<string>
  compact?: boolean
}) {
  if (rows.length === 0) {
    return (
      <Panel>
        <Text size="sm" c="dimmed">
          Пока нет данных для таблицы
        </Text>
      </Panel>
    )
  }

  return (
    <Panel p={0}>
      <Table.ScrollContainer minWidth={compact ? 520 : 640}>
        <Table horizontalSpacing="sm" verticalSpacing={compact ? 6 : 8}>
          <Table.Thead>
            <Table.Tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
              <Table.Th className="pc-display" style={{ width: 48, fontSize: 12, color: 'var(--pc-muted)' }}>
                #
              </Table.Th>
              <Table.Th className="pc-display" style={{ fontSize: 12, color: 'var(--pc-muted)' }}>
                Команда
              </Table.Th>
              {!compact && (
                <>
                  <Table.Th ta="right" className="pc-display" style={{ fontSize: 12, color: 'var(--pc-muted)' }}>
                    A
                  </Table.Th>
                  <Table.Th ta="right" className="pc-display" style={{ fontSize: 12, color: 'var(--pc-muted)' }}>
                    B
                  </Table.Th>
                </>
              )}
              <Table.Th ta="right" className="pc-display" style={{ fontSize: 12, color: 'var(--pc-muted)' }}>
                Σ мест
              </Table.Th>
              <Table.Th ta="right" className="pc-display" style={{ fontSize: 12, color: 'var(--pc-muted)' }}>
                Вес
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row) => {
              const top = row.finalPlace <= 3
              const flash = flashIds?.has(row.entryId)
              return (
                <Table.Tr
                  key={row.entryId}
                  className={flash ? 'pc-catch-flash' : undefined}
                  style={{
                    borderBottom: '1px solid var(--pc-line)',
                    background: top
                      ? 'color-mix(in srgb, var(--pc-signal) 6%, transparent)'
                      : undefined,
                  }}
                >
                  <Table.Td>
                    <Text
                      className="pc-display pc-tabular"
                      style={{
                        fontSize: top ? '1.35rem' : '1.1rem',
                        color: top ? 'var(--pc-signal)' : undefined,
                      }}
                    >
                      {formatPlace(row.finalPlace)}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {row.teamId ? (
                      <Anchor
                        component={Link}
                        to={`/teams/${row.teamId}`}
                        c="inherit"
                        underline="never"
                        fw={600}
                      >
                        {row.teamName}
                      </Anchor>
                    ) : (
                      <Text fw={600}>{row.teamName}</Text>
                    )}
                    {!compact && row.rosterNames.length > 0 && (
                      <Text size="xs" c="dimmed">
                        {row.rosterNames.join(' · ')}
                      </Text>
                    )}
                  </Table.Td>
                  {!compact && (
                    <>
                      <Table.Td ta="right" className="pc-tabular">
                        {row.zoneAWeight}
                      </Table.Td>
                      <Table.Td ta="right" className="pc-tabular">
                        {row.zoneBWeight}
                      </Table.Td>
                    </>
                  )}
                  <Table.Td ta="right" className="pc-tabular pc-display" style={{ fontSize: '1.05rem' }}>
                    {formatPlace(row.placeSum)}
                  </Table.Td>
                  <Table.Td ta="right" className="pc-tabular" fw={600}>
                    {row.totalWeight}
                  </Table.Td>
                </Table.Tr>
              )
            })}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Panel>
  )
}
