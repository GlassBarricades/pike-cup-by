import {
  fishingSlotsInOrder,
  type FishingSlot,
} from '../../schedule'
import type {
  CatchMoment,
  DayRecords,
  HeatCell,
  MatrixRow,
  RaceData,
  ZoneWindowReport,
} from '../../spectator'
import type { StandingRow } from '../pikecup/scoring'

function rankByWeight(rows: { id: string; weight: number }[]): Map<string, number> {
  const sorted = [...rows].sort((a, b) => b.weight - a.weight || a.id.localeCompare(b.id))
  const places = new Map<string, number>()
  let index = 0
  while (index < sorted.length) {
    let end = index + 1
    while (end < sorted.length && sorted[end]!.weight === sorted[index]!.weight) end += 1
    const average = (index + 1 + end) / 2
    for (let cursor = index; cursor < end; cursor += 1) places.set(sorted[cursor]!.id, average)
    index = end
  }
  return places
}
import type { TournamentFormat } from '../types'
import {
  computeIndividualResults,
  type AthleteStandingRow,
  type TeamStandingRow,
} from './scoring'
import {
  entryTeamName,
  isSoloEntry,
  type AthleteDraw,
  type CatchRow,
  type MiniTour,
  type ScheduleSegment,
  type Tournament,
  type TournamentEntry,
  type ZoneCode,
} from '../../types'

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

function athleteSlotGrams(
  rosterMemberId: string,
  slot: FishingSlot,
  catches: CatchRow[],
  miniTours: MiniTour[],
): number | null {
  const mini = miniBySlot(miniTours, slot)
  if (!mini) return null
  const rows = catches.filter(
    (row) => row.roster_member_id === rosterMemberId && row.mini_tour_id === mini.id,
  )
  if (rows.length === 0) return null
  return rows.reduce((sum, row) => sum + row.weight_grams, 0)
}

function entrySlotGrams(
  entryId: string,
  slot: FishingSlot,
  catches: CatchRow[],
  miniTours: MiniTour[],
): number | null {
  const mini = miniBySlot(miniTours, slot)
  if (!mini) return null
  const rows = catches.filter(
    (row) => row.entry_id === entryId && row.roster_member_id != null && row.mini_tour_id === mini.id,
  )
  if (rows.length === 0) return null
  return rows.reduce((sum, row) => sum + row.weight_grams, 0)
}

function findDraw(
  draws: AthleteDraw[],
  rosterMemberId: string,
  slot: FishingSlot,
): AthleteDraw | null {
  return (
    draws.find(
      (d) =>
        d.roster_member_id === rosterMemberId &&
        d.tour_number === slot.tour &&
        d.mini_number === slot.mini,
    ) ?? null
  )
}

function athletesOnZone(
  entries: TournamentEntry[],
  draws: AthleteDraw[],
  slot: FishingSlot,
  zone: ZoneCode,
): { entry: TournamentEntry; memberId: string; name: string; sector: number }[] {
  const rows: { entry: TournamentEntry; memberId: string; name: string; sector: number }[] = []
  for (const entry of activeEntries(entries)) {
    for (const member of entry.roster ?? []) {
      if (member.role !== 'athlete') continue
      const draw = findDraw(draws, member.id, slot)
      if (!draw || draw.zone !== zone) continue
      rows.push({
        entry,
        memberId: member.id,
        name: member.full_name_snapshot,
        sector: draw.sector,
      })
    }
  }
  return rows
}

function teamToStanding(team: TeamStandingRow): StandingRow {
  const t1 = team.tours.find((t) => t.tour === 1)
  const t2 = team.tours.find((t) => t.tour === 2)
  return {
    entryId: team.entryId,
    teamId: team.teamId,
    teamName: team.teamName,
    rosterNames: team.athleteNames,
    startZone: (t1?.zone as ZoneCode | null) ?? null,
    zoneAWeight: t1?.zone === 'A' ? (t1?.weight ?? 0) : t2?.zone === 'A' ? (t2?.weight ?? 0) : 0,
    zoneBWeight: t1?.zone === 'B' ? (t1?.weight ?? 0) : t2?.zone === 'B' ? (t2?.weight ?? 0) : 0,
    totalWeight: team.totalWeight,
    zoneAPlace: t1?.zone === 'A' ? (t1?.place ?? 0) : t2?.zone === 'A' ? (t2?.place ?? 0) : 0,
    zoneBPlace: t1?.zone === 'B' ? (t1?.place ?? 0) : t2?.zone === 'B' ? (t2?.place ?? 0) : 0,
    placeSum: team.placeSum,
    finalPlace: team.finalPlace,
  }
}

function athleteTourPlace(athlete: AthleteStandingRow | undefined, tour: number): number | null {
  if (!athlete) return null
  return athlete.tours.find((t) => t.tour === tour)?.place ?? athlete.finalPlace
}

function individualWindowReport(
  entries: TournamentEntry[],
  draws: AthleteDraw[],
  slot: FishingSlot,
  zone: ZoneCode,
  afterAthletes: AthleteStandingRow[],
  beforeAthletes: AthleteStandingRow[],
  catches: CatchRow[],
  miniTours: MiniTour[],
): ZoneWindowReport {
  const roster = athletesOnZone(entries, draws, slot, zone)
  const weighedRows = roster
    .map((row) => ({
      ...row,
      grams: athleteSlotGrams(row.memberId, slot, catches, miniTours),
    }))
    .filter((row): row is typeof row & { grams: number } => row.grams != null)
  const leaderGrams = weighedRows.reduce<number | null>(
    (max, row) => (max == null || row.grams > max ? row.grams : max),
    null,
  )
  const leaders =
    leaderGrams == null
      ? []
      : weighedRows.filter((row) => row.grams === leaderGrams).map((row) => row.name)
  const zeros = weighedRows.filter((row) => row.grams === 0).length
  const average =
    weighedRows.length === 0
      ? null
      : weighedRows.reduce((sum, row) => sum + row.grams, 0) / weighedRows.length
  const beforeById = new Map(beforeAthletes.map((row) => [row.rosterMemberId, row]))
  const afterById = new Map(afterAthletes.map((row) => [row.rosterMemberId, row]))
  const firstTimeTop3 = roster
    .filter((row) => {
      const next = afterById.get(row.memberId)
      const prev = beforeById.get(row.memberId)
      const nextPlace = athleteTourPlace(next, slot.tour)
      const prevPlace = athleteTourPlace(prev, slot.tour)
      if (nextPlace == null || (next?.totalWeight ?? 0) <= 0 || nextPlace > 3) return false
      if (prevPlace == null || (prev?.totalWeight ?? 0) <= 0) return true
      return prevPlace > 3
    })
    .map((row) => row.name)
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

function heatForAthletes(
  entries: TournamentEntry[],
  draws: AthleteDraw[],
  slots: FishingSlot[],
  catches: CatchRow[],
  miniTours: MiniTour[],
): HeatCell[] {
  const totals = new Map<string, HeatCell>()
  for (const slot of slots) {
    for (const entry of activeEntries(entries)) {
      for (const member of entry.roster ?? []) {
        if (member.role !== 'athlete') continue
        const draw = findDraw(draws, member.id, slot)
        const grams = athleteSlotGrams(member.id, slot, catches, miniTours)
        if (!draw || grams == null) continue
        const zone = draw.zone as ZoneCode
        const key = `${zone}:${draw.sector}`
        const existing = totals.get(key)
        if (existing) existing.grams += grams
        else totals.set(key, { zone, sector: draw.sector, grams })
      }
    }
  }
  return [...totals.values()]
}

function collectIndividualRecords(
  moments: CatchMoment[],
  entries: TournamentEntry[],
  draws: AthleteDraw[],
  slots: FishingSlot[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  slotReports: ZoneWindowReport[][],
): DayRecords {
  let heaviestMini: DayRecords['heaviestMini'] = null
  let heaviestSector: DayRecords['heaviestSector'] = null
  for (const entry of activeEntries(entries)) {
    for (const member of entry.roster ?? []) {
      if (member.role !== 'athlete') continue
      for (const slot of slots) {
        const grams = athleteSlotGrams(member.id, slot, catches, miniTours)
        if (grams == null) continue
        const label = member.full_name_snapshot
        if (!heaviestMini || grams > heaviestMini.grams) {
          heaviestMini = {
            entryId: entry.id,
            teamName: label,
            grams,
            tour: slot.tour,
            mini: slot.mini,
          }
        }
        const draw = findDraw(draws, member.id, slot)
        if (
          draw &&
          (!heaviestSector || grams > heaviestSector.grams)
        ) {
          heaviestSector = {
            entryId: entry.id,
            teamName: label,
            grams,
            zone: draw.zone as ZoneCode,
            sector: draw.sector,
            tour: slot.tour,
            mini: slot.mini,
          }
        }
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
        teamName: moment.athleteName ?? moment.teamName,
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
  const driest =
    (['A', 'B'] as const)
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

/** Open-строка предпочтительнее: юниор есть в обеих личках с разными местами. */
function allAthleteRows(results: {
  athletes: AthleteStandingRow[]
  juniors: AthleteStandingRow[]
}): AthleteStandingRow[] {
  const byId = new Map<string, AthleteStandingRow>()
  for (const row of results.juniors) byId.set(row.rosterMemberId, row)
  for (const row of results.athletes) byId.set(row.rosterMemberId, row)
  return [...byId.values()]
}

/**
 * LIVE story для individual / Кордон: матрицы атлетов и команд, моменты по roster_member_id.
 */
export function buildIndividualRace(
  format: TournamentFormat,
  _tournament: Pick<Tournament, 'zero_place_is_group_size_plus_one'>,
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  segments: ScheduleSegment[],
  draws: AthleteDraw[],
): RaceData {
  const slots = fishingSlotsInOrder(segments)
  const finalResults = computeIndividualResults(format, entries, catches, miniTours, draws)
  const allAthletes = allAthleteRows(finalResults)
  const standings = finalResults.teams.map(teamToStanding)
  const weightPlaces = rankByWeight(
    standings.map((row) => ({ id: row.entryId, weight: row.totalWeight })),
  )

  const chrono = [...catches]
    .filter((row) => row.roster_member_id != null)
    .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))

  const moments: CatchMoment[] = []
  let previous = computeIndividualResults(format, entries, [], miniTours, draws)
  for (let index = 0; index < chrono.length; index += 1) {
    const row = chrono[index]!
    const nextCatches = chrono.slice(0, index + 1)
    const next = computeIndividualResults(format, entries, nextCatches, miniTours, draws)
    const memberId = row.roster_member_id!
    const entry = entries.find((item) => item.id === row.entry_id)
    const member = entry?.roster?.find((m) => m.id === memberId)
    const mini = miniTours.find((m) => m.id === row.mini_tour_id)
    const slot: FishingSlot | null = mini
      ? { tour: mini.tour_number, mini: mini.mini_number }
      : null
    const draw = slot ? findDraw(draws, memberId, slot) : null
    const beforeAthlete = allAthleteRows(previous).find((a) => a.rosterMemberId === memberId)
    const afterAthlete = allAthleteRows(next).find((a) => a.rosterMemberId === memberId)
    const beforeTeam = previous.teams.find((t) => t.entryId === row.entry_id)
    const afterTeam = next.teams.find((t) => t.entryId === row.entry_id)
    const tour = mini?.tour_number ?? null
    moments.push({
      id: row.id,
      createdAt: row.created_at,
      entryId: row.entry_id,
      teamName: entry ? (isSoloEntry(entry) ? 'личный' : entryTeamName(entry)) : 'Команда',
      rosterNames: member ? [member.full_name_snapshot] : [],
      rosterMemberId: memberId,
      athleteName: member?.full_name_snapshot ?? null,
      grams: row.weight_grams,
      tour,
      mini: mini?.mini_number ?? null,
      zone: (draw?.zone as ZoneCode | undefined) ?? null,
      sector: draw?.sector ?? null,
      zonePlaceBefore: tour != null ? athleteTourPlace(beforeAthlete, tour) : null,
      zonePlaceAfter: tour != null ? athleteTourPlace(afterAthlete, tour) : null,
      sumBefore: beforeTeam?.placeSum ?? beforeAthlete?.placeSum ?? null,
      sumAfter: afterTeam?.placeSum ?? afterAthlete?.placeSum ?? null,
    })
    previous = next
  }
  moments.reverse()

  const afterSlot: StandingRow[][] = []
  const afterAthletesBySlot: AthleteStandingRow[][] = []
  const slotReports: ZoneWindowReport[][] = []
  const heatBySlot: HeatCell[][] = []

  for (const slot of slots) {
    const through = catchesUntil(catches, miniTours, slots, slot)
    const after = computeIndividualResults(format, entries, through, miniTours, draws)
    const previousSlot = slots[slotIndex(slots, slot) - 1]
    const beforeAthletes = previousSlot
      ? afterAthletesBySlot[slotIndex(slots, previousSlot)]!
      : allAthleteRows(computeIndividualResults(format, entries, [], miniTours, draws))
    afterSlot.push(after.teams.map(teamToStanding))
    afterAthletesBySlot.push(allAthleteRows(after))
    slotReports.push(
      (['A', 'B'] as const).map((zone) =>
        individualWindowReport(
          entries,
          draws,
          slot,
          zone,
          allAthleteRows(after),
          beforeAthletes,
          catches,
          miniTours,
        ),
      ),
    )
    heatBySlot.push(heatForAthletes(entries, draws, [slot], catches, miniTours))
  }

  const matrix: MatrixRow[] = allAthletes
    .slice()
    .sort((a, b) => a.athleteName.localeCompare(b.athleteName, 'ru'))
    .map((athlete) => {
      const cells = slots.map((slot, index) => {
        const draw = findDraw(draws, athlete.rosterMemberId, slot)
        const grams = athleteSlotGrams(athlete.rosterMemberId, slot, catches, miniTours)
        const afterList = afterAthletesBySlot[index] ?? []
        const after = afterList.find((row) => row.rosterMemberId === athlete.rosterMemberId)
        const place = grams != null ? athleteTourPlace(after, slot.tour) : null
        return {
          grams,
          place,
          sector: draw?.sector ?? null,
          zone: (draw?.zone as ZoneCode | undefined) ?? null,
        }
      })
      return {
        entryId: athlete.entryId,
        teamName: athlete.teamName,
        rosterNames: [athlete.athleteName],
        startZone: (athlete.tours[0]?.zone as ZoneCode | null) ?? null,
        rosterMemberId: athlete.rosterMemberId,
        athleteName: athlete.athleteName,
        junior: athlete.junior,
        cells,
      }
    })

  const matrixTeams: MatrixRow[] = finalResults.teams.map((team) => {
    const cells = slots.map((slot, index) => {
      const grams = entrySlotGrams(team.entryId, slot, catches, miniTours)
      const after = afterSlot[index]?.find((row) => row.entryId === team.entryId)
      const place = grams != null && after ? after.finalPlace : null
      const memberDraws = team.athleteIds
        .map((id) => findDraw(draws, id, slot))
        .filter(Boolean)
      const zones = [...new Set(memberDraws.map((d) => d!.zone))]
      const sectors = memberDraws.map((d) => d!.sector)
      return {
        grams,
        place,
        sector: sectors.length === 1 ? sectors[0]! : null,
        zone: zones.length === 1 ? (zones[0] as ZoneCode) : null,
      }
    })
    return {
      entryId: team.entryId,
      teamName: team.teamName,
      rosterNames: team.athleteNames,
      startZone: (team.tours[0]?.zone as ZoneCode | null) ?? null,
      cells,
    }
  })

  const records = collectIndividualRecords(
    moments,
    entries,
    draws,
    slots,
    catches,
    miniTours,
    slotReports,
  )

  return {
    standings,
    weightPlaces,
    slots,
    moments,
    records,
    matrix,
    matrixTeams,
    slotReports,
    afterSlot,
    heatBySlot,
    heatDay: heatForAthletes(entries, draws, slots, catches, miniTours),
    zeroPlusOne: format.ranking.zeroPlace === 'group_size_plus_one',
    engine: 'individual',
  }
}

/** Атлеты зоны на слоте — для progress / geo map. */
export function listAthletesOnZone(
  entries: TournamentEntry[],
  draws: AthleteDraw[],
  slot: FishingSlot,
  zone: ZoneCode,
) {
  return athletesOnZone(entries, draws, slot, zone)
}

export function athleteGramsForSlot(
  rosterMemberId: string,
  slot: FishingSlot,
  catches: CatchRow[],
  miniTours: MiniTour[],
) {
  return athleteSlotGrams(rosterMemberId, slot, catches, miniTours)
}
