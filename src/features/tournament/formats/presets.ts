import type { TournamentFormat } from './types'

/** Текущее поведение PikeCup: 2×5, команда из 2, бумажки, место = сумма мест по зонам. */
export const PIKECUP_FORMAT: TournamentFormat = {
  engine: 'pikecup',
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
    group: 'zone_tour',
    zeroPlace: 'group_size_plus_one',
    tieAverage: true,
    separateJuniors: false,
  },
  tiebreakers: ['total_weight', 'last_tour_weight'],
  standings: ['team'],
  draw: 'pikecup_slips',
}

/**
 * Индивидуально-командный формат БООР (спиннинг с берега):
 * 2 тура × 3 мини-тура, зоны A/B, улов на спортсмена, командный + личный зачёт.
 */
export const BOOR_INDIVIDUAL_TEAM_FORMAT: TournamentFormat = {
  engine: 'individual',
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
    group: 'zone_tour',
    zeroPlace: 'group_size_plus_one',
    tieAverage: true,
    separateJuniors: false,
  },
  tiebreakers: ['total_weight', 'best_tour_weight'],
  standings: ['team', 'individual'],
  draw: 'per_athlete_sectors',
}

export const FORMAT_PRESETS = [
  { id: 'pikecup', label: 'PikeCup', format: PIKECUP_FORMAT },
  { id: 'boor_individual', label: 'БООР: личный + командный', format: BOOR_INDIVIDUAL_TEAM_FORMAT },
] as const

export type FormatPresetId = (typeof FORMAT_PRESETS)[number]['id']
