import { useEffect, useMemo, useRef, useState } from 'react'
import { Group, Select, Stack, Text, TextInput } from '@mantine/core'
import { computeStandings, type StandingRow } from '../../features/tournament/scoring'
import {
  type CatchRow,
  type MiniTour,
  type TeamQuota,
  type Tournament,
  type TournamentEntry,
  type ZoneCode,
} from '../../features/tournament/types'
import { EmptyState, Leaderboard } from '../../ui'

type SliceFilter = 'all' | 'top5' | 'top10' | 'top20' | 'hasCatch' | 'zeroZone'
type SortKey = 'final' | 'placeSum' | 'weight' | 'name' | 'zoneA' | 'zoneB'

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
      default:
        return a.finalPlace - b.finalPlace
    }
  })
  return copy
}

export function ResultsTab({
  tournament,
  entries,
  catches,
  miniTours,
}: {
  tournament: Tournament
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
}) {
  const [search, setSearch] = useState('')
  const [zone, setZone] = useState('all')
  const [quota, setQuota] = useState('all')
  const [slice, setSlice] = useState<SliceFilter>('all')
  const [sort, setSort] = useState<SortKey>('final')
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set())
  const prevCatchIds = useRef<Set<string>>(new Set())

  const standings = useMemo(
    () =>
      computeStandings(entries, catches, miniTours, {
        zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one,
      }),
    [entries, catches, miniTours, tournament.zero_place_is_group_size_plus_one],
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
    const map = new Map<string, { quota: TeamQuota; startZone: ZoneCode | null }>()
    for (const e of entries) {
      map.set(e.id, { quota: e.quota, startZone: e.start_zone })
    }
    return map
  }, [entries])

  const filtered = useMemo(() => {
    let rows = standings.filter((row) => matchesSearch(row, search))
    if (zone !== 'all') rows = rows.filter((row) => row.startZone === zone)
    if (quota !== 'all') rows = rows.filter((row) => entryMeta.get(row.entryId)?.quota === quota)
    if (slice === 'top5') rows = rows.filter((row) => row.finalPlace <= 5)
    if (slice === 'top10') rows = rows.filter((row) => row.finalPlace <= 10)
    if (slice === 'top20') rows = rows.filter((row) => row.finalPlace <= 20)
    if (slice === 'hasCatch') rows = rows.filter((row) => row.totalWeight > 0)
    if (slice === 'zeroZone') {
      rows = rows.filter((row) => row.zoneAWeight === 0 || row.zoneBWeight === 0)
    }
    return sortRows(rows, sort)
  }, [standings, search, zone, quota, slice, sort, entryMeta])

  if (standings.length === 0) {
    return <EmptyState title="Таблица пуста" description="Результаты появятся после взвешивания" />
  }

  return (
    <Stack gap="xs">
      <TextInput
        placeholder="Поиск: команда или рыбак"
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      <Group grow preventGrowOverflow={false} wrap="wrap" gap="xs">
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
          data={[
            { value: 'all', label: 'Все квоты' },
            { value: 'open', label: 'Open' },
            { value: 'prize', label: 'Призёры' },
            { value: 'org', label: 'Оргкомитет' },
          ]}
          value={quota}
          onChange={(v) => setQuota(v ?? 'all')}
          allowDeselect={false}
          size="xs"
        />
        <Select
          label="Срез"
          data={[
            { value: 'all', label: 'Все команды' },
            { value: 'top5', label: 'Топ-5' },
            { value: 'top10', label: 'Топ-10' },
            { value: 'top20', label: 'Топ-20' },
            { value: 'hasCatch', label: 'С уловом' },
            { value: 'zeroZone', label: 'Ноль в зоне' },
          ]}
          value={slice}
          onChange={(v) => setSlice((v as SliceFilter) ?? 'all')}
          allowDeselect={false}
          size="xs"
        />
        <Select
          label="Сорт."
          data={[
            { value: 'final', label: 'По итогу' },
            { value: 'placeSum', label: 'По Σ мест' },
            { value: 'weight', label: 'По весу' },
            { value: 'name', label: 'По названию' },
            { value: 'zoneA', label: 'По весу зоны А' },
            { value: 'zoneB', label: 'По весу зоны Б' },
          ]}
          value={sort}
          onChange={(v) => setSort((v as SortKey) ?? 'final')}
          allowDeselect={false}
          size="xs"
        />
      </Group>
      <Text size="xs" c="dimmed" className="pc-tabular">
        {filtered.length} / {standings.length}
      </Text>
      <Leaderboard rows={filtered} flashIds={flashIds} />
    </Stack>
  )
}
