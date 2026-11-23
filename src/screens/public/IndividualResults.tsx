import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Group, SegmentedControl, Stack, Table, Text, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useCheer } from '../../features/tournament/cheer'
import {
  daysCount,
  hasIndividualStandings,
  hasTeamStandings,
  toursByDay,
  type TournamentFormat,
} from '../../features/tournament/formats'
import type { AthleteStandingRow, TeamStandingRow } from '../../features/tournament/formats/individual/scoring'
import { formatPlace } from '../../features/tournament/scoring'
import { isIndividualSumBoardOpen } from '../../features/tournament/spectator'
import type { CatchRow, MiniTour, ZoneCode } from '../../features/tournament/types'

type ZoneFilter = 'all' | ZoneCode

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

/** Зона спортсмена для фильтра по правилам среза. */
function athleteMatchesZone(
  row: AthleteStandingRow,
  zone: ZoneCode,
  showSum: boolean,
  liveTour: number | null,
): boolean {
  if (!showSum) {
    const t1 = row.tours.find((t) => t.tour === 1) ?? row.tours[0]
    return t1?.zone === zone
  }
  if (liveTour != null) {
    return row.tours.find((t) => t.tour === liveTour)?.zone === zone
  }
  return row.tours.some((t) => t.zone === zone)
}

function AthleteTable({
  rows,
  tourHeaders,
  sumOpen,
  rowRefs,
  flashIds,
  emptyLabel,
}: {
  rows: AthleteStandingRow[]
  tourHeaders: number[]
  sumOpen: boolean
  rowRefs: { current: Map<string, HTMLTableRowElement> }
  flashIds: Set<string>
  emptyLabel: string
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
            const flash = flashIds.has(row.entryId) || flashIds.has(row.rosterMemberId)
            return (
              <Table.Tr
                key={row.rosterMemberId}
                ref={(el) => {
                  if (el) {
                    rowRefs.current.set(row.rosterMemberId, el)
                    rowRefs.current.set(`entry:${row.entryId}`, el)
                  }
                }}
                className={flash ? 'pc-catch-flash' : undefined}
              >
                <Table.Td>{formatPlace(livePlace)}</Table.Td>
                <Table.Td>
                  <AthleteName row={row} />
                </Table.Td>
                <Table.Td>
                  <Text c={row.solo ? 'dimmed' : undefined} fs={row.solo ? 'italic' : undefined}>
                    {row.teamName}
                  </Text>
                </Table.Td>
                {tourHeaders.map((tourNum) => {
                  const tour = row.tours.find((t) => t.tour === tourNum)
                  return (
                    <Table.Td key={tourNum}>
                      {tour ? (
                        <>
                          {formatPlace(tour.place)}
                          <Text span size="xs" c="dimmed">
                            {' '}
                            ({tour.zone ?? '—'}) / {tour.weight}г
                          </Text>
                        </>
                      ) : (
                        '—'
                      )}
                    </Table.Td>
                  )
                })}
                {sumOpen ? <Table.Td>{formatPlace(row.placeSum)}</Table.Td> : null}
                <Table.Td>{liveWeight}</Table.Td>
              </Table.Tr>
            )
          })}
          {rows.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={3 + tourHeaders.length + (sumOpen ? 1 : 0)}>
                <Text c="dimmed" size="sm">
                  {emptyLabel}
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
  tournamentId,
  liveTour = null,
  format,
}: {
  teams: TeamStandingRow[]
  athletes: AthleteStandingRow[]
  juniors?: AthleteStandingRow[]
  catches?: CatchRow[]
  miniTours?: MiniTour[]
  tournamentStatus?: string | null
  tournamentId?: string
  liveTour?: number | null
  format?: TournamentFormat | null
}) {
  const showTeamTab = format ? hasTeamStandings(format) : true
  const showPersonalTab = format ? hasIndividualStandings(format) : true
  const showJuniors = juniors.length > 0
  const multiDay = format ? daysCount(format) > 1 : false
  const dayGroups = format && multiDay ? toursByDay(format) : []
  const [tab, setTab] = useState<'team' | 'individual' | 'juniors'>(showTeamTab ? 'team' : 'individual')
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all')
  const [filter, setFilter] = useState('')
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())
  const needle = filter.trim().toLocaleLowerCase('ru')
  const cheer = useCheer(tournamentId)
  const cheerId = cheer.primaryId

  const showSum =
    catches == null || miniTours == null
      ? true
      : isIndividualSumBoardOpen(catches, miniTours, tournamentStatus)

  const athletesById = useMemo(() => {
    const map = new Map<string, AthleteStandingRow>()
    for (const row of athletes) map.set(row.rosterMemberId, row)
    for (const row of juniors) map.set(row.rosterMemberId, row)
    return map
  }, [athletes, juniors])

  const teamRows = useMemo(() => {
    const filtered = teams.filter((row) => {
      if (needle) {
        const hit =
          row.teamName.toLocaleLowerCase('ru').includes(needle) ||
          row.athleteNames.some((n) => n.toLocaleLowerCase('ru').includes(needle))
        if (!hit) return false
      }
      if (zoneFilter === 'all') return true
      return row.athleteIds.some((id) => {
        const athlete = athletesById.get(id)
        return athlete ? athleteMatchesZone(athlete, zoneFilter, showSum, liveTour) : false
      })
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
  }, [teams, needle, showSum, zoneFilter, athletesById, liveTour])

  const filterAthletes = (rows: AthleteStandingRow[]) =>
    rows.filter((row) => {
      if (needle) {
        const hit =
          row.athleteName.toLocaleLowerCase('ru').includes(needle) ||
          row.teamName.toLocaleLowerCase('ru').includes(needle)
        if (!hit) return false
      }
      if (zoneFilter === 'all') return true
      return athleteMatchesZone(row, zoneFilter, showSum, liveTour)
    })

  const athleteRows = useMemo(
    () => filterAthletes(athletes),
    [athletes, needle, zoneFilter, showSum, liveTour],
  )
  const juniorRows = useMemo(
    () => filterAthletes(juniors),
    [juniors, needle, zoneFilter, showSum, liveTour],
  )

  const allTourHeaders = (
    teams[0]?.tours ??
    athletes[0]?.tours ??
    juniors[0]?.tours ??
    []
  ).map((t) => t.tour)

  const tourHeaders = useMemo(() => {
    if (!multiDay || dayFilter === 'all' || !format) return allTourHeaders
    const dayTourNums = new Set(toursByDay(format).find((g) => g.day === dayFilter)?.tours.map((t) => t.number) ?? [])
    return allTourHeaders.filter((n) => dayTourNums.has(n))
  }, [allTourHeaders, multiDay, dayFilter, format])

  const activeTab =
    tab === 'juniors' && !showJuniors
      ? showPersonalTab
        ? 'individual'
        : 'team'
      : tab === 'team' && !showTeamTab
        ? 'individual'
        : tab
  const emptyLabel = zoneFilter === 'all' ? 'Нет участников' : 'В этой зоне никого'

  const cheerInView = useMemo(() => {
    if (!cheerId) return false
    if (activeTab === 'team') return teamRows.some((row) => row.entryId === cheerId)
    const pool = activeTab === 'juniors' ? juniorRows : athleteRows
    return pool.some((row) => row.entryId === cheerId)
  }, [cheerId, activeTab, teamRows, athleteRows, juniorRows])

  useEffect(() => {
    if (flashIds.size === 0) return
    const timer = window.setTimeout(() => setFlashIds(new Set()), 1600)
    return () => window.clearTimeout(timer)
  }, [flashIds])

  function scrollToCheer() {
    if (!cheerId) return
    if (!cheerInView && zoneFilter !== 'all') setZoneFilter('all')
    const run = () => {
      let el: HTMLTableRowElement | undefined
      if (activeTab === 'team') {
        el = rowRefs.current.get(cheerId)
      } else {
        const pool = [...athletes, ...juniors].filter((row) => row.entryId === cheerId)
        const first = pool[0]
        el = first
          ? rowRefs.current.get(first.rosterMemberId)
          : rowRefs.current.get(`entry:${cheerId}`)
      }
      if (!el) return
      const flashKey =
        activeTab === 'team'
          ? cheerId
          : ([...athletes, ...juniors].find((r) => r.entryId === cheerId)?.rosterMemberId ?? cheerId)
      setFlashIds(new Set([flashKey, cheerId]))
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
    requestAnimationFrame(() => requestAnimationFrame(run))
  }

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
          ...(showTeamTab ? [{ value: 'team', label: 'Командный' }] : []),
          ...(showPersonalTab ? [{ value: 'individual', label: 'Личный' }] : []),
          ...(showJuniors ? [{ value: 'juniors', label: `Юниоры (${juniors.length})` }] : []),
        ]}
      />
      {multiDay ? (
        <Group gap={6} wrap="wrap">
          <Button
            size="xs"
            variant={dayFilter === 'all' ? 'filled' : 'default'}
            onClick={() => setDayFilter('all')}
          >
            Все дни
          </Button>
          {dayGroups.map((group) => (
            <Button
              key={group.day}
              size="xs"
              variant={dayFilter === group.day ? 'filled' : 'default'}
              onClick={() => setDayFilter(group.day)}
            >
              День {group.day}
            </Button>
          ))}
        </Group>
      ) : null}
      <Group gap={6} wrap="wrap">
        {(
          [
            ['all', 'Все'],
            ['A', 'A'],
            ['B', 'B'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="xs"
            variant={zoneFilter === value ? 'filled' : 'default'}
            color={value === 'A' ? 'zoneA' : value === 'B' ? 'zoneB' : undefined}
            onClick={() => setZoneFilter(value)}
          >
            {label === 'Все' ? 'Все' : `Зона ${label}`}
          </Button>
        ))}
      </Group>
      <Group gap="xs" align="flex-end" wrap="wrap">
        <TextInput
          placeholder="Поиск"
          leftSection={<IconSearch size={16} />}
          value={filter}
          onChange={(e) => setFilter(e.currentTarget.value)}
          style={{ flex: '1 1 180px' }}
        />
        {cheerId ? (
          <Button size="xs" variant="light" color="signal" onClick={scrollToCheer}>
            {cheerInView ? 'К моей команде' : 'Показать мою команду'}
          </Button>
        ) : null}
      </Group>

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
                  <Table.Tr
                    key={row.entryId}
                    ref={(el) => {
                      if (el) rowRefs.current.set(row.entryId, el)
                    }}
                    className={flashIds.has(row.entryId) ? 'pc-catch-flash' : undefined}
                  >
                    <Table.Td>{formatPlace(livePlace)}</Table.Td>
                    <Table.Td>
                      <Text fw={600}>{row.teamName}</Text>
                      <Text size="xs" c="dimmed">
                        {row.athleteNames.join(', ')}
                      </Text>
                    </Table.Td>
                    {tourHeaders.map((tourNum) => {
                      const tour = row.tours.find((t) => t.tour === tourNum)
                      return (
                        <Table.Td key={tourNum}>
                          {tour ? (
                            <>
                              {formatPlace(tour.place)}
                              <Text span size="xs" c="dimmed">
                                {' '}
                                / {tour.weight}г
                              </Text>
                            </>
                          ) : (
                            '—'
                          )}
                        </Table.Td>
                      )
                    })}
                    {showSum ? <Table.Td>{formatPlace(row.placeSum)}</Table.Td> : null}
                    <Table.Td>{liveWeight}</Table.Td>
                  </Table.Tr>
                )
              })}
              {teamRows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={3 + tourHeaders.length + (showSum ? 1 : 0)}>
                    <Text c="dimmed" size="sm">
                      {emptyLabel}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : activeTab === 'juniors' ? (
        <AthleteTable
          rows={juniorRows}
          tourHeaders={tourHeaders}
          sumOpen={showSum}
          rowRefs={rowRefs}
          flashIds={flashIds}
          emptyLabel={emptyLabel}
        />
      ) : (
        <AthleteTable
          rows={athleteRows}
          tourHeaders={tourHeaders}
          sumOpen={showSum}
          rowRefs={rowRefs}
          flashIds={flashIds}
          emptyLabel={emptyLabel}
        />
      )}
    </Stack>
  )
}
