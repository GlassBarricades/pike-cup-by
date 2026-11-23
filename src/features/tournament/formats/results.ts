import { getFormat, type TournamentFormat } from './index'
import { computeTournamentResults } from './engine'
import type { IndividualResults } from './individual/scoring'
import { computeStandings, type StandingRow } from './pikecup/scoring'
import type { AthleteDraw, CatchRow, MiniTour, Tournament, TournamentEntry } from '../types'

export type { StandingRow, IndividualResults }
export type { AthleteStandingRow, TeamStandingRow, TourResult } from './individual/scoring'

export type TournamentResults =
  | { engine: 'pikecup'; teams: StandingRow[]; athletes: []; juniors: [] }
  | {
      engine: 'individual'
      teams: IndividualResults['teams']
      athletes: IndividualResults['athletes']
      juniors: IndividualResults['juniors']
    }

function resolveFormat(
  tournament: Pick<Tournament, 'format' | 'zero_place_is_group_size_plus_one'> | TournamentFormat,
): TournamentFormat {
  const raw = tournament as Record<string, unknown>
  const looksLikeFormat =
    raw &&
    typeof raw === 'object' &&
    ('version' in raw || 'structure' in raw || ('engine' in raw && 'tours' in raw))
  if (looksLikeFormat) {
    return raw.version === 2
      ? (raw as unknown as TournamentFormat)
      : getFormat({ format: raw })
  }
  return getFormat(raw as { format?: unknown })
}

export function computeResults(input: {
  tournament: Pick<Tournament, 'format' | 'zero_place_is_group_size_plus_one'> | TournamentFormat
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  draws?: AthleteDraw[]
}): TournamentResults {
  const format = resolveFormat(input.tournament)
  const unified = computeTournamentResults({
    format,
    entries: input.entries,
    catches: input.catches,
    miniTours: input.miniTours,
    draws: input.draws,
  })
  if (unified.engine === 'individual') {
    return {
      engine: 'individual',
      teams: unified.teams as IndividualResults['teams'],
      athletes: unified.athletes,
      juniors: unified.juniors,
    }
  }
  return {
    engine: 'pikecup',
    teams: unified.teams as StandingRow[],
    athletes: [],
    juniors: [],
  }
}

/** Обратная совместимость: только командный PikeCup-скоринг. */
export function computeStandingsCompat(
  entries: TournamentEntry[],
  catches: CatchRow[],
  miniTours: MiniTour[],
  options?: { zeroPlaceIsGroupSizePlusOne?: boolean },
): StandingRow[] {
  return computeStandings(entries, catches, miniTours, options)
}
