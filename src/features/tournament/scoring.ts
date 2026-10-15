import { entryTeamName, type CatchRow, type MiniTour, type TournamentEntry, type ZoneCode } from './types'

export type StandingRow = {
  entryId: string
  teamId: string | null
  teamName: string
  rosterNames: string[]
  startZone: ZoneCode | null
  zoneAWeight: number
  zoneBWeight: number
  totalWeight: number
  zoneAPlace: number
  zoneBPlace: number
  placeSum: number
  finalPlace: number
}

type Weighted = {
  entry: TournamentEntry
  tour1Weight: number
  tour2Weight: number
  zoneAWeight: number
  zoneBWeight: number
  totalWeight: number
}

function weightByTour(
  entryId: string,
  tourNumber: 1 | 2,
  catches: CatchRow[],
  miniTours: MiniTour[],
): number {
  const miniIds = new Set(
    miniTours.filter((m) => m.tour_number === tourNumber).map((m) => m.id),
  )
  return catches
    .filter((c) => c.entry_id === entryId && miniIds.has(c.mini_tour_id))
    .reduce((sum, c) => sum + c.weight_grams, 0)
}

/** I тур = стартовая зона, II тур = противоположная. */
function zoneWeights(
  startZone: ZoneCode | null | undefined,
  tour1Weight: number,
  tour2Weight: number,
): { zoneAWeight: number; zoneBWeight: number } {
  if (startZone === 'B') {
    return { zoneAWeight: tour2Weight, zoneBWeight: tour1Weight }
  }
  return { zoneAWeight: tour1Weight, zoneBWeight: tour2Weight }
}

export type StandingsOptions = {
  /** При весе 0: true → n+1, false → n. По умолчанию true. */
  zeroPlaceIsGroupSizePlusOne?: boolean
}

function zeroPlace(groupSize: number, plusOne: boolean): number {
  return plusOne ? groupSize + 1 : groupSize
}

/**
 * Места внутри одной зоны/группы (половина поля).
 * Ничья по весу > 0 → среднее место (14.5).
 * Вес 0 → n или n+1 в зависимости от настройки турнира.
 */
function rankPlaces(
  weights: { entryId: string; weight: number }[],
  zeroPlacePlusOne: boolean,
): Map<string, number> {
  const n = weights.length
  const sorted = [...weights].sort((a, b) => b.weight - a.weight)
  const places = new Map<string, number>()

  let i = 0
  while (i < sorted.length) {
    let j = i + 1
    while (j < sorted.length && sorted[j].weight === sorted[i].weight) j += 1

    if (sorted[i].weight === 0) {
      const place = zeroPlace(n, zeroPlacePlusOne)
      for (let k = i; k < j; k++) {
        places.set(sorted[k].entryId, place)
      }
    } else {
      const avg = (i + 1 + j) / 2
      for (let k = i; k < j; k++) {
        places.set(sorted[k].entryId, avg)
      }
    }
    i = j
  }

  return places
}

function rankGroupTour(
  group: Weighted[],
  tour: 1 | 2,
  zeroPlacePlusOne: boolean,
): Map<string, number> {
  return rankPlaces(
    group.map((w) => ({
      entryId: w.entry.id,
      weight: tour === 1 ? w.tour1Weight : w.tour2Weight,
    })),
    zeroPlacePlusOne,
  )
}

export function computeStandings(
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  options?: StandingsOptions,
): StandingRow[] {
  const zeroPlacePlusOne = options?.zeroPlaceIsGroupSizePlusOne !== false
  const active = entries.filter((e) => e.status === 'registered' || e.status === 'confirmed')

  const withWeights: Weighted[] = active.map((entry) => {
    const tour1Weight = weightByTour(entry.id, 1, catches, miniTours)
    const tour2Weight = weightByTour(entry.id, 2, catches, miniTours)
    const { zoneAWeight, zoneBWeight } = zoneWeights(entry.start_zone, tour1Weight, tour2Weight)
    return {
      entry,
      tour1Weight,
      tour2Weight,
      zoneAWeight,
      zoneBWeight,
      totalWeight: zoneAWeight + zoneBWeight,
    }
  })

  // Места считаются отдельно среди команд, которые одновременно были в зоне
  // (стартовая группа A и стартовая группа B).
  const groupA = withWeights.filter((w) => w.entry.start_zone === 'A')
  const groupB = withWeights.filter((w) => w.entry.start_zone === 'B')
  const groupUnknown = withWeights.filter((w) => w.entry.start_zone !== 'A' && w.entry.start_zone !== 'B')

  // Группа A: I тур → зона A, II тур → зона B
  const aZoneAPlaces = rankGroupTour(groupA, 1, zeroPlacePlusOne)
  const aZoneBPlaces = rankGroupTour(groupA, 2, zeroPlacePlusOne)
  // Группа B: I тур → зона B, II тур → зона A
  const bZoneBPlaces = rankGroupTour(groupB, 1, zeroPlacePlusOne)
  const bZoneAPlaces = rankGroupTour(groupB, 2, zeroPlacePlusOne)
  // Без зоны: условно I → A, II → B
  const uZoneAPlaces = rankGroupTour(groupUnknown, 1, zeroPlacePlusOne)
  const uZoneBPlaces = rankGroupTour(groupUnknown, 2, zeroPlacePlusOne)

  const fallbackA = zeroPlace(groupA.length, zeroPlacePlusOne)
  const fallbackB = zeroPlace(groupB.length, zeroPlacePlusOne)
  const fallbackU = zeroPlace(groupUnknown.length, zeroPlacePlusOne)

  const rows: StandingRow[] = withWeights.map((w) => {
    let zoneAPlace: number
    let zoneBPlace: number
    if (w.entry.start_zone === 'A') {
      zoneAPlace = aZoneAPlaces.get(w.entry.id) ?? fallbackA
      zoneBPlace = aZoneBPlaces.get(w.entry.id) ?? fallbackA
    } else if (w.entry.start_zone === 'B') {
      zoneAPlace = bZoneAPlaces.get(w.entry.id) ?? fallbackB
      zoneBPlace = bZoneBPlaces.get(w.entry.id) ?? fallbackB
    } else {
      zoneAPlace = uZoneAPlaces.get(w.entry.id) ?? fallbackU
      zoneBPlace = uZoneBPlaces.get(w.entry.id) ?? fallbackU
    }

    return {
      entryId: w.entry.id,
      teamId: w.entry.team_id,
      teamName: entryTeamName(w.entry),
      rosterNames: (w.entry.roster ?? [])
        .slice()
        .sort((a, b) => a.slot - b.slot)
        .map((r) => r.full_name_snapshot),
      startZone: w.entry.start_zone,
      zoneAWeight: w.zoneAWeight,
      zoneBWeight: w.zoneBWeight,
      totalWeight: w.totalWeight,
      zoneAPlace,
      zoneBPlace,
      placeSum: zoneAPlace + zoneBPlace,
      finalPlace: 0,
    }
  })

  rows.sort((a, b) => {
    if (a.placeSum !== b.placeSum) return a.placeSum - b.placeSum
    if (a.totalWeight !== b.totalWeight) return b.totalWeight - a.totalWeight
    return b.zoneBWeight - a.zoneBWeight
  })

  rows.forEach((row, index) => {
    row.finalPlace = index + 1
  })

  return rows
}

/** Для отображения: 14.5 → «14,5», 11 → «11» (как в протоколе). */
export function formatPlace(place: number): string {
  return Number.isInteger(place) ? String(place) : place.toFixed(1).replace('.', ',')
}
