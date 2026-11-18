import { useMemo, useState } from 'react'
import { Badge, Group, SegmentedControl, Stack, Table, Text, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { formatPlace } from '../../features/tournament/scoring'
import type { AthleteStandingRow, TeamStandingRow } from '../../features/tournament/formats/individual/scoring'

function AthleteName({ row }: { row: AthleteStandingRow }) {
  return (
    <Group gap={6} wrap="nowrap">
      <Text fw={600}>{row.athleteName}</Text>
      {row.junior && (
        <Badge size="xs" color="teal" variant="light">
          Юниор
        </Badge>
      )}
    </Group>
  )
}

function AthleteTable({
  rows,
  tourHeaders,
}: {
  rows: AthleteStandingRow[]
  tourHeaders: number[]
}) {
  return (
    <Table.ScrollContainer minWidth={640}>
      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Спортсмен</Table.Th>
            <Table.Th>Команда</Table.Th>
            {tourHeaders.map((tour) => (
              <Table.Th key={tour}>Т{tour}</Table.Th>
            ))}
            <Table.Th>Σ мест</Table.Th>
            <Table.Th>Вес</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((row) => (
            <Table.Tr key={row.rosterMemberId}>
              <Table.Td>{row.finalPlace}</Table.Td>
              <Table.Td>
                <AthleteName row={row} />
              </Table.Td>
              <Table.Td>
                <Text c={row.solo ? 'dimmed' : undefined} fs={row.solo ? 'italic' : undefined}>
                  {row.teamName}
                </Text>
              </Table.Td>
              {row.tours.map((tour) => (
                <Table.Td key={tour.tour}>
                  {formatPlace(tour.place)}
                  <Text span size="xs" c="dimmed">
                    {' '}
                    ({tour.zone ?? '—'}) / {tour.weight}г
                  </Text>
                </Table.Td>
              ))}
              <Table.Td>{formatPlace(row.placeSum)}</Table.Td>
              <Table.Td>{row.totalWeight}</Table.Td>
            </Table.Tr>
          ))}
          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={4 + tourHeaders.length}>
                <Text c="dimmed" size="sm">
                  Нет участников
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}

export function IndividualResults({
  teams,
  athletes,
  juniors = [],
}: {
  teams: TeamStandingRow[]
  athletes: AthleteStandingRow[]
  juniors?: AthleteStandingRow[]
}) {
  const showJuniors = juniors.length > 0
  const [tab, setTab] = useState<'team' | 'individual' | 'juniors'>('team')
  const [filter, setFilter] = useState('')
  const needle = filter.trim().toLocaleLowerCase('ru')

  const teamRows = useMemo(
    () =>
      teams.filter((row) => {
        if (!needle) return true
        return (
          row.teamName.toLocaleLowerCase('ru').includes(needle) ||
          row.athleteNames.some((n) => n.toLocaleLowerCase('ru').includes(needle))
        )
      }),
    [teams, needle],
  )

  const filterAthletes = (rows: AthleteStandingRow[]) =>
    rows.filter((row) => {
      if (!needle) return true
      return (
        row.athleteName.toLocaleLowerCase('ru').includes(needle) ||
        row.teamName.toLocaleLowerCase('ru').includes(needle)
      )
    })

  const athleteRows = useMemo(() => filterAthletes(athletes), [athletes, needle])
  const juniorRows = useMemo(() => filterAthletes(juniors), [juniors, needle])

  const tourHeaders = (
    teams[0]?.tours ??
    athletes[0]?.tours ??
    juniors[0]?.tours ??
    []
  ).map((t) => t.tour)

  const activeTab = tab === 'juniors' && !showJuniors ? 'individual' : tab

  return (
    <Stack gap="md">
      <SegmentedControl
        fullWidth
        value={activeTab}
        onChange={(v) => setTab(v as 'team' | 'individual' | 'juniors')}
        data={[
          { value: 'team', label: 'Командный' },
          { value: 'individual', label: showJuniors ? 'Личный' : 'Личный' },
          ...(showJuniors ? [{ value: 'juniors', label: `Юниоры (${juniors.length})` }] : []),
        ]}
      />
      <TextInput
        placeholder="Поиск"
        leftSection={<IconSearch size={16} />}
        value={filter}
        onChange={(e) => setFilter(e.currentTarget.value)}
      />

      {activeTab === 'team' ? (
        <Table.ScrollContainer minWidth={640}>
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                <Table.Th>Команда</Table.Th>
                {tourHeaders.map((tour) => (
                  <Table.Th key={tour}>Т{tour}</Table.Th>
                ))}
                <Table.Th>Σ мест</Table.Th>
                <Table.Th>Вес</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {teamRows.map((row) => (
                <Table.Tr key={row.entryId}>
                  <Table.Td>{row.finalPlace}</Table.Td>
                  <Table.Td>
                    <Text fw={600}>{row.teamName}</Text>
                    <Text size="xs" c="dimmed">
                      {row.athleteNames.join(', ')}
                    </Text>
                  </Table.Td>
                  {row.tours.map((tour) => (
                    <Table.Td key={tour.tour}>
                      {formatPlace(tour.place)}
                      <Text span size="xs" c="dimmed">
                        {' '}
                        / {tour.weight}г
                      </Text>
                    </Table.Td>
                  ))}
                  <Table.Td>{formatPlace(row.placeSum)}</Table.Td>
                  <Table.Td>{row.totalWeight}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : activeTab === 'juniors' ? (
        <AthleteTable rows={juniorRows} tourHeaders={tourHeaders} />
      ) : (
        <AthleteTable rows={athleteRows} tourHeaders={tourHeaders} />
      )}
    </Stack>
  )
}
