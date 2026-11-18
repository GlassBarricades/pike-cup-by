import { getFormat, isIndividual, zeroPlacePlusOne, type TournamentFormat } from './index'
import { computeIndividualResults, type IndividualResults } from './individual/scoring'
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

export function computeResults(input: {
  tournament: Pick<Tournament, 'format' | 'zero_place_is_group_size_plus_one'> | TournamentFormat
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  draws?: AthleteDraw[]
}): TournamentResults {
  const format =
    'engine' in input.tournament && 'tours' in input.tournament
      ? (input.tournament as TournamentFormat)
      : getFormat(input.tournament as { format?: unknown })

  if (isIndividual(format)) {
    const results = computeIndividualResults(
      format,
      input.entries,
      input.catches,
      input.miniTours,
      input.draws ?? [],
    )
    return {
      engine: 'individual',
      teams: results.teams,
      athletes: results.athletes,
      juniors: results.juniors,
    }
  }

  const teams = computeStandings(input.entries, input.catches, input.miniTours, {
    zeroPlaceIsGroupSizePlusOne: zeroPlacePlusOne(format),
  })
  return { engine: 'pikecup', teams, athletes: [], juniors: [] }
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
