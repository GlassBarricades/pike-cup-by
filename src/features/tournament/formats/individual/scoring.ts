import type { TournamentFormat } from '../types'
import {
  entryTeamName,
  isSoloEntry,
  type AthleteDraw,
  type CatchRow,
  type MiniTour,
  type TournamentEntry,
  type TournamentRosterMember,
} from '../../types'

export type TourResult = {
  tour: number
  zone: string | null
  weight: number
  place: number
}

export type AthleteStandingRow = {
  rosterMemberId: string
  entryId: string
  teamId: string | null
  teamName: string
  athleteName: string
  /** Без команды — только в личном зачёте */
  solo: boolean
  junior: boolean
  tours: TourResult[]
  placeSum: number
  totalWeight: number
  bestTourWeight: number
  lastTourWeight: number
  finalPlace: number
}

export type TeamStandingRow = {
  entryId: string
  teamId: string | null
  teamName: string
  athleteIds: string[]
  athleteNames: string[]
  tours: TourResult[]
  placeSum: number
  totalWeight: number
  bestTourWeight: number
  lastTourWeight: number
  finalPlace: number
}

export type IndividualResults = {
  /**
   * Общая (взрослая) личка.
   * При separateJuniors: все спортсмены, включая юниоров.
   */
  athletes: AthleteStandingRow[]
  /**
   * Юниорский личный зачёт (пустой, если опция выкл).
   * При separateJuniors: все юниоры — отдельный пересчёт мест только среди них.
   */
  juniors: AthleteStandingRow[]
  teams: TeamStandingRow[]
}

type MemberRef = { entry: TournamentEntry; member: TournamentRosterMember }

function assignFinalPlaces(rows: AthleteStandingRow[], format: TournamentFormat): AthleteStandingRow[] {
  const sorted = [...rows].sort((a, b) => compareTiebreakers(a, b, format))
  sorted.forEach((row, index) => {
    row.finalPlace = index + 1
  })
  return sorted
}

function zeroPlaceValue(groupSize: number, format: TournamentFormat): number {
  return format.ranking.zeroPlace === 'group_size_plus_one' ? groupSize + 1 : groupSize
}

function rankByWeight(
  items: { id: string; weight: number }[],
  format: TournamentFormat,
): Map<string, number> {
  const n = items.length
  const sorted = [...items].sort((a, b) => b.weight - a.weight)
  const places = new Map<string, number>()
  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    while (j < sorted.length && sorted[j].weight === sorted[i].weight) j += 1
    if (sorted[i].weight === 0) {
      const place = zeroPlaceValue(n, format)
      for (let k = i; k < j; k++) places.set(sorted[k].id, place)
    } else if (format.ranking.tieAverage && j - i > 1) {
      const avg = (i + 1 + j) / 2
      for (let k = i; k < j; k++) places.set(sorted[k].id, avg)
    } else {
      for (let k = i; k < j; k++) places.set(sorted[k].id, i + 1)
    }
    i = j
  }
  return places
}

function compareTiebreakers(
  a: { placeSum: number; totalWeight: number; bestTourWeight: number; lastTourWeight: number },
  b: { placeSum: number; totalWeight: number; bestTourWeight: number; lastTourWeight: number },
  format: TournamentFormat,
): number {
  if (a.placeSum !== b.placeSum) return a.placeSum - b.placeSum
  for (const key of format.tiebreakers) {
    if (key === 'total_weight' && a.totalWeight !== b.totalWeight) return b.totalWeight - a.totalWeight
    if (key === 'best_tour_weight' && a.bestTourWeight !== b.bestTourWeight) {
      return b.bestTourWeight - a.bestTourWeight
    }
    if (key === 'last_tour_weight' && a.lastTourWeight !== b.lastTourWeight) {
      return b.lastTourWeight - a.lastTourWeight
    }
  }
  return 0
}

function athleteZoneForTour(
  rosterMemberId: string,
  tourNumber: number,
  draws: AthleteDraw[],
): string | null {
  const inTour = draws.filter((d) => d.roster_member_id === rosterMemberId && d.tour_number === tourNumber)
  if (inTour.length === 0) return null
  const firstMini = [...inTour].sort((a, b) => a.mini_number - b.mini_number)[0]
  return firstMini.zone
}

function weightForAthleteTour(
  rosterMemberId: string,
  tourNumber: number,
  catches: CatchRow[],
  miniTours: MiniTour[],
): number {
  const miniIds = new Set(miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id))
  return catches
    .filter((c) => c.roster_member_id === rosterMemberId && miniIds.has(c.mini_tour_id))
    .reduce((sum, c) => sum + c.weight_grams, 0)
}

function rankTourPlaces(
  pool: MemberRef[],
  tour: number,
  format: TournamentFormat,
  catches: CatchRow[],
  miniTours: MiniTour[],
  draws: AthleteDraw[],
  zoneByTourMember: Map<string, string | null>,
): Map<string, number> {
  type Row = { id: string; weight: number; zone: string | null }
  const rows: Row[] = pool.map(({ member }) => {
    const zone = athleteZoneForTour(member.id, tour, draws)
    zoneByTourMember.set(`${member.id}:${tour}`, zone)
    return {
      id: member.id,
      weight: weightForAthleteTour(member.id, tour, catches, miniTours),
      zone,
    }
  })

  const placeMap = new Map<string, number>()
  if (format.ranking.group === 'tour') {
    const ranked = rankByWeight(
      rows.map((r) => ({ id: r.id, weight: r.weight })),
      format,
    )
    for (const [id, place] of ranked) placeMap.set(id, place)
  } else {
    const byZone = new Map<string, Row[]>()
    for (const row of rows) {
      const key = row.zone ?? '__none__'
      const list = byZone.get(key) ?? []
      list.push(row)
      byZone.set(key, list)
    }
    for (const group of byZone.values()) {
      const ranked = rankByWeight(
        group.map((r) => ({ id: r.id, weight: r.weight })),
        format,
      )
      for (const [id, place] of ranked) placeMap.set(id, place)
    }
  }
  return placeMap
}

function buildAthleteRows(
  pool: MemberRef[],
  placesByTour: Map<number, Map<string, number>>,
  tourNumbers: number[],
  zoneByTourMember: Map<string, string | null>,
  catches: CatchRow[],
  miniTours: MiniTour[],
  format: TournamentFormat,
): AthleteStandingRow[] {
  const fallbackN = pool.length
  return pool.map(({ entry, member }) => {
    const tours: TourResult[] = tourNumbers.map((tour) => {
      const weight = weightForAthleteTour(member.id, tour, catches, miniTours)
      const zone = zoneByTourMember.get(`${member.id}:${tour}`) ?? null
      const placeMap = placesByTour.get(tour)!
      const place = placeMap.get(member.id) ?? zeroPlaceValue(fallbackN, format)
      return { tour, zone, weight, place }
    })
    const placeSum = tours.reduce((s, t) => s + t.place, 0)
    const totalWeight = tours.reduce((s, t) => s + t.weight, 0)
    const bestTourWeight = tours.reduce((m, t) => Math.max(m, t.weight), 0)
    const lastTourWeight = tours.length ? tours[tours.length - 1].weight : 0
    const solo = isSoloEntry(entry)
    return {
      rosterMemberId: member.id,
      entryId: entry.id,
      teamId: entry.team_id,
      teamName: solo ? 'личный' : entryTeamName(entry),
      athleteName: member.full_name_snapshot,
      solo,
      junior: Boolean(member.is_junior),
      tours,
      placeSum,
      totalWeight,
      bestTourWeight,
      lastTourWeight,
      finalPlace: 0,
    }
  })
}

function buildTeamRows(
  entries: TournamentEntry[],
  openRows: AthleteStandingRow[],
  tourNumbers: number[],
  format: TournamentFormat,
): TeamStandingRow[] {
  const openById = new Map(openRows.map((r) => [r.rosterMemberId, r]))
  const teamRows: TeamStandingRow[] = entries
    .filter((entry) => !isSoloEntry(entry))
    .flatMap((entry) => {
      const members = (entry.roster ?? []).filter((m) => m.role === 'athlete')
      const memberStandings = members
        .map((m) => openById.get(m.id))
        .filter((row): row is AthleteStandingRow => row != null)
      if (memberStandings.length === 0) return []

      const tours: TourResult[] = tourNumbers.map((tour) => {
        const tourPlaces = memberStandings.map((m) => m.tours.find((t) => t.tour === tour)!)
        const place = tourPlaces.reduce((s, t) => s + (t?.place ?? 0), 0)
        const weight = tourPlaces.reduce((s, t) => s + (t?.weight ?? 0), 0)
        const zones = [...new Set(tourPlaces.map((t) => t?.zone).filter(Boolean))]
        return {
          tour,
          zone: zones.length === 1 ? zones[0]! : null,
          weight,
          place,
        }
      })
      const placeSum = tours.reduce((s, t) => s + t.place, 0)
      const totalWeight = tours.reduce((s, t) => s + t.weight, 0)
      const bestTourWeight = tours.reduce((m, t) => Math.max(m, t.weight), 0)
      const lastTourWeight = tours.length ? tours[tours.length - 1].weight : 0
      return [
        {
          entryId: entry.id,
          teamId: entry.team_id,
          teamName: entryTeamName(entry),
          athleteIds: members.map((m) => m.id),
          athleteNames: members
            .slice()
            .sort((a, b) => a.slot - b.slot)
            .map((m) => m.full_name_snapshot),
          tours,
          placeSum,
          totalWeight,
          bestTourWeight,
          lastTourWeight,
          finalPlace: 0,
        },
      ]
    })

  teamRows.sort((a, b) => compareTiebreakers(a, b, format))
  teamRows.forEach((row, index) => {
    row.finalPlace = index + 1
  })
  return teamRows
}

function rankPool(
  pool: MemberRef[],
  tourNumbers: number[],
  format: TournamentFormat,
  catches: CatchRow[],
  miniTours: MiniTour[],
  draws: AthleteDraw[],
): AthleteStandingRow[] {
  const zoneByTourMember = new Map<string, string | null>()
  const placesByTour = new Map<number, Map<string, number>>()
  for (const tour of tourNumbers) {
    placesByTour.set(
      tour,
      rankTourPlaces(pool, tour, format, catches, miniTours, draws, zoneByTourMember),
    )
  }
  return buildAthleteRows(pool, placesByTour, tourNumbers, zoneByTourMember, catches, miniTours, format)
}

/**
 * Личный + командный зачёт: места спортсменов в зоне тура, команда = сумма мест атлетов.
 * При separateJuniors: общая личка = все; юниорская = только юниоры; команда из общей лички.
 */
export function computeIndividualResults(
  format: TournamentFormat,
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  draws: AthleteDraw[],
): IndividualResults {
  const active = entries.filter((e) => e.status === 'registered' || e.status === 'confirmed')
  const allMembers: MemberRef[] = active.flatMap((entry) =>
    (entry.roster ?? [])
      .filter((m) => m.role === 'athlete')
      .map((member) => ({ entry, member })),
  )

  const tourNumbers = format.tours.map((t) => t.number)
  const separate = format.ranking.separateJuniors

  const openRows = rankPool(allMembers, tourNumbers, format, catches, miniTours, draws)
  const teams = buildTeamRows(active, openRows, tourNumbers, format)

  if (!separate) {
    return {
      athletes: assignFinalPlaces(openRows, format),
      juniors: [],
      teams,
    }
  }

  const juniorMembers = allMembers.filter((ref) => ref.member.is_junior)
  const juniorRows = rankPool(juniorMembers, tourNumbers, format, catches, miniTours, draws)

  return {
    athletes: assignFinalPlaces(openRows, format),
    juniors: assignFinalPlaces(juniorRows, format),
    teams,
  }
}
