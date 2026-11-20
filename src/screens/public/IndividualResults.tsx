import { useMemo, useState } from 'react'
import { Badge, Group, SegmentedControl, Stack, Table, Text, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { formatPlace } from '../../features/tournament/scoring'
import { isIndividualSumBoardOpen } from '../../features/tournament/spectator'
import type { AthleteStandingRow, TeamStandingRow } from '../../features/tournament/formats/individual/scoring'
import type { CatchRow, MiniTour } from '../../features/tournament/types'

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
  sumOpen,
}: {
  rows: AthleteStandingRow[]
  tourHeaders: number[]
  sumOpen: boolean
}) {
  const sorted = useMemo(() => {
    if (sumOpen) return rows
    const firstTour = tourHeaders[0]
    if (firstTour == null) return rows
    return [...rows].sort((a, b) => {
      const placeA = a.tours.find((t) => t.tour === firstTour)?.place ?? 999
      const placeB = b.tours.find((t) => t.tour === firstTour)?.place ?? 999
      const weightA = a.tours.find((t) => t.tour === firstTour)?.weight ?? 0
      const weightB = b.tours.find((t) => t.tour === firstTour)?.weight ?? 0
      return placeA - placeB || weightB - weightA
    })
  }, [rows, sumOpen, tourHeaders])

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
            {sumOpen ? <Table.Th>Σ мест</Table.Th> : null}
            <Table.Th>Вес</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sorted.map((row, index) => {
            const firstTour = tourHeaders[0]
            const livePlace = sumOpen
              ? row.finalPlace
              : (row.tours.find((t) => t.tour === firstTour)?.place ?? index + 1)
            const liveWeight = sumOpen
              ? row.totalWeight
              : (row.tours.find((t) => t.tour === firstTour)?.weight ?? 0)
            return (
              <Table.Tr key={row.rosterMemberId}>
                <Table.Td>{formatPlace(livePlace)}</Table.Td>
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
                {sumOpen ? <Table.Td>{formatPlace(row.placeSum)}</Table.Td> : null}
                <Table.Td>{liveWeight}</Table.Td>
              </Table.Tr>
            )
          })}
          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={3 + tourHeaders.length + (sumOpen ? 1 : 0)}>
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
  catches,
  miniTours,
  tournamentStatus,
}: {
  teams: TeamStandingRow[]
  athletes: AthleteStandingRow[]
  juniors?: AthleteStandingRow[]
  catches?: CatchRow[]
  miniTours?: MiniTour[]
  tournamentStatus?: string | null
}) {
  const showJuniors = juniors.length > 0
  const [tab, setTab] = useState<'team' | 'individual' | 'juniors'>('team')
  const [filter, setFilter] = useState('')
  const needle = filter.trim().toLocaleLowerCase('ru')

  // Without catches/miniTours keep previous behaviour (always show sum).
  const showSum =
    catches == null || miniTours == null
      ? true
      : isIndividualSumBoardOpen(catches, miniTours, tournamentStatus)

  const teamRows = useMemo(() => {
    const filtered = teams.filter((row) => {
      if (!needle) return true
      return (
        row.teamName.toLocaleLowerCase('ru').includes(needle) ||
        row.athleteNames.some((n) => n.toLocaleLowerCase('ru').includes(needle))
      )
    })
    if (showSum) return filtered
    const firstTour = filtered[0]?.tours[0]?.tour
    if (firstTour == null) return filtered
    return [...filtered].sort((a, b) => {
      const placeA = a.tours.find((t) => t.tour === firstTour)?.place ?? 999
      const placeB = b.tours.find((t) => t.tour === firstTour)?.place ?? 999
      const weightA = a.tours.find((t) => t.tour === firstTour)?.weight ?? 0
      const weightB = b.tours.find((t) => t.tour === firstTour)?.weight ?? 0
      return placeA - placeB || weightB - weightA
    })
  }, [teams, needle, showSum])

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
      {!showSum ? (
        <Text size="sm" c="dimmed">
          Пока идёт первый тур — в таблице места тура. Сумма мест откроется после взвешивания второго тура.
        </Text>
      ) : null}
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
                {showSum ? <Table.Th>Σ мест</Table.Th> : null}
                <Table.Th>Вес</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {teamRows.map((row, index) => {
                const firstTour = tourHeaders[0]
                const livePlace = showSum
                  ? row.finalPlace
                  : (row.tours.find((t) => t.tour === firstTour)?.place ?? index + 1)
                const liveWeight = showSum
                  ? row.totalWeight
                  : (row.tours.find((t) => t.tour === firstTour)?.weight ?? 0)
                return (
                  <Table.Tr key={row.entryId}>
                    <Table.Td>{formatPlace(livePlace)}</Table.Td>
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
                    {showSum ? <Table.Td>{formatPlace(row.placeSum)}</Table.Td> : null}
                    <Table.Td>{liveWeight}</Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : activeTab === 'juniors' ? (
        <AthleteTable rows={juniorRows} tourHeaders={tourHeaders} sumOpen={showSum} />
      ) : (
        <AthleteTable rows={athleteRows} tourHeaders={tourHeaders} sumOpen={showSum} />
      )}
    </Stack>
  )
}
