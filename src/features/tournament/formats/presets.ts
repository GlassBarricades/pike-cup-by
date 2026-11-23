import type { TournamentFormat } from './types'
import { upgradeV1ToV2 } from './upgrade'

/** Current PikeCup behaviour as v1 seed, upgraded to v2. */
const PIKECUP_V1 = {
  engine: 'pikecup' as const,
  tours: [
    { number: 1, minis: 5 },
    { number: 2, minis: 5 },
  ],
  zones: ['A', 'B'],
  roster: {
    minAthletes: 2,
    maxAthletes: 2,
    captain: false,
    representative: false,
  },
  ranking: {
    group: 'zone_tour' as const,
    zeroPlace: 'group_size_plus_one' as const,
    tieAverage: true,
    separateJuniors: false,
  },
  tiebreakers: ['total_weight' as const, 'last_tour_weight' as const],
  standings: ['team' as const],
  draw: 'pikecup_slips' as const,
}

/**
 * Individually-team BOOR (shore spinning):
 * 2 tours × 3 minis, zones A/B, catch per athlete, team + personal.
 */
const BOOR_V1 = {
  engine: 'individual' as const,
  tours: [
    { number: 1, minis: 3 },
    { number: 2, minis: 3 },
  ],
  zones: ['A', 'B'],
  roster: {
    minAthletes: 2,
    maxAthletes: 2,
    captain: true,
    representative: true,
  },
  ranking: {
    group: 'zone_tour' as const,
    zeroPlace: 'group_size_plus_one' as const,
    tieAverage: true,
    separateJuniors: false,
  },
  tiebreakers: ['total_weight' as const, 'best_tour_weight' as const],
  standings: ['team' as const, 'individual' as const],
  draw: 'per_athlete_sectors' as const,
}

export const PIKECUP_FORMAT: TournamentFormat = upgradeV1ToV2(PIKECUP_V1)

export const BOOR_INDIVIDUAL_TEAM_FORMAT: TournamentFormat = upgradeV1ToV2(BOOR_V1)

export const FORMAT_PRESETS = [
  { id: 'pikecup', label: 'PikeCup', format: PIKECUP_FORMAT },
  { id: 'boor_individual', label: 'Западный Кордон (БООР)', format: BOOR_INDIVIDUAL_TEAM_FORMAT },
] as const

export type FormatPresetId = (typeof FORMAT_PRESETS)[number]['id']

export function cloneFormat(format: TournamentFormat): TournamentFormat {
  return structuredClone(format)
}
