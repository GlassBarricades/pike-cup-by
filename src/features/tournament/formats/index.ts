import {
  catchUnit,
  fishingKeys as fishingKeysCap,
  isAthleteCatch,
  isEntryCatch,
  legacyEngine,
  totalMinis as totalMinisCap,
  tourNumbers as tourNumbersCap,
  zeroPlacePlusOne as zeroPlacePlusOneCap,
  zoneCodes,
} from './capabilities'
import { BOOR_INDIVIDUAL_TEAM_FORMAT, PIKECUP_FORMAT } from './presets'
import { tournamentFormatSchema, type TournamentFormat } from './types'
import { tryUpgradeFormat, upgradeFormat } from './upgrade'

export type {
  TournamentFormat,
  TournamentFormatV1,
  FormatEngine,
  RosterRole,
  Tiebreaker,
  FormatTiebreaker,
  FormatZone,
  FormatTour,
  CatchUnit,
  ParticipantsMode,
  ZoneRotation,
} from './types'
export {
  PIKECUP_FORMAT,
  BOOR_INDIVIDUAL_TEAM_FORMAT,
  FORMAT_PRESETS,
  cloneFormat,
  type FormatPresetId,
} from './presets'
export { tournamentFormatSchema, tournamentFormatV1Schema } from './types'
export { upgradeFormat, upgradeV1ToV2, tryUpgradeFormat } from './upgrade'
export * from './capabilities'
export { generateScheduleFromFormat, generatedToSeedRows } from './scheduleFromFormat'
export type { GeneratedScheduleRow } from './scheduleFromFormat'

/**
 * Parse unknown format JSON into v2. Invalid → PikeCup fallback (legacy behaviour)
 * for non-UI call sites; prefer parseFormatStrict in editors.
 */
export function parseFormat(raw: unknown): TournamentFormat {
  const result = tryUpgradeFormat(raw)
  if (result.ok) return result.format
  return PIKECUP_FORMAT
}

export function parseFormatStrict(raw: unknown): TournamentFormat {
  return upgradeFormat(raw)
}

export function getFormat(tournament: { format?: unknown } | null | undefined): TournamentFormat {
  if (!tournament) return PIKECUP_FORMAT
  return parseFormat(tournament.format)
}

export function defaultFormatForLeague(league: {
  slug?: string
  default_format?: unknown
  default_preset_id?: string | null
} | null): TournamentFormat {
  if (!league) return BOOR_INDIVIDUAL_TEAM_FORMAT
  if (league.default_format != null) return parseFormat(league.default_format)
  if (league.slug === 'pikecup') return PIKECUP_FORMAT
  return BOOR_INDIVIDUAL_TEAM_FORMAT
}

/** @deprecated Prefer isEntryCatch */
export function isPikecup(format: TournamentFormat): boolean {
  return isEntryCatch(format)
}

/** @deprecated Prefer isAthleteCatch */
export function isIndividual(format: TournamentFormat): boolean {
  return isAthleteCatch(format)
}

export function fishingKeys(format: TournamentFormat): string[] {
  return fishingKeysCap(format)
}

export function totalMinis(format: TournamentFormat): number {
  return totalMinisCap(format)
}

export function tourNumbers(format: TournamentFormat): number[] {
  return tourNumbersCap(format)
}

export function zeroPlacePlusOne(format: TournamentFormat): boolean {
  return zeroPlacePlusOneCap(format)
}

/** Legacy draw enum derived from v2 draw settings (for DrawRouter / slip packs). */
export type LegacyDrawMode = 'pikecup_slips' | 'per_athlete_sectors' | 'none'

export function legacyDrawMode(format: TournamentFormat): LegacyDrawMode {
  if (format.draw.method === 'none') return 'none'
  if (format.draw.level === 'entry') return 'pikecup_slips'
  return 'per_athlete_sectors'
}

/** Zones as string codes (legacy helpers). */
export function formatZoneCodes(format: TournamentFormat): string[] {
  return zoneCodes(format)
}

/** Validate without fallback. */
export function safeParseFormat(raw: unknown) {
  return tournamentFormatSchema.safeParse(
    raw && typeof raw === 'object' && (raw as { version?: number }).version === 2
      ? raw
      : (() => {
          try {
            return upgradeFormat(raw)
          } catch {
            return raw
          }
        })(),
  )
}

export { catchUnit, legacyEngine, zoneCodes }
