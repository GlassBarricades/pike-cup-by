/** Реэкспорт: движок PikeCup + общий formatPlace. */
export {
  computeStandings,
  type StandingRow,
  type StandingsOptions,
} from './formats/pikecup/scoring'
export { computeResults, computeStandingsCompat, type TournamentResults } from './formats/results'
export type {
  AthleteStandingRow,
  IndividualResults,
  TeamStandingRow,
  TourResult,
} from './formats/individual/scoring'

/** Для отображения: 14.5 → «14,5», 11 → «11» (как в протоколе). */
export function formatPlace(place: number): string {
  return Number.isInteger(place) ? String(place) : place.toFixed(1).replace('.', ',')
}
