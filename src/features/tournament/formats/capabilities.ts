import type { TournamentFormat } from './types'

export function catchUnit(format: TournamentFormat): 'entry' | 'athlete' {
  return format.participants.catchUnit
}

/** @deprecated Prefer catchUnit — maps entry→pikecup, athlete→individual for legacy branches. */
export function legacyEngine(format: TournamentFormat): 'pikecup' | 'individual' {
  return format.participants.catchUnit === 'entry' ? 'pikecup' : 'individual'
}

export function isEntryCatch(format: TournamentFormat): boolean {
  return format.participants.catchUnit === 'entry'
}

export function isAthleteCatch(format: TournamentFormat): boolean {
  return format.participants.catchUnit === 'athlete'
}

export function hasTeamStandings(format: TournamentFormat): boolean {
  return format.standings.team
}

export function hasIndividualStandings(format: TournamentFormat): boolean {
  return format.standings.individual
}

export function hasJuniorStandings(format: TournamentFormat): boolean {
  return format.standings.juniors && format.participants.juniors.separateStandings
}

export function allowsSoloAthletes(format: TournamentFormat): boolean {
  return format.participants.mode === 'teams_and_solo' || format.participants.mode === 'individual'
}

export function allowsTeams(format: TournamentFormat): boolean {
  return format.participants.mode === 'teams' || format.participants.mode === 'teams_and_solo'
}

export function zoneCodes(format: TournamentFormat): string[] {
  return format.structure.zones.map((z) => z.code)
}

export function zoneLabel(format: TournamentFormat, code: string): string {
  const found = format.structure.zones.find((z) => z.code === code)
  return found?.label ?? `Зона ${code}`
}

export function tourNumbers(format: TournamentFormat): number[] {
  return format.structure.tours.map((t) => t.number)
}

export function totalMinis(format: TournamentFormat): number {
  return format.structure.tours.reduce((sum, t) => sum + t.minis, 0)
}

export function fishingKeys(format: TournamentFormat): string[] {
  const keys: string[] = []
  for (const tour of format.structure.tours) {
    for (let mini = 1; mini <= tour.minis; mini += 1) {
      keys.push(`tour${tour.number}_mt${mini}`)
    }
  }
  return keys
}

export function zeroPlacePlusOne(format: TournamentFormat): boolean {
  return format.scoring.zeroPlace === 'group_size_plus_one'
}

export function usesSlips(format: TournamentFormat): boolean {
  return format.draw.method === 'slips'
}

export function usesAthleteDraw(format: TournamentFormat): boolean {
  return format.draw.level === 'athlete' && format.draw.method !== 'none'
}

export function usesEntryDraw(format: TournamentFormat): boolean {
  return format.draw.level === 'entry' && format.draw.method !== 'none'
}

export function drawIsNone(format: TournamentFormat): boolean {
  return format.draw.method === 'none'
}

/**
 * Physical / assigned zone for a competitor given start zone and tour number.
 * Supports swap_pairs (2 zones), cycle, fixed, redraw_each_tour (returns start).
 */
export function zoneFor(
  format: TournamentFormat,
  startZone: string | null | undefined,
  tourNumber: number,
): string | null {
  if (!startZone) return null
  const codes = zoneCodes(format)
  const startIndex = codes.indexOf(startZone)
  if (startIndex < 0) return startZone

  switch (format.structure.zoneRotation) {
    case 'fixed':
      return startZone
    case 'redraw_each_tour':
      return startZone
    case 'swap_pairs': {
      if (codes.length !== 2) return startZone
      const tours = format.structure.tours
      const firstTour = tours[0]?.number ?? 1
      if (tourNumber === firstTour) return startZone
      return codes[1 - startIndex]!
    }
    case 'cycle': {
      const tours = format.structure.tours
      const tourIndex = Math.max(
        0,
        tours.findIndex((t) => t.number === tourNumber),
      )
      return codes[(startIndex + tourIndex) % codes.length]!
    }
    default:
      return startZone
  }
}

export function oppositeZone(format: TournamentFormat, zone: string): string | null {
  const codes = zoneCodes(format)
  if (codes.length !== 2) return null
  const idx = codes.indexOf(zone)
  if (idx < 0) return null
  return codes[1 - idx]!
}

export function daysCount(format: TournamentFormat): number {
  return Math.max(1, ...format.structure.tours.map((t) => t.day))
}

export function toursOnDay(format: TournamentFormat, day: number) {
  return format.structure.tours.filter((t) => t.day === day)
}

/** Tours grouped by calendar day (1..daysCount). Empty days omitted. */
export function toursByDay(format: TournamentFormat): { day: number; tours: TournamentFormat['structure']['tours'] }[] {
  const total = daysCount(format)
  const groups: { day: number; tours: TournamentFormat['structure']['tours'] }[] = []
  for (let day = 1; day <= total; day += 1) {
    const tours = toursOnDay(format, day)
    if (tours.length > 0) groups.push({ day, tours })
  }
  return groups
}

export function speciesEnabled(format: TournamentFormat): boolean {
  return format.catch.species.enabled
}

export function countedSpecies(format: TournamentFormat): string[] | null {
  if (!format.catch.species.enabled) return null
  if (format.catch.species.counted.length === 0) return format.catch.species.list
  return format.catch.species.counted
}

/** Filter catches that count toward score (species, bag, min weight, counted flag). */
export function scoringCatches<T extends {
  weight_grams: number
  species?: string | null
  counted?: boolean
}>(format: TournamentFormat, catches: T[]): T[] {
  const minW = format.catch.minFishWeightG
  const allowed = countedSpecies(format)
  return catches.filter((c) => {
    if (c.counted === false) return false
    if (minW != null && c.weight_grams < minW) return false
    if (allowed && allowed.length > 0) {
      if (!c.species || !allowed.includes(c.species)) return false
    }
    return true
  })
}

export function defaultMapMode(format: TournamentFormat): 'schematic' | 'geo' {
  return format.setup.mapMode
}

export function showSpectatorRulesHint(format: TournamentFormat): boolean {
  return format.setup.spectatorRulesHint
}

export function rosterConstraints(format: TournamentFormat) {
  return format.participants.roster
}

export function formatSummary(format: TournamentFormat): string {
  const tours = format.structure.tours.map((t) => `${t.number}×${t.minis}`).join(', ')
  const zones = zoneCodes(format).join('/')
  const roster = `${format.participants.roster.minAthletes}–${format.participants.roster.maxAthletes}`
  return `${legacyEngine(format)} · туры ${tours} · зоны ${zones} · состав ${roster}`
}
