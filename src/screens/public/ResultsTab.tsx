import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { Anchor, Box, Button, Group, Stack, Table, Text, TextInput } from '@mantine/core'
import { Link } from 'react-router-dom'
import { getCurrentPhase, tourNumberFromPhase } from '../../features/tournament/schedule'
import { computeStandings, formatPlace, type StandingRow } from '../../features/tournament/scoring'
import { useNow } from '../../features/tournament/useNow'
import {
  type CatchRow,
  type MiniTour,
  type ScheduleSegment,
  type Tournament,
  type TournamentEntry,
  type ZoneCode,
} from '../../features/tournament/types'
import { readCheer } from '../../features/tournament/cheer'
import { EmptyState, Panel } from '../../ui'

type BoardView = 'A' | 'B' | 'sum'
type GroupMode = 'now' | 'past'

function grams(value: number): string {
  return `${value.toLocaleString('ru-RU')} г`
}

function startGroupOnZone(zone: 'A' | 'B', tour: 1 | 2): ZoneCode {
  if (tour === 1) return zone
  return zone === 'A' ? 'B' : 'A'
}

function tourForZone(startZone: ZoneCode, zone: 'A' | 'B'): 1 | 2 {
  return startZone === zone ? 1 : 2
}

type ShownRow = {
  row: StandingRow
  zonePlace: number | null
  zoneWeight: number
  placeA: number | null
  placeB: number | null
  sum: number | null
}

export function ResultsTab({
  tournament,
  entries,
  catches,
  miniTours,
  segments,
}: {
  tournament: Tournament
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  segments: ScheduleSegment[]
}) {
  const now = useNow(5_000)
  const frameRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef(new Map<string, HTMLTableRowElement>())
  const knownCatches = useRef<Set<string>>(new Set())
  const [view, setView] = useState<BoardView>('sum')
  const [groupMode, setGroupMode] = useState<GroupMode>('now')
  const [search, setSearch] = useState('')
  const [fullscreen, setFullscreen] = useState<'off' | 'native' | 'page'>('off')
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const cheerId = useMemo(() => readCheer(tournament.id), [tournament.id])

  const phase = tournament.status === 'finished' ? null : getCurrentPhase(tournament, segments, now)
  const liveTour = tourNumberFromPhase(phase)

  const standings = useMemo(
    () =>
      computeStandings(entries, catches, miniTours, {
        zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one,
      }),
    [entries, catches, miniTours, tournament.zero_place_is_group_size_plus_one],
  )

  const opened = useMemo(() => {
    const flags: Record<ZoneCode, Record<1 | 2, boolean>> = {
      A: { 1: false, 2: false },
      B: { 1: false, 2: false },
    }
    const byEntry = new Map(entries.map((entry) => [entry.id, entry.start_zone]))
    for (const mini of miniTours) {
      if (!catches.some((catchRow) => catchRow.mini_tour_id === mini.id)) continue
      for (const catchRow of catches) {
        if (catchRow.mini_tour_id !== mini.id) continue
        const start = byEntry.get(catchRow.entry_id)
        if (start === 'A' || start === 'B') flags[start][mini.tour_number] = true
      }
    }
    return flags
  }, [entries, catches, miniTours])

  const zoneGroups = useMemo(() => {
    if (view === 'sum') return null
    const fished = (['A', 'B'] as const).filter((start) => opened[start][tourForZone(start, view)])
    const currentTour = liveTour ?? (fished.length === 2 ? 2 : 1)
    const nowGroup = startGroupOnZone(view, currentTour)
    const pastGroup: ZoneCode = nowGroup === 'A' ? 'B' : 'A'
    return {
      nowGroup,
      pastGroup,
      both: fished.length === 2,
      shown: !fished.includes(nowGroup) && fished.includes(pastGroup) ? pastGroup : groupMode === 'past' && fished.length === 2 ? pastGroup : nowGroup,
      empty: fished.length === 0,
    }
  }, [view, opened, liveTour, groupMode])

  const rows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('ru')
    const shown = standings.filter((row) => {
      if (query && !row.teamName.toLocaleLowerCase('ru').includes(query) && !row.rosterNames.some((name) => name.toLocaleLowerCase('ru').includes(query))) {
        return false
      }
      if (view !== 'sum' && zoneGroups && row.startZone !== zoneGroups.shown) return false
      return true
    })

    const mapped: ShownRow[] = shown.map((row) => {
      const placeA = row.startZone === 'A' || row.startZone === 'B' ? (opened[row.startZone][tourForZone(row.startZone, 'A')] ? row.zoneAPlace : null) : null
      const placeB = row.startZone === 'A' || row.startZone === 'B' ? (opened[row.startZone][tourForZone(row.startZone, 'B')] ? row.zoneBPlace : null) : null
      const zonePlace = view === 'A' ? placeA : view === 'B' ? placeB : null
      const zoneWeight = view === 'B' ? row.zoneBWeight : row.zoneAWeight
      return {
        row,
        zonePlace,
        zoneWeight,
        placeA,
        placeB,
        sum: placeA != null && placeB != null ? row.placeSum : null,
      }
    })

    mapped.sort((a, b) => {
      if (view === 'sum') {
        if (a.sum == null && b.sum == null) return b.row.totalWeight - a.row.totalWeight
        if (a.sum == null) return 1
        if (b.sum == null) return -1
        return a.sum - b.sum || b.row.totalWeight - a.row.totalWeight
      }
      if (a.zonePlace == null && b.zonePlace == null) return b.zoneWeight - a.zoneWeight
      if (a.zonePlace == null) return 1
      if (b.zonePlace == null) return -1
      return a.zonePlace - b.zonePlace || b.zoneWeight - a.zoneWeight
    })
    return mapped
  }, [standings, search, view, zoneGroups, opened])

  const placeKey = rows.map((item) => `${item.row.entryId}:${view === 'sum' ? item.sum ?? '' : item.zonePlace ?? ''}`).join('|')
  const [placeTrack, setPlaceTrack] = useState<{ key: string; places: Map<string, number>; shifts: Map<string, number> }>({
    key: '',
    places: new Map(),
    shifts: new Map(),
  })
  if (placeTrack.key !== placeKey) {
    const places = new Map<string, number>()
    const shifts = new Map<string, number>()
    for (const item of rows) {
      const place = view === 'sum' ? item.sum : item.zonePlace
      if (place == null) continue
      places.set(item.row.entryId, place)
      const previous = placeTrack.places.get(item.row.entryId)
      if (placeTrack.key && previous != null && previous !== place) shifts.set(item.row.entryId, previous - place)
    }
    setPlaceTrack({ key: placeKey, places, shifts })
  }

  useEffect(() => {
    if (placeTrack.shifts.size === 0) return
    const timer = window.setTimeout(() => setPlaceTrack((current) => ({ ...current, shifts: new Map() })), 2800)
    return () => window.clearTimeout(timer)
  }, [placeTrack])

  useEffect(() => {
    const ids = new Set(catches.map((catchRow) => catchRow.id))
    const known = knownCatches.current
    if (known.size > 0) {
      const fresh = catches.filter((catchRow) => !known.has(catchRow.id)).map((catchRow) => catchRow.entry_id)
      if (fresh.length > 0) {
        setFlashIds(new Set(fresh))
        knownCatches.current = ids
        const timer = window.setTimeout(() => setFlashIds(new Set()), 1600)
        return () => window.clearTimeout(timer)
      }
    }
    knownCatches.current = ids
  }, [catches])

  useEffect(() => {
    const sync = () => {
      setFullscreen((current) => {
        if (document.fullscreenElement === frameRef.current) return 'native'
        return current === 'native' ? 'off' : current
      })
    }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  useEffect(() => {
    if (fullscreen !== 'page') return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen('off')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  async function toggleFullscreen() {
    const el = frameRef.current
    if (!el) return
    if (fullscreen === 'page') {
      setFullscreen('off')
      return
    }
    if (document.fullscreenElement === el) {
      await document.exitFullscreen()
      return
    }
    try {
      await el.requestFullscreen()
    } catch {
      setFullscreen('page')
    }
  }

  function scrollToCheer() {
    if (!cheerId) return
    const row = standings.find((item) => item.entryId === cheerId)
    if (row?.startZone && view !== 'sum' && zoneGroups && row.startZone !== zoneGroups.shown) {
      setGroupMode(row.startZone === zoneGroups.nowGroup ? 'now' : 'past')
    }
    requestAnimationFrame(() => rowRefs.current.get(cheerId)?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  }

  if (standings.length === 0) {
    return <EmptyState title="Таблица пуста" description="Результаты появятся после взвешивания" />
  }

  const live = tournament.status === 'live'

  const expanded = fullscreen !== 'off'
  const podium = rows.filter((item) => (view === 'sum' ? item.sum != null : item.zonePlace != null)).slice(0, 3)
  const cheerInView = cheerId != null && rows.some((item) => item.row.entryId === cheerId)

  return (
    <Box
      ref={frameRef}
      className="pc-results-frame"
      style={
        expanded
          ? {
              height: '100%',
              minHeight: fullscreen === 'page' ? '100dvh' : undefined,
              display: 'flex',
              flexDirection: 'column',
              boxSizing: 'border-box',
              background: 'var(--pc-bg)',
              padding: 12,
              ...(fullscreen === 'page' ? { position: 'fixed', inset: 0, zIndex: 300 } : undefined),
            }
          : undefined
      }
    >
      <Stack gap="sm" style={expanded ? { flex: 1, minHeight: 0 } : undefined}>
        {live ? (
          <Text size="sm" c="dimmed">
            Таблица обновляется сама
          </Text>
        ) : null}
        <Group justify="space-between" align="center" wrap="wrap" gap="xs">
          <Group gap={6}>
            {(
              [
                ['A', 'Зона A'],
                ['B', 'Зона B'],
                ['sum', 'Сумма мест'],
              ] as const
            ).map(([value, label]) => (
              <Button key={value} size="xs" variant={view === value ? 'filled' : 'default'} onClick={() => setView(value)}>
                {label}
              </Button>
            ))}
          </Group>
          <TextInput
            placeholder="Поиск: команда или рыбак"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            style={{ flex: '1 1 180px' }}
          />
          {cheerId ? (
            <Button size="xs" variant="light" color="signal" onClick={scrollToCheer}>
              {cheerInView ? 'К моей команде' : 'Показать мою команду'}
            </Button>
          ) : null}
          <Button size="xs" variant={expanded ? 'filled' : 'default'} onClick={() => void toggleFullscreen()}>
            {expanded ? 'Свернуть' : 'На весь экран'}
          </Button>
        </Group>

        {view !== 'sum' && zoneGroups?.both ? (
          <Group gap={6}>
            <Button size="xs" variant={groupMode === 'now' ? 'filled' : 'default'} onClick={() => setGroupMode('now')}>
              Сейчас на воде
            </Button>
            <Button size="xs" variant={groupMode === 'past' ? 'filled' : 'default'} onClick={() => setGroupMode('past')}>
              Уже отловили
            </Button>
          </Group>
        ) : null}

        {podium.length > 0 ? (
          <Group gap="xs" grow preventGrowOverflow={false} wrap="wrap">
            {podium.map((item) => (
              <Panel key={item.row.entryId} p="sm">
                <Text className="pc-display" c="var(--pc-signal)" style={{ fontSize: '1.4rem' }}>
                  {formatPlace(view === 'sum' ? (item.sum ?? 0) : (item.zonePlace ?? 0))}
                </Text>
                <Text fw={700} lineClamp={1}>
                  {item.row.teamName}
                </Text>
                <Text size="sm" className="pc-tabular">
                  {grams(view === 'sum' ? item.row.totalWeight : item.zoneWeight)}
                </Text>
              </Panel>
            ))}
          </Group>
        ) : view !== 'sum' && zoneGroups?.empty ? (
          <Text size="sm" c="dimmed">
            В этой зоне ещё не взвешивали
          </Text>
        ) : null}

        <Text size="xs" c="dimmed" className="pc-tabular">
          {rows.length} команд
          {view === 'sum' ? ' · крупно сумма мест, вес только при равенстве' : ' · место считается внутри стартовой группы'}
        </Text>

        <Box style={expanded ? { flex: 1, minHeight: 0, overflow: 'auto' } : undefined}>
          <ResultsTable
            rows={rows}
            view={view}
            flashIds={flashIds}
            shifts={placeTrack.shifts}
            cheerId={cheerId}
            rowRefs={rowRefs}
            tournamentId={tournament.id}
          />
        </Box>
      </Stack>
    </Box>
  )
}

function ResultsTable({
  rows,
  view,
  flashIds,
  shifts,
  cheerId,
  rowRefs,
  tournamentId,
}: {
  rows: ShownRow[]
  view: BoardView
  flashIds: Set<string>
  shifts: Map<string, number>
  cheerId: string | null
  rowRefs: MutableRefObject<Map<string, HTMLTableRowElement>>
  tournamentId: string
}) {
  if (rows.length === 0) {
    return (
      <Panel>
        <Text size="sm" c="dimmed">
          По этому фильтру никого нет
        </Text>
      </Panel>
    )
  }

  const placeCol = { width: 52, paddingInline: 6 }
  const numCol = { width: 36, paddingInline: 4, whiteSpace: 'nowrap' as const }
  const weightCol = { width: 76, paddingInline: 4, whiteSpace: 'nowrap' as const }

  return (
    <Panel p={0}>
      <Table horizontalSpacing={0} verticalSpacing={8} style={{ tableLayout: 'fixed', width: '100%' }}>
        <Table.Thead>
          <Table.Tr style={{ borderBottom: '1px solid var(--pc-line)' }}>
            <Table.Th className="pc-display" style={{ ...placeCol, fontSize: 12, color: 'var(--pc-muted)' }}>
              {view === 'sum' ? 'Σ' : 'Место'}
            </Table.Th>
            <Table.Th className="pc-display" style={{ fontSize: 12, color: 'var(--pc-muted)', paddingInline: 6 }}>
              Команда
            </Table.Th>
            {view === 'sum' ? (
              <>
                <Table.Th ta="right" className="pc-display" style={{ ...numCol, fontSize: 12, color: 'var(--pc-muted)' }}>
                  A
                </Table.Th>
                <Table.Th ta="right" className="pc-display" style={{ ...numCol, fontSize: 12, color: 'var(--pc-muted)' }}>
                  B
                </Table.Th>
                <Table.Th ta="right" className="pc-display" style={{ ...weightCol, fontSize: 12, color: 'var(--pc-muted)' }}>
                  Вес
                </Table.Th>
              </>
            ) : (
              <>
                <Table.Th ta="right" className="pc-display" style={{ ...weightCol, fontSize: 12, color: 'var(--pc-muted)' }}>
                  Вес
                </Table.Th>
                <Table.Th ta="right" className="pc-display" style={{ ...numCol, width: 44, fontSize: 12, color: 'var(--pc-muted)' }}>
                  Σ
                </Table.Th>
              </>
            )}
          </Table.Tr>
        </Table.Thead>
          <Table.Tbody>
            {rows.map((item, index) => {
              const hero = view === 'sum' ? item.sum : item.zonePlace
              const top = index < 3 && hero != null
              const cheer = item.row.entryId === cheerId
              const shift = shifts.get(item.row.entryId)
              return (
                <Table.Tr
                  key={item.row.entryId}
                  ref={(node) => {
                    if (node) rowRefs.current.set(item.row.entryId, node)
                    else rowRefs.current.delete(item.row.entryId)
                  }}
                  className={flashIds.has(item.row.entryId) ? 'pc-catch-flash' : undefined}
                  style={{
                    borderBottom: '1px solid var(--pc-line)',
                    background: cheer
                      ? 'color-mix(in srgb, var(--pc-signal) 16%, transparent)'
                      : top
                        ? 'color-mix(in srgb, var(--pc-signal) 6%, transparent)'
                        : undefined,
                  }}
                >
                  <Table.Td style={placeCol}>
                    <Group gap={4} wrap="nowrap">
                      <Text className="pc-display pc-tabular" style={{ fontSize: top ? '1.25rem' : '1.05rem', color: top || cheer ? 'var(--pc-signal)' : undefined }}>
                        {hero == null ? '—' : formatPlace(hero)}
                      </Text>
                      {shift != null && shift !== 0 ? (
                        <Text size="xs" fw={700} c={shift > 0 ? 'var(--pc-signal)' : 'var(--pc-muted)'}>
                          {shift > 0 ? `▲${formatPlace(shift)}` : `▼${formatPlace(Math.abs(shift))}`}
                        </Text>
                      ) : null}
                    </Group>
                  </Table.Td>
                  <Table.Td style={{ paddingInline: 6, overflow: 'hidden' }}>
                    <Anchor
                      component={Link}
                      to={`/tournament/${tournamentId}/team/${item.row.entryId}`}
                      c="inherit"
                      underline="never"
                      fw={600}
                      style={{ display: 'block', lineHeight: 1.25 }}
                    >
                      {item.row.teamName}
                    </Anchor>
                    {item.row.rosterNames.length > 0 ? (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {item.row.rosterNames.join(' · ')}
                      </Text>
                    ) : null}
                  </Table.Td>
                  {view === 'sum' ? (
                    <>
                      <Table.Td ta="right" className="pc-tabular" style={numCol}>
                        {item.placeA == null ? '—' : formatPlace(item.placeA)}
                      </Table.Td>
                      <Table.Td ta="right" className="pc-tabular" style={numCol}>
                        {item.placeB == null ? '—' : formatPlace(item.placeB)}
                      </Table.Td>
                      <Table.Td ta="right" className="pc-tabular" fw={600} style={weightCol}>
                        {grams(item.row.totalWeight)}
                      </Table.Td>
                    </>
                  ) : (
                    <>
                      <Table.Td ta="right" className="pc-tabular" fw={600} style={weightCol}>
                        {grams(item.zoneWeight)}
                      </Table.Td>
                      <Table.Td ta="right" className="pc-tabular" style={{ ...numCol, width: 44 }}>
                        {item.sum == null ? '—' : formatPlace(item.sum)}
                      </Table.Td>
                    </>
                  )}
                </Table.Tr>
              )
            })}
          </Table.Tbody>
      </Table>
    </Panel>
  )
}
