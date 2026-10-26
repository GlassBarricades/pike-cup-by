import { buildCatchLog } from './catchLog'
import { formatPlace, computeStandings, type StandingRow } from './scoring'
import {
  clockWeighSlot,
  fishingSlotsInOrder,
  getCurrentPhase,
  interpretSegment,
  physicalZone,
  resolveMapWindow,
  type CurrentPhase,
  type FishingSlot,
  type MapWindow,
} from './schedule'
import { slipSector } from './slips'
import {
  entryTeamName,
  type CatchRow,
  type MiniTour,
  type ScheduleSegment,
  type Tournament,
  type TournamentEntry,
  type ZoneCode,
} from './types'

export function gramsLabel(value: number): string {
  return `${value.toLocaleString('ru-RU')} г`
}

export function formatPlaceShift(before: number | null, after: number | null): string | null {
  if (after == null) return null
  if (before == null) return `место ${formatPlace(after)}`
  if (before === after) return `место ${formatPlace(after)}`
  return `с ${formatPlace(before)}-го на ${formatPlace(after)}-е`
}

export type CatchMoment = {
  id: string
  createdAt: string
  entryId: string
  teamName: string
  rosterNames: string[]
  grams: number
  tour: 1 | 2 | null
  mini: number | null
  zone: ZoneCode | null
  sector: number | null
  zonePlaceBefore: number | null
  zonePlaceAfter: number | null
  sumBefore: number | null
  sumAfter: number | null
}

export type MatrixCell = {
  grams: number | null
  place: number | null
  sector: number | null
  zone: ZoneCode | null
}

export type MatrixRow = {
  entryId: string
  teamName: string
  rosterNames: string[]
  startZone: ZoneCode | null
  cells: MatrixCell[]
}

export type ZoneWindowReport = {
  zone: ZoneCode
  leaderNames: string[]
  leaderGrams: number | null
  averageGrams: number | null
  zeros: number
  weighed: number
  expected: number
  firstTimeTop3: string[]
}

export type HeatCell = { zone: ZoneCode; sector: number; grams: number }

export type PendingTeam = {
  entryId: string
  teamName: string
  zone: ZoneCode
  sector: number
}

export type WindowProgress = {
  slot: FishingSlot
  weighed: number
  expected: number
  pending: PendingTeam[]
  closesAt: Date | null
}

export type Mover = {
  entryId: string
  teamName: string
  sumThen: number
  sumNow: number
  delta: number
}

export type DayRecords = {
  heaviestMini: {
    entryId: string
    teamName: string
    grams: number
    tour: 1 | 2
    mini: number
  } | null
  heaviestSector: {
    entryId: string
    teamName: string
    grams: number
    zone: ZoneCode
    sector: number
    tour: 1 | 2
    mini: number
  } | null
  biggestJump: {
    entryId: string
    teamName: string
    from: number
    to: number
    tour: 1 | 2 | null
    mini: number | null
  } | null
  driestZone: { zone: ZoneCode; zeroShare: number; zeros: number; weighed: number } | null
}

export type DayBeat =
  | {
      kind: 'fishing'
      key: string
      title: string
      slot: FishingSlot
      current: boolean
      passed: boolean
      zones: ZoneWindowReport[]
    }
  | {
      kind: 'move'
      key: string
      title: string
      current: boolean
      passed: boolean
      note: string
    }

export type GapInfo = {
  aheadName: string | null
  aheadPlaces: number | null
  aheadGrams: number | null
  behindName: string | null
  podiumPlaces: number | null
  podiumGrams: number | null
  inPodium: boolean
}

export type RaceData = {
  standings: StandingRow[]
  weightPlaces: Map<string, number>
  slots: FishingSlot[]
  moments: CatchMoment[]
  records: DayRecords
  matrix: MatrixRow[]
  slotReports: ZoneWindowReport[][]
  afterSlot: StandingRow[][]
  heatBySlot: HeatCell[][]
  heatDay: HeatCell[]
  zeroPlusOne: boolean
}

export type DayStory = RaceData & {
  phase: CurrentPhase
  mapWindow: MapWindow
  clock: FishingSlot | null
  progress: WindowProgress | null
  closedWindow: { slot: FishingSlot; zones: ZoneWindowReport[] } | null
  shoreNote: string | null
  chasers: Mover[]
  dropped: Mover[]
  pulse: HeatCell[]
  beats: DayBeat[]
}

function activeEntries(entries: TournamentEntry[]): TournamentEntry[] {
  return entries.filter((entry) => entry.status === 'registered' || entry.status === 'confirmed')
}

function sameSlot(a: FishingSlot, b: FishingSlot): boolean {
  return a.tour === b.tour && a.mini === b.mini
}

function slotIndex(slots: FishingSlot[], slot: FishingSlot | null): number {
  if (!slot) return -1
  return slots.findIndex((item) => sameSlot(item, slot))
}

function miniBySlot(miniTours: MiniTour[], slot: FishingSlot): MiniTour | null {
  return miniTours.find((mini) => mini.tour_number === slot.tour && mini.mini_number === slot.mini) ?? null
}

function zoneWeight(row: StandingRow, zone: ZoneCode): number {
  return zone === 'B' ? row.zoneBWeight : row.zoneAWeight
}

function zonePlace(row: StandingRow, zone: ZoneCode): number {
  return zone === 'B' ? row.zoneBPlace : row.zoneAPlace
}

function startOf(entry: TournamentEntry): ZoneCode | null {
  return entry.start_zone ?? entry.draw_slip?.start_zone ?? null
}

export function rankByWeight(rows: { id: string; weight: number }[]): Map<string, number> {
  const sorted = [...rows].sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
  const places = new Map<string, number>()
  let index = 0
  while (index < sorted.length) {
    let end = index + 1
    while (end < sorted.length && sorted[end].weight === sorted[index].weight) end += 1
    const average = (index + 1 + end) / 2
    for (let cursor = index; cursor < end; cursor += 1) places.set(sorted[cursor].id, average)
    index = end
  }
  return places
}

function catchesUntil(
  catches: CatchRow[],
  miniTours: MiniTour[],
  slots: FishingSlot[],
  inclusive: FishingSlot,
): CatchRow[] {
  const allowed = new Set<string>()
  let found = false
  for (const slot of slots) {
    const mini = miniBySlot(miniTours, slot)
    if (mini) allowed.add(mini.id)
    if (sameSlot(slot, inclusive)) {
      found = true
      break
    }
  }
  if (!found) return []
  return catches.filter((row) => allowed.has(row.mini_tour_id))
}

function slotGrams(entryId: string, slot: FishingSlot, catches: CatchRow[], miniTours: MiniTour[]): number | null {
  const mini = miniBySlot(miniTours, slot)
  if (!mini) return null
  const rows = catches.filter((row) => row.entry_id === entryId && row.mini_tour_id === mini.id)
  if (rows.length === 0) return null
  return rows.reduce((sum, row) => sum + row.weight_grams, 0)
}

function groupScored(rows: StandingRow[], start: ZoneCode | null, zone: ZoneCode): boolean {
  return rows.some((row) => row.startZone === start && zoneWeight(row, zone) > 0)
}

function bothToursOpen(start: ZoneCode | null, rows: StandingRow[]): boolean {
  if (start !== 'A' && start !== 'B') return false
  return groupScored(rows, start, 'A') && groupScored(rows, start, 'B')
}

function teamsOnZone(entries: TournamentEntry[], slot: FishingSlot, zone: ZoneCode): TournamentEntry[] {
  return activeEntries(entries).filter((entry) => physicalZone(startOf(entry), slot.tour) === zone)
}

function windowReport(
  entries: TournamentEntry[],
  slot: FishingSlot,
  zone: ZoneCode,
  after: StandingRow[],
  before: StandingRow[],
  catches: CatchRow[],
  miniTours: MiniTour[],
): ZoneWindowReport {
  const roster = teamsOnZone(entries, slot, zone)
  const weighedRows = roster
    .map((entry) => ({ entry, grams: slotGrams(entry.id, slot, catches, miniTours) }))
    .filter((row): row is { entry: TournamentEntry; grams: number } => row.grams != null)
  const leaderGrams = weighedRows.reduce<number | null>((max, row) => (max == null || row.grams > max ? row.grams : max), null)
  const leaders = leaderGrams == null ? [] : weighedRows.filter((row) => row.grams === leaderGrams).map((row) => entryTeamName(row.entry))
  const zeros = weighedRows.filter((row) => row.grams === 0).length
  const average = weighedRows.length === 0 ? null : weighedRows.reduce((sum, row) => sum + row.grams, 0) / weighedRows.length
  const beforeById = new Map(before.map((row) => [row.entryId, row]))
  const afterById = new Map(after.map((row) => [row.entryId, row]))
  const firstTimeTop3 = roster
    .filter((entry) => {
      const next = afterById.get(entry.id)
      const prev = beforeById.get(entry.id)
      if (!next || zoneWeight(next, zone) <= 0 || zonePlace(next, zone) > 3) return false
      if (!prev || zoneWeight(prev, zone) <= 0) return true
      return zonePlace(prev, zone) > 3
    })
    .map((entry) => entryTeamName(entry))
  return {
    zone,
    leaderNames: leaders,
    leaderGrams,
    averageGrams: average,
    zeros,
    weighed: weighedRows.length,
    expected: roster.length,
    firstTimeTop3,
  }
}

function heatFor(
  entries: TournamentEntry[],
  slots: FishingSlot[],
  catches: CatchRow[],
  miniTours: MiniTour[],
): HeatCell[] {
  const totals = new Map<string, HeatCell>()
  for (const slot of slots) {
    for (const entry of activeEntries(entries)) {
      const zone = physicalZone(startOf(entry), slot.tour)
      const sector = slipSector(entry.draw_slip, slot.tour, slot.mini)
      const grams = slotGrams(entry.id, slot, catches, miniTours)
      if (!zone || sector == null || grams == null) continue
      const key = `${zone}:${sector}`
      const existing = totals.get(key)
      if (existing) existing.grams += grams
      else totals.set(key, { zone, sector, grams })
    }
  }
  return [...totals.values()]
}

export function buildRace(
  tournament: Pick<Tournament, 'zero_place_is_group_size_plus_one'>,
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  segments: ScheduleSegment[],
): RaceData {
  const options = { zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one }
  const slots = fishingSlotsInOrder(segments)
  const standings = computeStandings(entries, catches, miniTours, options)
  const weightPlaces = rankByWeight(standings.map((row) => ({ id: row.entryId, weight: row.totalWeight })))
  const logById = new Map(buildCatchLog(entries, catches, miniTours).map((item) => [item.id, item]))
  const chrono = [...catches].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))

  const moments: CatchMoment[] = []
  let previous = computeStandings(entries, [], miniTours, options)
  for (let index = 0; index < chrono.length; index += 1) {
    const row = chrono[index]
    const nextCatches = chrono.slice(0, index + 1)
    const next = computeStandings(entries, nextCatches, miniTours, options)
    const item = logById.get(row.id)
    const beforeRow = previous.find((standing) => standing.entryId === row.entry_id)
    const afterRow = next.find((standing) => standing.entryId === row.entry_id)
    const zone = item?.zone ?? null
    const start = beforeRow?.startZone ?? afterRow?.startZone ?? null
    const scoredBefore = zone != null && beforeRow != null && groupScored(previous, start, zone)
    const bothBefore = bothToursOpen(start, previous)
    const bothAfter = bothToursOpen(start, next)
    moments.push({
      id: row.id,
      createdAt: row.created_at,
      entryId: row.entry_id,
      teamName: item?.teamName ?? afterRow?.teamName ?? 'Команда',
      rosterNames: item?.rosterNames ?? afterRow?.rosterNames ?? [],
      grams: row.weight_grams,
      tour: item?.tour ?? null,
      mini: item?.mini ?? null,
      zone,
      sector: item?.sector ?? null,
      zonePlaceBefore: scoredBefore && zone && beforeRow ? zonePlace(beforeRow, zone) : null,
      zonePlaceAfter: zone && afterRow ? zonePlace(afterRow, zone) : null,
      sumBefore: bothBefore && beforeRow ? beforeRow.placeSum : null,
      sumAfter: bothAfter && afterRow ? afterRow.placeSum : null,
    })
    previous = next
  }
  moments.reverse()

  const afterSlot: StandingRow[][] = []
  const slotReports: ZoneWindowReport[][] = []
  const heatBySlot: HeatCell[][] = []
  for (const slot of slots) {
    const through = catchesUntil(catches, miniTours, slots, slot)
    const after = computeStandings(entries, through, miniTours, options)
    const previousSlot = slots[slotIndex(slots, slot) - 1]
    const before = previousSlot ? afterSlot[slotIndex(slots, previousSlot)] : computeStandings(entries, [], miniTours, options)
    afterSlot.push(after)
    slotReports.push(
      (['A', 'B'] as const).map((zone) => windowReport(entries, slot, zone, after, before ?? [], catches, miniTours)),
    )
    heatBySlot.push(heatFor(entries, [slot], catches, miniTours))
  }

  const matrix: MatrixRow[] = standings.map((standing) => {
    const entry = entries.find((item) => item.id === standing.entryId)
    const cells = slots.map((slot, index) => {
      const zone = entry ? physicalZone(startOf(entry), slot.tour) : null
      const sector = entry ? slipSector(entry.draw_slip, slot.tour, slot.mini) : null
      const grams = entry ? slotGrams(entry.id, slot, catches, miniTours) : null
      const after = afterSlot[index]?.find((row) => row.entryId === standing.entryId)
      const place = grams != null && zone && after ? zonePlace(after, zone) : null
      return { grams, place, sector, zone }
    })
    return {
      entryId: standing.entryId,
      teamName: standing.teamName,
      rosterNames: standing.rosterNames,
      startZone: standing.startZone,
      cells,
    }
  })

  const records = collectRecords(moments, entries, slots, catches, miniTours, slotReports)
  return {
    standings,
    weightPlaces,
    slots,
    moments,
    records,
    matrix,
    slotReports,
    afterSlot,
    heatBySlot,
    heatDay: heatFor(entries, slots, catches, miniTours),
    zeroPlusOne: options.zeroPlaceIsGroupSizePlusOne !== false,
  }
}

function collectRecords(
  moments: CatchMoment[],
  entries: TournamentEntry[],
  slots: FishingSlot[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  slotReports: ZoneWindowReport[][],
): DayRecords {
  let heaviestMini: DayRecords['heaviestMini'] = null
  let heaviestSector: DayRecords['heaviestSector'] = null
  for (const entry of activeEntries(entries)) {
    for (const slot of slots) {
      const grams = slotGrams(entry.id, slot, catches, miniTours)
      if (grams == null) continue
      if (!heaviestMini || grams > heaviestMini.grams) {
        heaviestMini = { entryId: entry.id, teamName: entryTeamName(entry), grams, tour: slot.tour, mini: slot.mini }
      }
      const zone = physicalZone(startOf(entry), slot.tour)
      const sector = slipSector(entry.draw_slip, slot.tour, slot.mini)
      if (zone && sector != null && (!heaviestSector || grams > heaviestSector.grams)) {
        heaviestSector = { entryId: entry.id, teamName: entryTeamName(entry), grams, zone, sector, tour: slot.tour, mini: slot.mini }
      }
    }
  }

  let biggestJump: DayRecords['biggestJump'] = null
  for (const moment of moments) {
    if (moment.zonePlaceBefore == null || moment.zonePlaceAfter == null) continue
    const gain = moment.zonePlaceBefore - moment.zonePlaceAfter
    const current = biggestJump ? biggestJump.from - biggestJump.to : 0
    if (gain > current) {
      biggestJump = {
        entryId: moment.entryId,
        teamName: moment.teamName,
        from: moment.zonePlaceBefore,
        to: moment.zonePlaceAfter,
        tour: moment.tour,
        mini: moment.mini,
      }
    }
  }

  const tallies: Record<ZoneCode, { zeros: number; weighed: number }> = {
    A: { zeros: 0, weighed: 0 },
    B: { zeros: 0, weighed: 0 },
  }
  for (const reports of slotReports) {
    for (const report of reports) {
      tallies[report.zone].zeros += report.zeros
      tallies[report.zone].weighed += report.weighed
    }
  }
  const driest = (['A', 'B'] as const)
    .filter((zone) => tallies[zone].weighed > 0)
    .map((zone) => ({
      zone,
      zeros: tallies[zone].zeros,
      weighed: tallies[zone].weighed,
      zeroShare: tallies[zone].zeros / tallies[zone].weighed,
    }))
    .sort((a, b) => b.zeroShare - a.zeroShare)[0] ?? null

  return { heaviestMini, heaviestSector, biggestJump, driestZone: driest }
}

function completedSlots(slots: FishingSlot[], clock: FishingSlot | null, window: MapWindow, phaseKind: CurrentPhase['kind']): FishingSlot[] {
  if (phaseKind === 'before') return []
  if (phaseKind === 'after') return slots
  if (!clock || window.state === 'off') return []
  const index = slotIndex(slots, clock)
  if (index < 0) return []
  if (window.state === 'moving') return slots.slice(0, index + 1)
  return slots.slice(0, index)
}

function moversBetween(thenRows: StandingRow[], nowRows: StandingRow[]): { chasers: Mover[]; dropped: Mover[] } {
  const thenById = new Map(thenRows.map((row) => [row.entryId, row]))
  const movers: Mover[] = []
  for (const row of nowRows) {
    const before = thenById.get(row.entryId)
    if (!before) continue
    if (before.totalWeight <= 0 && row.totalWeight <= 0) continue
    const delta = before.placeSum - row.placeSum
    if (delta === 0) continue
    movers.push({ entryId: row.entryId, teamName: row.teamName, sumThen: before.placeSum, sumNow: row.placeSum, delta })
  }
  return {
    chasers: movers.filter((row) => row.delta > 0).sort((a, b) => b.delta - a.delta || a.teamName.localeCompare(b.teamName, 'ru')),
    dropped: movers.filter((row) => row.delta < 0).sort((a, b) => a.delta - b.delta || a.teamName.localeCompare(b.teamName, 'ru')),
  }
}

export function projectStory(
  race: RaceData,
  tournament: Pick<Tournament, 'schedule_delay_minutes' | 'schedule_paused_at' | 'live_phase_override'>,
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  segments: ScheduleSegment[],
  now: Date,
): DayStory {
  const phase = getCurrentPhase(tournament, segments, now)
  const mapWindow = resolveMapWindow(tournament, segments, now)
  const clock = clockWeighSlot(mapWindow, segments, phase.kind)
  const done = completedSlots(race.slots, clock, mapWindow, phase.kind)
  const closedSlot = done[done.length - 1] ?? null
  const closedIndex = slotIndex(race.slots, closedSlot)
  const baseline = done.length >= 3 ? done[done.length - 3] : null
  const baselineIndex = slotIndex(race.slots, baseline)
  const moved = baselineIndex >= 0 ? moversBetween(race.afterSlot[baselineIndex] ?? [], race.standings) : { chasers: [], dropped: [] }

  let progress: WindowProgress | null = null
  if (mapWindow.state === 'fishing' && clock) {
    const pending: PendingTeam[] = []
    let expected = 0
    let weighed = 0
    for (const zone of ['A', 'B'] as const) {
      for (const entry of teamsOnZone(entries, clock, zone)) {
        expected += 1
        const grams = slotGrams(entry.id, clock, catches, miniTours)
        const sector = slipSector(entry.draw_slip, clock.tour, clock.mini)
        if (grams == null) {
          if (sector != null) pending.push({ entryId: entry.id, teamName: entryTeamName(entry), zone, sector })
        } else {
          weighed += 1
        }
      }
    }
    progress = {
      slot: clock,
      weighed,
      expected,
      pending: pending.sort((a, b) => a.zone.localeCompare(b.zone) || a.sector - b.sector),
      closesAt: phase.kind === 'active' ? phase.endsAtEffective : null,
    }
  }

  const shoreNote =
    clock?.tour === 2 && clock.mini === 1
      ? 'Стартовая группа A теперь на зоне B — места зоны A уже зафиксированы. Стартовая группа B теперь на зоне A.'
      : mapWindow.state === 'moving' && mapWindow.tour === 2 && mapWindow.mini === 1 && mapWindow.from?.tour === 1
        ? 'Стартовая группа A теперь на зоне B — места зоны A уже зафиксированы. Стартовая группа B теперь на зоне A.'
        : null

  const ordered = [...segments].sort((a, b) => a.sort_order - b.sort_order)
  const beats: DayBeat[] = []
  for (const segment of ordered) {
    const info = interpretSegment(segment)
    if (info.kind === 'other' || !info.slot) continue
    const current = phase.kind === 'active' && phase.segment?.key === segment.key
    const start = new Date(segment.planned_starts_at).getTime()
    const passed = phase.effectiveNow.getTime() >= new Date(segment.planned_ends_at).getTime()
    if (info.kind === 'move') {
      const fromTour = mapWindow.state === 'moving' ? mapWindow.from?.tour : null
      const crossing = info.slot.tour === 2 && info.slot.mini === 1 && (fromTour === 1 || segment.key === 'break')
      beats.push({
        kind: 'move',
        key: segment.key,
        title: segment.title,
        current,
        passed,
        note: crossing ? 'Переход на другой берег' : 'Переход по сектору',
      })
      continue
    }
    const index = slotIndex(race.slots, info.slot)
    beats.push({
      kind: 'fishing',
      key: segment.key,
      title: segment.title,
      slot: info.slot,
      current: current || (mapWindow.state === 'fishing' && clock != null && sameSlot(clock, info.slot)),
      passed: passed || (start < phase.effectiveNow.getTime() && !(clock && sameSlot(clock, info.slot) && mapWindow.state === 'fishing')),
      zones: index >= 0 ? race.slotReports[index] : [],
    })
  }

  return {
    ...race,
    phase,
    mapWindow,
    clock,
    progress,
    closedWindow: closedIndex >= 0 && closedSlot ? { slot: closedSlot, zones: race.slotReports[closedIndex] ?? [] } : null,
    shoreNote,
    chasers: moved.chasers,
    dropped: moved.dropped,
    pulse: progress?.pending.map((row) => ({ zone: row.zone, sector: row.sector, grams: 0 })) ?? [],
    beats,
  }
}

export function buildDayStory(
  tournament: Tournament,
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  segments: ScheduleSegment[],
  now: Date,
): DayStory {
  return projectStory(buildRace(tournament, entries, catches, miniTours, segments), tournament, entries, catches, miniTours, segments, now)
}

export function explainWeightPlace(weight: number, place: number, peerWeights: number[], zeroPlusOne: boolean): string | null {
  if (weight === 0) {
    const size = peerWeights.length
    const why = zeroPlusOne ? `размер группы ${size} + 1` : `размер группы ${size}`
    return `Вес 0 → место ${formatPlace(place)} (${why})`
  }
  const same = peerWeights.filter((value) => value === weight).length
  if (same > 1) {
    return `Среднее место ${formatPlace(place)}, потому что ${same} команд по ${gramsLabel(weight)}`
  }
  return null
}

export function zoneExplanations(
  row: StandingRow,
  standings: StandingRow[],
  zeroPlusOne: boolean,
  opened: { A: boolean; B: boolean },
): string[] {
  const peers = standings.filter((item) => item.startZone != null && item.startZone === row.startZone)
  const lines: string[] = []
  if (opened.A) {
    const text = explainWeightPlace(row.zoneAWeight, row.zoneAPlace, peers.map((item) => item.zoneAWeight), zeroPlusOne)
    if (text) lines.push(`Зона A: ${text}`)
  }
  if (opened.B) {
    const text = explainWeightPlace(row.zoneBWeight, row.zoneBPlace, peers.map((item) => item.zoneBWeight), zeroPlusOne)
    if (text) lines.push(`Зона B: ${text}`)
  }
  return lines
}

export function entryZonesWithCatch(entry: TournamentEntry, catches: CatchRow[], miniTours: MiniTour[]): { A: boolean; B: boolean } {
  const start = startOf(entry)
  const opened = { A: false, B: false }
  if (start !== 'A' && start !== 'B') return opened
  const tourOf = new Map(miniTours.map((mini) => [mini.id, mini.tour_number]))
  for (const row of catches) {
    if (row.entry_id !== entry.id) continue
    const tour = tourOf.get(row.mini_tour_id)
    if (tour !== 1 && tour !== 2) continue
    const zone = physicalZone(start, tour)
    if (zone) opened[zone] = true
  }
  return opened
}

function gapFromSorted(sorted: StandingRow[], entryId: string, weightOf: (row: StandingRow) => number, placeOf: (row: StandingRow) => number): GapInfo {
  const index = sorted.findIndex((row) => row.entryId === entryId)
  const row = sorted[index]
  if (!row || index < 0) {
    return { aheadName: null, aheadPlaces: null, aheadGrams: null, behindName: null, podiumPlaces: null, podiumGrams: null, inPodium: false }
  }
  const ahead = index > 0 ? sorted[index - 1] : null
  const behind = sorted[index + 1] ?? null
  const place = placeOf(row)
  const third = sorted[2] ?? null
  const inPodium = place <= 3
  return {
    aheadName: ahead?.teamName ?? null,
    aheadPlaces: ahead ? place - placeOf(ahead) : null,
    aheadGrams: ahead ? weightOf(ahead) - weightOf(row) : null,
    behindName: behind?.teamName ?? null,
    podiumPlaces: !inPodium && third ? place - placeOf(third) : null,
    podiumGrams: !inPodium && third ? weightOf(third) - weightOf(row) : null,
    inPodium,
  }
}

export function zoneGap(row: StandingRow, standings: StandingRow[], zone: ZoneCode): GapInfo {
  const sorted = standings
    .filter((item) => item.startZone === row.startZone)
    .sort((a, b) => zonePlace(a, zone) - zonePlace(b, zone) || zoneWeight(b, zone) - zoneWeight(a, zone))
  return gapFromSorted(sorted, row.entryId, (item) => zoneWeight(item, zone), (item) => zonePlace(item, zone))
}

export function sumGap(row: StandingRow, standings: StandingRow[]): GapInfo {
  const sorted = [...standings].sort((a, b) => a.finalPlace - b.finalPlace)
  return gapFromSorted(sorted, row.entryId, (item) => item.totalWeight, (item) => item.placeSum)
}

export function gapLine(gap: GapInfo): string {
  const parts: string[] = []
  if (gap.inPodium) parts.push('В тройке')
  else if (gap.podiumPlaces != null) {
    const grams = gap.podiumGrams == null ? '' : gap.podiumGrams > 0 ? `, отставание ${gramsLabel(gap.podiumGrams)}` : gap.podiumGrams < 0 ? `, по весу впереди на ${gramsLabel(-gap.podiumGrams)}` : ', вес как у третьего'
    parts.push(`До тройки ${formatPlace(gap.podiumPlaces)} ${gap.podiumPlaces === 1 ? 'место' : 'места'}${grams}`)
  }
  if (gap.aheadName) {
    const places = gap.aheadPlaces != null ? `${formatPlace(gap.aheadPlaces)} м. ` : ''
    const grams = gap.aheadGrams == null ? '' : gap.aheadGrams > 0 ? `отставание ${gramsLabel(gap.aheadGrams)}` : gap.aheadGrams < 0 ? `по весу впереди на ${gramsLabel(-gap.aheadGrams)}` : 'вес равный'
    parts.push(`До ${gap.aheadName}: ${places}${grams}`.trim())
  }
  return parts.join(' · ')
}

export function shoreLeaders(standings: StandingRow[], tour: 1 | 2, zone: ZoneCode): StandingRow[] {
  return standings
    .filter((row) => physicalZone(row.startZone, tour) === zone && zoneWeight(row, zone) > 0)
    .sort((a, b) => zonePlace(a, zone) - zonePlace(b, zone) || zoneWeight(b, zone) - zoneWeight(a, zone))
    .slice(0, 3)
}

export function slipRoute(entry: TournamentEntry, tour: 1 | 2 | 'both'): { tour: 1 | 2; mini: number; zone: ZoneCode; sector: number }[] {
  const tours: Array<1 | 2> = tour === 'both' ? [1, 2] : [tour]
  const points: { tour: 1 | 2; mini: number; zone: ZoneCode; sector: number }[] = []
  for (const item of tours) {
    const zone = physicalZone(startOf(entry), item)
    if (!zone) continue
    for (let mini = 1; mini <= 5; mini += 1) {
      const sector = slipSector(entry.draw_slip, item, mini)
      if (sector == null) continue
      points.push({ tour: item, mini, zone, sector })
    }
  }
  return points
}

export function teamAtSector(
  entries: TournamentEntry[],
  slot: FishingSlot,
  zone: ZoneCode,
  sector: number,
): TournamentEntry | null {
  return (
    activeEntries(entries).find((entry) => {
      if (physicalZone(startOf(entry), slot.tour) !== zone) return false
      return slipSector(entry.draw_slip, slot.tour, slot.mini) === sector
    }) ?? null
  )
}

export function sectorHistory(
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  slots: FishingSlot[],
  zone: ZoneCode,
  sector: number,
): { tour: 1 | 2; mini: number; entryId: string; teamName: string; grams: number | null }[] {
  const rows: { tour: 1 | 2; mini: number; entryId: string; teamName: string; grams: number | null }[] = []
  for (const slot of slots) {
    const entry = teamAtSector(entries, slot, zone, sector)
    if (!entry) continue
    rows.push({
      tour: slot.tour,
      mini: slot.mini,
      entryId: entry.id,
      teamName: entryTeamName(entry),
      grams: slotGrams(entry.id, slot, catches, miniTours),
    })
  }
  return rows
}

export type SeasonBundle = {
  tournament: Tournament
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  standings: StandingRow[]
}

export function podiumRows(standings: StandingRow[]): StandingRow[] {
  return [...standings].sort((a, b) => a.finalPlace - b.finalPlace || a.teamName.localeCompare(b.teamName, 'ru')).slice(0, 3)
}

export function pairKey(names: string[]): string {
  return names.map((name) => name.trim().toLocaleLowerCase('ru')).filter(Boolean).sort().join('|')
}

export type SlotMark = {
  tournamentId: string
  tournamentName: string
  date: string
  entryId: string
  teamName: string
  tour: 1 | 2
  mini: number
  grams: number
  zone: ZoneCode | null
  sector: number | null
}

function bestAndWorst(marks: SlotMark[]): { best: SlotMark | null; worst: SlotMark | null; average: number | null } {
  if (marks.length === 0) return { best: null, worst: null, average: null }
  const best = marks.reduce((top, mark) => (mark.grams > top.grams ? mark : top))
  const worst = marks.reduce((low, mark) => (mark.grams < low.grams ? mark : low))
  const average = marks.reduce((sum, mark) => sum + mark.grams, 0) / marks.length
  return { best, worst, average }
}

function marksForEntry(bundle: SeasonBundle, entry: TournamentEntry): SlotMark[] {
  const slots = new Map<string, SlotMark>()
  for (const item of buildCatchLog(bundle.entries, bundle.catches, bundle.miniTours)) {
    if (item.entryId !== entry.id || item.tour == null || item.mini == null) continue
    const key = `${item.tour}:${item.mini}`
    const existing = slots.get(key)
    if (existing) existing.grams += item.grams
    else {
      slots.set(key, {
        tournamentId: bundle.tournament.id,
        tournamentName: bundle.tournament.name,
        date: bundle.tournament.event_date,
        entryId: entry.id,
        teamName: entryTeamName(entry),
        tour: item.tour,
        mini: item.mini,
        grams: item.grams,
        zone: item.zone,
        sector: item.sector,
      })
    }
  }
  return [...slots.values()]
}

export type AthleteSeason = {
  starts: {
    tournamentId: string
    tournamentName: string
    date: string
    teamName: string
    entryId: string
    finalPlace: number | null
    placeSum: number | null
    names: string[]
  }[]
  podiums: number
  wins: number
  bestMini: SlotMark | null
  averageMini: number | null
  teams: string[]
}

export function athleteSeason(bundles: SeasonBundle[], athleteId: string): AthleteSeason {
  const starts: AthleteSeason['starts'] = []
  const marks: SlotMark[] = []
  for (const bundle of bundles) {
    for (const entry of bundle.entries) {
      if (!entry.roster?.some((member) => member.athlete_id === athleteId)) continue
      const standing = bundle.standings.find((row) => row.entryId === entry.id)
      const names = [...(entry.roster ?? [])].sort((a, b) => a.slot - b.slot).map((member) => member.full_name_snapshot)
      starts.push({
        tournamentId: bundle.tournament.id,
        tournamentName: bundle.tournament.name,
        date: bundle.tournament.event_date,
        teamName: entryTeamName(entry),
        entryId: entry.id,
        finalPlace: standing?.finalPlace ?? null,
        placeSum: standing?.placeSum ?? null,
        names,
      })
      marks.push(...marksForEntry(bundle, entry))
    }
  }
  starts.sort((a, b) => b.date.localeCompare(a.date))
  const summary = bestAndWorst(marks)
  return {
    starts,
    podiums: starts.filter((start) => start.finalPlace != null && start.finalPlace <= 3).length,
    wins: starts.filter((start) => start.finalPlace === 1).length,
    bestMini: summary.best,
    averageMini: summary.average,
    teams: [...new Set(starts.map((start) => start.teamName))],
  }
}

export type PairHistoryRow = {
  tournamentId: string
  tournamentName: string
  date: string
  teamName: string
  entryId: string
  finalPlace: number | null
  placeSum: number | null
  zoneAPlace: number | null
  zoneBPlace: number | null
  zoneAWeight: number
  zoneBWeight: number
}

export type PairStats = {
  names: string[]
  starts: number
  wins: number
  podiums: number
  bestMini: SlotMark | null
  worstMini: SlotMark | null
  averageMini: number | null
  zoneABetter: number
  history: PairHistoryRow[]
}

function entryNames(entry: TournamentEntry): string[] {
  return [...(entry.roster ?? [])].sort((a, b) => a.slot - b.slot).map((member) => member.full_name_snapshot).filter(Boolean)
}

export function pairStats(bundles: SeasonBundle[], names: string[]): PairStats {
  const key = pairKey(names)
  const history: PairHistoryRow[] = []
  const marks: SlotMark[] = []
  let zoneABetter = 0
  for (const bundle of bundles) {
    for (const entry of bundle.entries) {
      if (pairKey(entryNames(entry)) !== key) continue
      const standing = bundle.standings.find((row) => row.entryId === entry.id) ?? null
      if (standing && standing.zoneAPlace < standing.zoneBPlace) zoneABetter += 1
      history.push({
        tournamentId: bundle.tournament.id,
        tournamentName: bundle.tournament.name,
        date: bundle.tournament.event_date,
        teamName: entryTeamName(entry),
        entryId: entry.id,
        finalPlace: standing?.finalPlace ?? null,
        placeSum: standing?.placeSum ?? null,
        zoneAPlace: standing?.zoneAPlace ?? null,
        zoneBPlace: standing?.zoneBPlace ?? null,
        zoneAWeight: standing?.zoneAWeight ?? 0,
        zoneBWeight: standing?.zoneBWeight ?? 0,
      })
      marks.push(...marksForEntry(bundle, entry))
    }
  }
  history.sort((a, b) => b.date.localeCompare(a.date))
  const summary = bestAndWorst(marks)
  return {
    names,
    starts: history.length,
    wins: history.filter((row) => row.finalPlace === 1).length,
    podiums: history.filter((row) => row.finalPlace != null && row.finalPlace <= 3).length,
    bestMini: summary.best,
    worstMini: summary.worst,
    averageMini: summary.average,
    zoneABetter,
    history,
  }
}

export type RivalRow = {
  key: string
  names: string[]
  teamName: string
  meetings: number
  myBetter: number
  theirBetter: number
  ties: number
}

export function rivalsForNames(bundles: SeasonBundle[], names: string[]): RivalRow[] {
  const key = pairKey(names)
  const rivals = new Map<string, RivalRow>()
  for (const bundle of bundles) {
    const mine = bundle.entries.find((entry) => pairKey(entryNames(entry)) === key)
    if (!mine || (mine.start_zone !== 'A' && mine.start_zone !== 'B')) continue
    const myStanding = bundle.standings.find((row) => row.entryId === mine.id)
    if (!myStanding) continue
    for (const other of bundle.entries) {
      if (other.id === mine.id || other.start_zone !== mine.start_zone) continue
      const otherNames = entryNames(other)
      const otherKey = pairKey(otherNames)
      if (!otherKey) continue
      const otherStanding = bundle.standings.find((row) => row.entryId === other.id)
      if (!otherStanding) continue
      const row = rivals.get(otherKey) ?? {
        key: otherKey,
        names: otherNames,
        teamName: entryTeamName(other),
        meetings: 0,
        myBetter: 0,
        theirBetter: 0,
        ties: 0,
      }
      row.meetings += 1
      row.teamName = entryTeamName(other)
      if (myStanding.finalPlace < otherStanding.finalPlace) row.myBetter += 1
      else if (myStanding.finalPlace > otherStanding.finalPlace) row.theirBetter += 1
      else row.ties += 1
      rivals.set(otherKey, row)
    }
  }
  return [...rivals.values()].sort((a, b) => b.meetings - a.meetings || b.myBetter - a.myBetter)
}

export type FameBoard = {
  wins: { label: string; count: number }[]
  heaviest: (SlotMark & { names: string[] }) | null
  streak: { label: string; length: number } | null
  zoneA: { label: string; times: number; starts: number } | null
}

export function fameFromBundles(bundles: SeasonBundle[]): FameBoard {
  const wins = new Map<string, { label: string; count: number }>()
  const streaks = new Map<string, { label: string; length: number; best: number }>()
  const zone = new Map<string, { label: string; times: number; starts: number }>()
  let heaviest: FameBoard['heaviest'] = null
  const ordered = [...bundles].sort((a, b) => a.tournament.event_date.localeCompare(b.tournament.event_date))

  for (const bundle of ordered) {
    for (const standing of bundle.standings) {
      if (standing.finalPlace !== 1) continue
      const row = wins.get(standing.teamName) ?? { label: standing.teamName, count: 0 }
      row.count += 1
      wins.set(standing.teamName, row)
    }
    for (const entry of bundle.entries) {
      const names = entryNames(entry)
      const key = pairKey(names)
      if (!key) continue
      const standing = bundle.standings.find((row) => row.entryId === entry.id)
      const label = names.join(' · ') || entryTeamName(entry)
      const run = streaks.get(key) ?? { label, length: 0, best: 0 }
      run.label = label
      if (standing && standing.finalPlace <= 3) {
        run.length += 1
        run.best = Math.max(run.best, run.length)
      } else {
        run.length = 0
      }
      streaks.set(key, run)
      if (standing) {
        const zoneRow = zone.get(key) ?? { label, times: 0, starts: 0 }
        zoneRow.label = label
        zoneRow.starts += 1
        if (standing.zoneAPlace < standing.zoneBPlace) zoneRow.times += 1
        zone.set(key, zoneRow)
      }
      for (const mark of marksForEntry(bundle, entry)) {
        if (!heaviest || mark.grams > heaviest.grams) heaviest = { ...mark, names }
      }
    }
  }

  const streak = [...streaks.values()].sort((a, b) => b.best - a.best)[0]
  const zoneA = [...zone.values()].filter((row) => row.starts >= 2).sort((a, b) => b.times - a.times || b.times / b.starts - a.times / a.starts)[0] ?? null
  return {
    wins: [...wins.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'ru')).slice(0, 8),
    heaviest,
    streak: streak && streak.best > 1 ? { label: streak.label, length: streak.best } : null,
    zoneA,
  }
}

export function bestWorstSlot(row: MatrixRow | undefined): { best: MatrixCell & { index: number } | null; worst: MatrixCell & { index: number } | null } {
  const weighed = (row?.cells ?? []).map((cell, index) => ({ ...cell, index })).filter((cell) => cell.grams != null) as Array<MatrixCell & { index: number; grams: number }>
  if (weighed.length === 0) return { best: null, worst: null }
  const best = weighed.reduce((top, cell) => (cell.grams > top.grams ? cell : top))
  const worst = weighed.reduce((low, cell) => (cell.grams < low.grams ? cell : low))
  return { best, worst }
}
