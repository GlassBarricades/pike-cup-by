/**
 * Unified scoring facade.
 * Routes by format.participants.catchUnit until fully merged into one pipeline.
 * Callers should prefer computeTournamentResults over engine-specific imports.
 */
import { isAthleteCatch, isEntryCatch, scoringCatches, zeroPlacePlusOne } from '../capabilities'
import { computeIndividualResults, type IndividualResults } from '../individual/scoring'
import { computeStandings, type StandingRow } from '../pikecup/scoring'
import type { TournamentFormat } from '../types'
import type { AthleteDraw, CatchRow, MiniTour, TournamentEntry } from '../../types'

export type UnifiedResults = {
  catchUnit: 'entry' | 'athlete'
  /** Legacy engine tag for UI still branching on results.engine */
  engine: 'pikecup' | 'individual'
  teams: StandingRow[] | IndividualResults['teams']
  athletes: IndividualResults['athletes']
  juniors: IndividualResults['juniors']
}

export function computeTournamentResults(input: {
  format: TournamentFormat
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  draws?: AthleteDraw[]
}): UnifiedResults {
  const { format } = input
  const catches = scoringCatches(format, input.catches)

  if (isAthleteCatch(format)) {
    const results = computeIndividualResults(
      format,
      input.entries,
      catches,
      input.miniTours,
      input.draws ?? [],
    )
    return {
      catchUnit: 'athlete',
      engine: 'individual',
      teams: results.teams,
      athletes: results.athletes,
      juniors: results.juniors,
    }
  }

  if (!isEntryCatch(format)) {
    // fallback
  }

  const teams = computeStandings(input.entries, catches, input.miniTours, {
    zeroPlaceIsGroupSizePlusOne: zeroPlacePlusOne(format),
  })
  return {
    catchUnit: 'entry',
    engine: 'pikecup',
    teams,
    athletes: [],
    juniors: [],
  }
}

/** Team standing row shape usable for season / team history (entry catch or mapped). */
export type TeamHistoryStanding = {
  entryId: string
  finalPlace: number
  placeSum: number
  totalWeight: number
}

export function teamHistoryFromResults(results: UnifiedResults): TeamHistoryStanding[] {
  return results.teams.map((row) => ({
    entryId: row.entryId,
    finalPlace: row.finalPlace,
    placeSum: row.placeSum,
    totalWeight: row.totalWeight,
  }))
}
