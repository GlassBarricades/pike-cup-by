import { buildCatchLog } from './catchLog'
import { formatPlace } from './scoring'
import { slotTitle, type FishingSlot } from './schedule'
import type { RaceData, SeasonBundle } from './spectator'
import { pairKey } from './spectator'

export const chartColors = [
  'var(--pc-signal)',
  'var(--pc-zone-a)',
  'var(--pc-zone-b)',
  '#c9a227',
  '#8d6adf',
  '#d4537e',
  '#6a8f3a',
  '#5b7c99',
  '#b86b3d',
  '#3d8f7a',
]

export function slotMark(slot: FishingSlot): string {
  return `${slot.tour}.${slot.mini}`
}

export function hasWeights(race: RaceData): boolean {
  return race.matrix.some((row) => row.cells.some((cell) => cell.grams != null))
}

export function topIds(race: RaceData, count = 10): string[] {
  return [...race.standings]
    .sort((a, b) => a.finalPlace - b.finalPlace || a.teamName.localeCompare(b.teamName, 'ru'))
    .slice(0, count)
    .map((row) => row.entryId)
}

function leaderOf(rows: RaceData['standings']) {
  return [...rows].sort((a, b) => a.placeSum - b.placeSum || a.teamName.localeCompare(b.teamName, 'ru'))[0] ?? null
}

export function placeSumSeries(race: RaceData, entryIds: string[]) {
  return race.slots.map((slot, index) => {
    const point: Record<string, string | number | null> = { slot: slotMark(slot) }
    const standings = race.afterSlot[index] ?? []
    for (const id of entryIds) {
      point[id] = standings.find((row) => row.entryId === id)?.placeSum ?? null
    }
    return point
  })
}

function windowRanks(race: RaceData, index: number): Map<string, number> {
  const groups = new Map<string, { id: string; grams: number }[]>()
  for (const row of race.matrix) {
    const cell = row.cells[index]
    if (!cell || cell.grams == null || !cell.zone) continue
    const list = groups.get(cell.zone) ?? []
    list.push({ id: row.entryId, grams: cell.grams })
    groups.set(cell.zone, list)
  }
  const places = new Map<string, number>()
  for (const list of groups.values()) {
    const sorted = [...list].sort((a, b) => b.grams - a.grams || a.id.localeCompare(b.id))
    let cursor = 0
    while (cursor < sorted.length) {
      let end = cursor
      while (end + 1 < sorted.length && sorted[end + 1].grams === sorted[cursor].grams) end += 1
      const place = cursor + 1
      for (let index = cursor; index <= end; index += 1) places.set(sorted[index].id, place)
      cursor = end + 1
    }
  }
  return places
}

export function windowPlaceSeries(race: RaceData, entryIds: string[]) {
  return race.slots.map((slot, index) => {
    const point: Record<string, string | number | null> = { slot: slotMark(slot) }
    const ranks = windowRanks(race, index)
    for (const id of entryIds) point[id] = ranks.get(id) ?? null
    return point
  })
}

export function lastWeighedIndex(race: RaceData): number {
  for (let index = race.slots.length - 1; index >= 0; index -= 1) {
    if (race.matrix.some((row) => row.cells[index]?.grams != null)) return index
  }
  return Math.max(0, race.slots.length - 1)
}

export function replayRows(race: RaceData, slotIndex: number) {
  const ranks = windowRanks(race, slotIndex)
  return [...(race.afterSlot[slotIndex] ?? [])]
    .sort((a, b) => a.finalPlace - b.finalPlace || a.teamName.localeCompare(b.teamName, 'ru'))
    .map((row) => ({
      entryId: row.entryId,
      place: row.finalPlace,
      name: row.teamName,
      sum: row.placeSum,
      weight: row.totalWeight,
      windowPlace: ranks.get(row.entryId) ?? null,
    }))
}

export function decidedAfter(race: RaceData): { slot: string; leaderName: string; fromStart: boolean } | null {
  const leaders = race.afterSlot.map((rows) => leaderOf(rows))
  const final = leaders[leaders.length - 1]
  if (!final) return null
  let start = leaders.length - 1
  while (start > 0 && leaders[start - 1]?.entryId === final.entryId) start -= 1
  const slot = race.slots[start]
  if (!slot) return null
  return { slot: slotTitle(slot), leaderName: final.teamName, fromStart: start === 0 }
}

export function cumulativeSeries(race: RaceData, entryIds: string[]) {
  return race.slots.map((slot, index) => {
    const point: Record<string, string | number> = { slot: slotMark(slot) }
    for (const id of entryIds) {
      const row = race.matrix.find((item) => item.entryId === id)
      let sum = 0
      for (let cursor = 0; cursor <= index; cursor += 1) sum += row?.cells[cursor]?.grams ?? 0
      point[id] = sum
    }
    return point
  })
}

export function teamSlotBars(race: RaceData, entryId: string) {
  const row = race.matrix.find((item) => item.entryId === entryId)
  return race.slots.map((slot, index) => ({
    slot: slotMark(slot),
    grams: row?.cells[index]?.grams ?? 0,
    place: row?.cells[index]?.place,
  }))
}

export function slotAverageBars(race: RaceData) {
  return race.slots.map((slot, index) => {
    const reports = race.slotReports[index] ?? []
    const grams = reports.flatMap((report) => (report.averageGrams == null ? [] : [report.averageGrams]))
    const avg = grams.length ? grams.reduce((sum, value) => sum + value, 0) / grams.length : 0
    const zeros = reports.reduce((sum, report) => sum + report.zeros, 0)
    return { slot: slotMark(slot), title: slotTitle(slot), avg: Math.round(avg), zeros }
  })
}

export function extremeSlots(race: RaceData) {
  const bars = slotAverageBars(race)
  if (bars.length === 0) return { heaviest: null, driest: null }
  const heaviest = bars.reduce((best, bar) => (bar.avg > best.avg ? bar : best))
  const driest = bars.reduce((dry, bar) => (bar.zeros > dry.zeros || (bar.zeros === dry.zeros && bar.avg < dry.avg) ? bar : dry))
  return { heaviest, driest }
}

export function placeJumps(race: RaceData) {
  const jumps: { entryId: string; teamName: string; delta: number; span: string }[] = []
  for (let index = 1; index < race.slots.length; index += 1) {
    const before = new Map((race.afterSlot[index - 1] ?? []).map((row) => [row.entryId, row.placeSum]))
    for (const row of race.afterSlot[index] ?? []) {
      const previous = before.get(row.entryId)
      if (previous == null) continue
      const delta = previous - row.placeSum
      if (delta === 0) continue
      jumps.push({
        entryId: row.entryId,
        teamName: row.teamName,
        delta,
        span: `${slotMark(race.slots[index - 1])} → ${slotMark(race.slots[index])}`,
      })
    }
  }
  return jumps.sort((a, b) => b.delta - a.delta).slice(0, 8)
}

export function shoreBars(race: RaceData) {
  return race.slots.map((slot, index) => {
    const reports = race.slotReports[index] ?? []
    const zoneA = reports.find((report) => report.zone === 'A')
    const zoneB = reports.find((report) => report.zone === 'B')
    return {
      slot: slotMark(slot),
      a: Math.round(zoneA?.averageGrams ?? 0),
      b: Math.round(zoneB?.averageGrams ?? 0),
      zerosA: zoneA?.zeros ?? 0,
      zerosB: zoneB?.zeros ?? 0,
    }
  })
}

export function shorePlaces(race: RaceData) {
  return [...race.standings]
    .sort((a, b) => a.finalPlace - b.finalPlace)
    .map((row) => ({ entryId: row.entryId, name: row.teamName, a: row.zoneAPlace, b: row.zoneBPlace }))
}

export function sectorAverages(race: RaceData) {
  const buckets = new Map<number, { sum: number; count: number }>()
  for (const row of race.matrix) {
    for (const cell of row.cells) {
      if (cell.sector == null || cell.grams == null) continue
      const bucket = buckets.get(cell.sector) ?? { sum: 0, count: 0 }
      bucket.sum += cell.grams
      bucket.count += 1
      buckets.set(cell.sector, bucket)
    }
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([sector, bucket]) => ({ sector: String(sector), avg: Math.round(bucket.sum / bucket.count) }))
}

export function slipPoints(race: RaceData, entryId: string) {
  const row = race.matrix.find((item) => item.entryId === entryId)
  return race.slots.flatMap((slot, index) => {
    const cell = row?.cells[index]
    if (!cell || cell.sector == null || cell.grams == null) return []
    return [{ slot: slotMark(slot), sector: cell.sector, grams: cell.grams, zone: cell.zone ?? '' }]
  })
}

export function zoneSectorBars(race: RaceData, slotIndex: number, zone: 'A' | 'B') {
  return (race.heatBySlot[slotIndex] ?? [])
    .filter((cell) => cell.zone === zone)
    .sort((a, b) => a.sector - b.sector)
    .map((cell) => ({ sector: String(cell.sector), grams: cell.grams }))
}

export function weightPlacePoints(race: RaceData) {
  return race.standings.map((row) => ({
    entryId: row.entryId,
    name: row.teamName,
    weight: row.totalWeight,
    placeSum: row.placeSum,
  }))
}

export function placeCompare(race: RaceData) {
  return [...race.standings]
    .sort((a, b) => a.finalPlace - b.finalPlace)
    .map((row) => ({
      name: row.teamName,
      entryId: row.entryId,
      place: row.finalPlace,
      byWeight: race.weightPlaces.get(row.entryId) ?? row.finalPlace,
    }))
}

export function weightShare(race: RaceData) {
  return race.standings
    .filter((row) => row.totalWeight > 0)
    .map((row) => ({ name: row.teamName, size: row.totalWeight, place: row.finalPlace, entryId: row.entryId }))
}

export function radarAxes(race: RaceData, entryId: string) {
  const row = race.matrix.find((item) => item.entryId === entryId)
  const standing = race.standings.find((item) => item.entryId === entryId)
  const grams = (row?.cells ?? []).flatMap((cell) => (cell.grams == null ? [] : [cell.grams]))
  const best = grams.length ? Math.max(...grams) : 0
  const worst = grams.length ? Math.min(...grams) : 0
  const dayBest = Math.max(1, ...race.matrix.flatMap((item) => item.cells.map((cell) => cell.grams ?? 0)))
  const mean = grams.length ? grams.reduce((sum, value) => sum + value, 0) / grams.length : 0
  const variance = grams.length ? grams.reduce((sum, value) => sum + (value - mean) ** 2, 0) / grams.length : 0
  const spread = mean > 0 ? Math.min(1, Math.sqrt(variance) / mean) : 1
  const placeGap = standing ? Math.abs(standing.zoneAPlace - standing.zoneBPlace) : 0
  const maxGap = Math.max(1, ...race.standings.map((item) => Math.abs(item.zoneAPlace - item.zoneBPlace)))
  const zeros = (row?.cells ?? []).filter((cell) => cell.grams === 0).length
  const slots = Math.max(1, row?.cells.length ?? 1)
  return [
    { axis: 'Лучший слот', value: Math.round((best / dayBest) * 100) },
    { axis: 'Худший слот', value: Math.round((worst / dayBest) * 100) },
    { axis: 'Ровность', value: Math.round((1 - spread) * 100) },
    { axis: 'Берега', value: Math.round((1 - placeGap / maxGap) * 100) },
    { axis: 'Без нулей', value: Math.round((1 - zeros / slots) * 100) },
  ]
}

export type SeasonPair = { key: string; label: string }

export function pairsOf(bundle: SeasonBundle): SeasonPair[] {
  return bundle.standings.flatMap((row) => {
    const key = pairKey(row.rosterNames)
    if (!key) return []
    return [{ key, label: row.rosterNames.join(' · ') || row.teamName }]
  })
}

export function seasonPlaceSeries(bundles: SeasonBundle[], keys: string[]) {
  const ordered = [...bundles].sort((a, b) => a.tournament.event_date.localeCompare(b.tournament.event_date))
  return ordered.map((bundle) => {
    const point: Record<string, string | number | null> = {
      label: bundle.tournament.event_date.slice(0, 10),
      title: bundle.tournament.name,
    }
    for (const key of keys) {
      const row = bundle.standings.find((item) => pairKey(item.rosterNames) === key)
      point[key] = row ? row.finalPlace : null
    }
    return point
  })
}

export function seasonPairStats(bundles: SeasonBundle[]) {
  const ordered = [...bundles].sort((a, b) => a.tournament.event_date.localeCompare(b.tournament.event_date))
  const map = new Map<string, { label: string; starts: number; podiums: number; wins: number }>()
  for (const bundle of ordered) {
    for (const row of bundle.standings) {
      const key = pairKey(row.rosterNames)
      if (!key) continue
      const item = map.get(key) ?? { label: row.teamName, starts: 0, podiums: 0, wins: 0 }
      item.label = row.teamName
      item.starts += 1
      if (row.finalPlace <= 3) item.podiums += 1
      if (row.finalPlace === 1) item.wins += 1
      map.set(key, item)
    }
  }
  return [...map.entries()]
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => b.podiums - a.podiums || b.wins - a.wins || a.label.localeCompare(b.label, 'ru'))
}

export function shoreDecision(bundles: SeasonBundle[]) {
  let shoreA = 0
  let shoreB = 0
  let tied = 0
  for (const bundle of bundles) {
    for (const row of bundle.standings) {
      if (row.zoneAWeight === 0 && row.zoneBWeight === 0) continue
      if (row.zoneAPlace < row.zoneBPlace) shoreA += 1
      else if (row.zoneBPlace < row.zoneAPlace) shoreB += 1
      else tied += 1
    }
  }
  return [
    { name: 'Берег A', value: shoreA },
    { name: 'Берег B', value: shoreB },
    { name: 'Поровну', value: tied },
  ]
}

export function sectorLuck(race: RaceData, entryId: string) {
  const others = new Map<number, { sum: number; count: number }>()
  for (const row of race.matrix) {
    if (row.entryId === entryId) continue
    for (const cell of row.cells) {
      if (cell.sector == null || cell.grams == null) continue
      const bucket = others.get(cell.sector) ?? { sum: 0, count: 0 }
      bucket.sum += cell.grams
      bucket.count += 1
      others.set(cell.sector, bucket)
    }
  }
  const row = race.matrix.find((item) => item.entryId === entryId)
  return race.slots.flatMap((slot, index) => {
    const cell = row?.cells[index]
    if (!cell || cell.sector == null || cell.grams == null) return []
    const bucket = others.get(cell.sector)
    const avg = bucket && bucket.count > 0 ? Math.round(bucket.sum / bucket.count) : null
    return [{ label: `${slotMark(slot)} · ${cell.sector}`, grams: cell.grams, avg, sector: cell.sector }]
  })
}

export function neighborBars(race: RaceData, entryId: string, slotIndex: number, span = 2) {
  const row = race.matrix.find((item) => item.entryId === entryId)
  const cell = row?.cells[slotIndex]
  if (!row || !cell || cell.sector == null || !cell.zone) return []
  const mine = cell.sector
  const zone = cell.zone
  return race.matrix
    .flatMap((item) => {
      const other = item.cells[slotIndex]
      if (!other || other.zone !== zone || other.sector == null || other.grams == null) return []
      if (Math.abs(other.sector - mine) > span) return []
      return [{ sector: String(other.sector), grams: other.grams, name: item.teamName, entryId: item.entryId, mine: item.entryId === entryId, zone }]
    })
    .sort((a, b) => Number(a.sector) - Number(b.sector) || a.name.localeCompare(b.name, 'ru'))
}

export type GramGap = {
  entryId: string
  name: string
  kind: 'lead' | 'weight' | 'places'
  places: number
  grams: number
  above: string | null
}

export function gramGaps(race: RaceData): GramGap[] {
  const ordered = [...race.standings].sort((a, b) => a.finalPlace - b.finalPlace)
  return ordered.map((row, index) => {
    const above = ordered[index - 1]
    if (!above) return { entryId: row.entryId, name: row.teamName, kind: 'lead', places: 0, grams: 0, above: null }
    const places = row.placeSum - above.placeSum
    return {
      entryId: row.entryId,
      name: row.teamName,
      kind: places === 0 ? 'weight' : 'places',
      places,
      grams: above.totalWeight - row.totalWeight,
      above: above.teamName,
    }
  })
}

export function gapSentence(row: GramGap): string {
  if (row.kind === 'lead') return `${row.name} на первом месте.`
  if (row.kind === 'weight' && row.grams > 0) {
    return `Сумма мест как у ${row.above}. До них не хватило ${row.grams.toLocaleString('ru-RU')} г.`
  }
  if (row.kind === 'weight') return `Сумма мест как у ${row.above}. Вес не меньше, выше их держит второй берег.`
  const weight =
    row.grams > 0
      ? `Веса меньше на ${row.grams.toLocaleString('ru-RU')} г, на место это не влияет.`
      : row.grams < 0
        ? `Веса больше на ${Math.abs(row.grams).toLocaleString('ru-RU')} г, место держит сумма.`
        : 'Вес одинаковый, место держит сумма.'
  return `До ${row.above} ещё ${formatPlace(row.places)} по сумме мест. ${weight}`
}

export function cupPulse(bundle: SeasonBundle) {
  const total = bundle.catches.reduce((sum, row) => sum + row.weight_grams, 0)
  const zeros = bundle.catches.filter((row) => row.weight_grams === 0).length
  const avg = bundle.catches.length ? Math.round(total / bundle.catches.length) : 0
  return { total, avg, zeros }
}

export function cupAgainst(bundles: SeasonBundle[], tournamentId: string) {
  const current = bundles.find((bundle) => bundle.tournament.id === tournamentId)
  if (!current) return null
  const mine = cupPulse(current)
  const rest = bundles.filter((bundle) => bundle.tournament.id !== tournamentId).map(cupPulse)
  if (rest.length === 0) return { mine, past: null }
  const past = {
    total: Math.round(rest.reduce((sum, row) => sum + row.total, 0) / rest.length),
    avg: Math.round(rest.reduce((sum, row) => sum + row.avg, 0) / rest.length),
    zeros: Math.round(rest.reduce((sum, row) => sum + row.zeros, 0) / rest.length),
  }
  return { mine, past }
}

export function seasonSectorPoints(bundles: SeasonBundle[], key: string) {
  const points: { sector: number; grams: number; tournament: string }[] = []
  for (const bundle of bundles) {
    const standing = bundle.standings.find((row) => pairKey(row.rosterNames) === key)
    if (!standing) continue
    for (const item of buildCatchLog(bundle.entries, bundle.catches, bundle.miniTours)) {
      if (item.entryId !== standing.entryId || item.sector == null) continue
      points.push({ sector: item.sector, grams: item.grams, tournament: bundle.tournament.name })
    }
  }
  return points
}
