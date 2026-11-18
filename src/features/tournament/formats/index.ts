import { BOOR_INDIVIDUAL_TEAM_FORMAT, PIKECUP_FORMAT } from './presets'
import { tournamentFormatSchema, type TournamentFormat } from './types'

export type { TournamentFormat, FormatEngine, RosterRole, Tiebreaker } from './types'
export {
  PIKECUP_FORMAT,
  BOOR_INDIVIDUAL_TEAM_FORMAT,
  FORMAT_PRESETS,
  type FormatPresetId,
} from './presets'
export { tournamentFormatSchema } from './types'

export function parseFormat(raw: unknown): TournamentFormat {
  const parsed = tournamentFormatSchema.safeParse(raw)
  if (parsed.success) return parsed.data
  return PIKECUP_FORMAT
}

export function getFormat(tournament: { format?: unknown } | null | undefined): TournamentFormat {
  if (!tournament) return PIKECUP_FORMAT
  return parseFormat(tournament.format)
}

export function defaultFormatForLeague(league: { slug?: string; default_format?: unknown } | null): TournamentFormat {
  if (!league) return BOOR_INDIVIDUAL_TEAM_FORMAT
  if (league.default_format != null) return parseFormat(league.default_format)
  if (league.slug === 'pikecup') return PIKECUP_FORMAT
  return BOOR_INDIVIDUAL_TEAM_FORMAT
}

export function isPikecup(format: TournamentFormat): boolean {
  return format.engine === 'pikecup'
}

export function isIndividual(format: TournamentFormat): boolean {
  return format.engine === 'individual'
}

/** Ключи fishing-сегментов по формату: tour1_mt1 … */
export function fishingKeys(format: TournamentFormat): string[] {
  const keys: string[] = []
  for (const tour of format.tours) {
    for (let mini = 1; mini <= tour.minis; mini += 1) {
      keys.push(`tour${tour.number}_mt${mini}`)
    }
  }
  return keys
}

export function totalMinis(format: TournamentFormat): number {
  return format.tours.reduce((sum, tour) => sum + tour.minis, 0)
}

export function tourNumbers(format: TournamentFormat): number[] {
  return format.tours.map((tour) => tour.number)
}

export function zeroPlacePlusOne(format: TournamentFormat): boolean {
  return format.ranking.zeroPlace === 'group_size_plus_one'
}
