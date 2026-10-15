import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  Anchor,
  Button,
  Group,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { Link, useParams } from 'react-router-dom'
import { TournamentShell } from '../components/TournamentShell'
import { LiveStrip, RankMark, ScoreSurface, SectionHead } from '../components/ui'
import { PageFrame } from '../components/PageFrame'
import {
  useActiveTournament,
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
  useTournament,
  useTournamentRealtime,
} from '../features/tournament/hooks'
import { getCurrentPhase } from '../features/tournament/schedule'
import { computeStandings, formatPlace, type StandingRow } from '../features/tournament/scoring'
import { entryTeamName, type TeamQuota, type ZoneCode } from '../features/tournament/types'
import { useNow } from '../features/tournament/useNow'

const thStyle: CSSProperties = {
  textAlign: 'center',
  whiteSpace: 'nowrap',
  verticalAlign: 'middle',
}

const tdCenter: CSSProperties = {
  textAlign: 'center',
  verticalAlign: 'middle',
}

const tdLeft: CSSProperties = {
  textAlign: 'left',
  verticalAlign: 'middle',
}

type SliceFilter = 'all' | 'top5' | 'top10' | 'top20' | 'hasCatch' | 'zeroZone'
type SortKey = 'final' | 'placeSum' | 'weight' | 'name' | 'zoneA' | 'zoneB'

const sliceOptions: { value: SliceFilter; label: string }[] = [
  { value: 'all', label: 'Все команды' },
  { value: 'top5', label: 'Топ-5' },
  { value: 'top10', label: 'Топ-10' },
  { value: 'top20', label: 'Топ-20' },
  { value: 'hasCatch', label: 'С уловом' },
  { value: 'zeroZone', label: 'Ноль в зоне' },
]

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'final', label: 'По итогу' },
  { value: 'placeSum', label: 'По Σ мест' },
  { value: 'weight', label: 'По весу' },
  { value: 'name', label: 'По названию' },
  { value: 'zoneA', label: 'По весу зоны А' },
  { value: 'zoneB', label: 'По весу зоны Б' },
]

const quotaOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'Все квоты' },
  { value: 'open', label: 'Open' },
  { value: 'prize', label: 'Призёры' },
  { value: 'org', label: 'Оргкомитет' },
]

function matchesSearch(row: StandingRow, query: string): boolean {
  if (!query) return true
  const q = query.trim().toLocaleLowerCase('ru')
  if (row.teamName.toLocaleLowerCase('ru').includes(q)) return true
  return row.rosterNames.some((name) => name.toLocaleLowerCase('ru').includes(q))
}

function sortRows(rows: StandingRow[], sort: SortKey): StandingRow[] {
  const copy = [...rows]
  copy.sort((a, b) => {
    switch (sort) {
      case 'placeSum':
        return a.placeSum - b.placeSum || b.totalWeight - a.totalWeight
      case 'weight':
        return b.totalWeight - a.totalWeight || a.placeSum - b.placeSum
      case 'name':
        return a.teamName.localeCompare(b.teamName, 'ru')
      case 'zoneA':
        return b.zoneAWeight - a.zoneAWeight || a.finalPlace - b.finalPlace
      case 'zoneB':
        return b.zoneBWeight - a.zoneBWeight || a.finalPlace - b.finalPlace
      case 'final':
      default:
        return a.finalPlace - b.finalPlace
    }
  })
  return copy
}

export function ResultsPage() {
  const { tournamentId } = useParams()
  const activeQuery = useActiveTournament()
  const byIdQuery = useTournament(tournamentId)
  const tournament = tournamentId ? byIdQuery.data : activeQuery.data
  const resolvedId = tournament?.id

  const { data: segments = [] } = useSegments(resolvedId)
  const { data: entries = [] } = useEntries(resolvedId)
  const { data: catches = [] } = useCatches(resolvedId)
  const { data: miniTours = [] } = useMiniTours(resolvedId)
  useTournamentRealtime(resolvedId)
  const now = useNow(5_000)

  const [search, setSearch] = useState('')
  const [zone, setZone] = useState<string>('all')
  const [quota, setQuota] = useState<string>('all')
  const [slice, setSlice] = useState<SliceFilter>('all')
  const [sort, setSort] = useState<SortKey>('final')
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const prevCatchIds = useRef<Set<string>>(new Set())

  const isArchive = tournament?.status === 'finished'
  const phase = tournament && !isArchive ? getCurrentPhase(tournament, segments, now) : null
  const standings = useMemo(
    () =>
      computeStandings(entries, catches, miniTours, {
        zeroPlaceIsGroupSizePlusOne: tournament?.zero_place_is_group_size_plus_one,
      }),
    [entries, catches, miniTours, tournament?.zero_place_is_group_size_plus_one],
  )

  useEffect(() => {
    const ids = new Set(catches.map((c) => c.id))
    const prev = prevCatchIds.current
    if (prev.size > 0) {
      const fresh = catches.filter((c) => !prev.has(c.id)).map((c) => c.entry_id)
      if (fresh.length > 0) {
        setFlashIds(new Set(fresh))
        const t = window.setTimeout(() => setFlashIds(new Set()), 1200)
        prevCatchIds.current = ids
        return () => window.clearTimeout(t)
      }
    }
    prevCatchIds.current = ids
  }, [catches])

  const entryMeta = useMemo(() => {
    const map = new Map<string, { quota: TeamQuota; startZone: ZoneCode | null; name: string }>()
    for (const e of entries) {
      map.set(e.id, {
        quota: e.quota,
        startZone: e.start_zone,
        name: entryTeamName(e),
      })
    }
    return map
  }, [entries])

  const filtered = useMemo(() => {
    let rows = standings.filter((row) => matchesSearch(row, search))

    if (zone !== 'all') {
      rows = rows.filter((row) => row.startZone === zone)
    }

    if (quota !== 'all') {
      rows = rows.filter((row) => entryMeta.get(row.entryId)?.quota === quota)
    }

    if (slice === 'top5') rows = rows.filter((row) => row.finalPlace <= 5)
    if (slice === 'top10') rows = rows.filter((row) => row.finalPlace <= 10)
    if (slice === 'top20') rows = rows.filter((row) => row.finalPlace <= 20)
    if (slice === 'hasCatch') rows = rows.filter((row) => row.totalWeight > 0)
    if (slice === 'zeroZone') {
      rows = rows.filter((row) => row.zoneAWeight === 0 || row.zoneBWeight === 0)
    }

    return sortRows(rows, sort)
  }, [standings, search, zone, quota, slice, sort, entryMeta])

  const filtersActive =
    search.trim() !== '' || zone !== 'all' || quota !== 'all' || slice !== 'all' || sort !== 'final'

  const entryName = new Map(entries.map((e) => [e.id, entryTeamName(e)]))
  const miniLabel = new Map(
    miniTours.map((m) => [m.id, `${m.tour_number === 1 ? 'I' : 'II'}·МТ${m.mini_number}`]),
  )

  const msLeft =
    phase?.endsAtEffective != null
      ? Math.max(0, phase.endsAtEffective.getTime() - now.getTime())
      : null

  const livePhase = phase
    ? {
        kind: phase.kind,
        label:
          phase.kind === 'before'
            ? (phase.nextSegment?.title ?? 'До старта')
            : phase.kind === 'active'
              ? (phase.segment?.title ?? 'Этап')
              : 'Финиш дня',
        minutesLeft: msLeft != null ? Math.ceil(msLeft / 60_000) : null,
        paused: Boolean(tournament?.schedule_paused_at),
        delayMinutes: tournament?.schedule_delay_minutes ?? 0,
      }
    : null

  const body = (
    <Stack gap="md">
      {(livePhase || isArchive) && (
        <LiveStrip
          phase={isArchive ? null : livePhase}
          archiveLabel={isArchive ? 'Архивный протокол' : undefined}
        />
      )}

      {standings.length > 0 && (
        <ScoreSurface
          p="sm"
          className="pc-scale-header"
          style={{
            position: 'sticky',
            top: 8,
            zIndex: 5,
            backdropFilter: 'blur(10px)',
            background: 'color-mix(in srgb, var(--pc-surface) 88%, transparent)',
          }}
        >
          <Stack gap="xs">
            <TextInput
              placeholder="Поиск: команда или рыбак"
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              size="sm"
            />
            <Group grow preventGrowOverflow={false} align="flex-end" wrap="wrap" gap="xs">
              <Select
                label="Зона"
                data={[
                  { value: 'all', label: 'Все' },
                  { value: 'A', label: 'Старт А' },
                  { value: 'B', label: 'Старт Б' },
                ]}
                value={zone}
                onChange={(v) => setZone(v ?? 'all')}
                allowDeselect={false}
                size="xs"
              />
              <Select
                label="Квота"
                data={quotaOptions}
                value={quota}
                onChange={(v) => setQuota(v ?? 'all')}
                allowDeselect={false}
                size="xs"
              />
              <Select
                label="Срез"
                data={sliceOptions}
                value={slice}
                onChange={(v) => setSlice((v as SliceFilter) ?? 'all')}
                allowDeselect={false}
                size="xs"
              />
              <Select
                label="Сорт."
                data={sortOptions}
                value={sort}
                onChange={(v) => setSort((v as SortKey) ?? 'final')}
                allowDeselect={false}
                size="xs"
              />
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed" className="pc-tabular">
                {filtered.length} / {standings.length}
              </Text>
              {filtersActive && (
                <Button
                  variant="subtle"
                  size="compact-xs"
                  color="gray"
                  onClick={() => {
                    setSearch('')
                    setZone('all')
                    setQuota('all')
                    setSlice('all')
                    setSort('final')
                  }}
                >
                  Сбросить
                </Button>
              )}
            </Group>
          </Stack>
        </ScoreSurface>
      )}

      {standings.length === 0 ? (
        <Text c="dimmed" size="sm">
          Нет команд для подсчёта
        </Text>
      ) : filtered.length === 0 ? (
        <Text c="dimmed" size="sm">
          Нет команд по выбранным фильтрам
        </Text>
      ) : (
        <ScoreSurface p={0}>
          <Table.ScrollContainer minWidth={860}>
            <Table
              withColumnBorders
              horizontalSpacing="xs"
              verticalSpacing={6}
              className="pc-scoreboard-table"
              style={{ borderCollapse: 'collapse' }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={thStyle}>№</Table.Th>
                  <Table.Th style={{ ...thStyle, textAlign: 'left' }}>Команда</Table.Th>
                  <Table.Th style={{ ...thStyle, textAlign: 'left' }}>Состав</Table.Th>
                  <Table.Th
                    style={{
                      ...thStyle,
                      color: 'var(--mantine-color-depth-6)',
                      background:
                        'color-mix(in srgb, var(--mantine-color-depth-5) 10%, transparent)',
                    }}
                  >
                    Зона А
                  </Table.Th>
                  <Table.Th
                    style={{
                      ...thStyle,
                      color: 'var(--mantine-color-depth-6)',
                      background:
                        'color-mix(in srgb, var(--mantine-color-depth-5) 10%, transparent)',
                    }}
                  >
                    Место
                  </Table.Th>
                  <Table.Th
                    style={{
                      ...thStyle,
                      color: 'var(--mantine-color-reed-7)',
                      background:
                        'color-mix(in srgb, var(--mantine-color-reed-5) 12%, transparent)',
                    }}
                  >
                    Зона Б
                  </Table.Th>
                  <Table.Th
                    style={{
                      ...thStyle,
                      color: 'var(--mantine-color-reed-7)',
                      background:
                        'color-mix(in srgb, var(--mantine-color-reed-5) 12%, transparent)',
                    }}
                  >
                    Место
                  </Table.Th>
                  <Table.Th style={thStyle}>Σ мест</Table.Th>
                  <Table.Th style={thStyle}>Вес</Table.Th>
                  <Table.Th style={thStyle}>Итог</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((row, index) => (
                  <Table.Tr
                    key={row.entryId}
                    className={flashIds.has(row.entryId) ? 'pc-catch-flash' : undefined}
                  >
                    <Table.Td style={tdCenter} className="pc-num">
                      {index + 1}
                    </Table.Td>
                    <Table.Td style={tdLeft}>
                      {row.teamId ? (
                        <Anchor
                          component={Link}
                          to={`/teams/${row.teamId}`}
                          size="sm"
                          fw={700}
                          c="depth"
                        >
                          {row.teamName}
                        </Anchor>
                      ) : (
                        <Text size="sm" fw={700}>
                          {row.teamName}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={tdLeft}>
                      {row.rosterNames.length === 0 ? (
                        <Text size="sm" c="dimmed">
                          —
                        </Text>
                      ) : (
                        row.rosterNames.map((name) => (
                          <Text key={name} size="sm" lh={1.3}>
                            {name}
                          </Text>
                        ))
                      )}
                    </Table.Td>
                    <Table.Td
                      style={{
                        ...tdCenter,
                        background:
                          'color-mix(in srgb, var(--mantine-color-depth-5) 6%, transparent)',
                      }}
                      className="pc-num"
                    >
                      {row.zoneAWeight}
                    </Table.Td>
                    <Table.Td
                      style={{
                        ...tdCenter,
                        background:
                          'color-mix(in srgb, var(--mantine-color-depth-5) 6%, transparent)',
                      }}
                      className="pc-num"
                    >
                      {formatPlace(row.zoneAPlace)}
                    </Table.Td>
                    <Table.Td
                      style={{
                        ...tdCenter,
                        background:
                          'color-mix(in srgb, var(--mantine-color-reed-5) 8%, transparent)',
                      }}
                      className="pc-num"
                    >
                      {row.zoneBWeight}
                    </Table.Td>
                    <Table.Td
                      style={{
                        ...tdCenter,
                        background:
                          'color-mix(in srgb, var(--mantine-color-reed-5) 8%, transparent)',
                      }}
                      className="pc-num"
                    >
                      {formatPlace(row.zoneBPlace)}
                    </Table.Td>
                    <Table.Td style={tdCenter} className="pc-num">
                      {formatPlace(row.placeSum)}
                    </Table.Td>
                    <Table.Td style={tdCenter} className="pc-num">
                      {row.totalWeight}
                    </Table.Td>
                    <Table.Td style={tdCenter}>
                      <RankMark place={row.finalPlace} />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </ScoreSurface>
      )}

      <Stack gap="xs">
        <SectionHead
          title={isArchive ? 'Взвешивания' : 'Последние взвешивания'}
          order={4}
        />
        {catches.length === 0 && (
          <Text c="dimmed" size="sm">
            Пока нет записей
          </Text>
        )}
        {catches.slice(0, isArchive ? 50 : 12).map((c) => (
          <Group
            key={c.id}
            justify="space-between"
            gap="xs"
            py={4}
            style={{ borderBottom: '1px solid var(--pc-hairline)' }}
          >
            <Text size="sm">
              {entryName.get(c.entry_id) ?? 'Команда'} · {miniLabel.get(c.mini_tour_id) ?? 'МТ'}
            </Text>
            <Text size="sm" fw={800} className="pc-tabular">
              {c.weight_grams} г
            </Text>
          </Group>
        ))}
      </Stack>
    </Stack>
  )

  if (!tournament) {
    return (
      <PageFrame wide>
        <Text c="dimmed">Загрузка протокола…</Text>
      </PageFrame>
    )
  }

  return (
    <TournamentShell tournament={tournament} wide>
      {body}
    </TournamentShell>
  )
}
