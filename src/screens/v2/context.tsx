import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { Text } from '@mantine/core'
import { Outlet, useParams } from 'react-router-dom'
import { useCheerSync } from '../../features/tournament/cheer'
import { getFormat, isAthleteCatch, usesAthleteDraw } from '../../features/tournament/formats'
import { computeResults, type TournamentResults } from '../../features/tournament/formats/results'
import {
  useAthleteDraws,
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
  useTournament,
} from '../../features/tournament/hooks'
import {
  buildIndividualRace,
  buildRace,
  projectStory,
  type DayStory,
  type RaceData,
} from '../../features/tournament/spectator'
import type {
  AthleteDraw,
  CatchRow,
  MiniTour,
  ScheduleSegment,
  Tournament,
  TournamentEntry,
} from '../../features/tournament/types'
import { useNow } from '../../features/tournament/useNow'

export type V2TournamentValue = {
  tournament: Tournament
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  segments: ScheduleSegment[]
  draws: AthleteDraw[]
  results: TournamentResults
  race: RaceData
  story: DayStory
}

const V2TournamentContext = createContext<V2TournamentValue | null>(null)

export function useV2Tournament() {
  const value = useContext(V2TournamentContext)
  if (!value) throw new Error('Обзор турнира открыт вне макета')
  return value
}

export function V2TournamentProvider({ children }: { children: ReactNode }) {
  const { tournamentId } = useParams()
  const tournamentQuery = useTournament(tournamentId)
  const id = tournamentQuery.data?.id
  const format = tournamentQuery.data ? getFormat(tournamentQuery.data) : null
  const needsDraws = format ? usesAthleteDraw(format) || isAthleteCatch(format) : false
  const entriesQuery = useEntries(id)
  const catchesQuery = useCatches(id)
  const miniQuery = useMiniTours(id)
  const segmentsQuery = useSegments(id)
  const drawsQuery = useAthleteDraws(needsDraws ? id : undefined)
  useCheerSync(id)
  const now = useNow(5_000)
  const tournament = tournamentQuery.data
  const entries = entriesQuery.data ?? []
  const catches = catchesQuery.data ?? []
  const miniTours = miniQuery.data ?? []
  const segments = segmentsQuery.data ?? []
  const draws = drawsQuery.data ?? []

  const results = useMemo(() => {
    if (!tournament) return null
    return computeResults({ tournament, entries, catches, miniTours, draws })
  }, [tournament, entries, catches, miniTours, draws])

  const race = useMemo(() => {
    if (!tournament || !format) return null
    if (isAthleteCatch(format)) {
      return buildIndividualRace(format, tournament, entries, catches, miniTours, segments, draws)
    }
    return buildRace(tournament, entries, catches, miniTours, segments)
  }, [tournament, format, entries, catches, miniTours, segments, draws])

  const story = useMemo(
    () =>
      tournament && race
        ? projectStory(race, tournament, entries, catches, miniTours, segments, now, draws)
        : null,
    [tournament, race, entries, catches, miniTours, segments, now, draws],
  )

  if (
    tournamentQuery.isLoading ||
    (id &&
      (entriesQuery.isLoading ||
        catchesQuery.isLoading ||
        miniQuery.isLoading ||
        segmentsQuery.isLoading ||
        (needsDraws && drawsQuery.isLoading)))
  ) {
    return <Text c="dimmed">Загрузка…</Text>
  }
  if (!tournament || !results || !race || !story) return <Text>Турнир не найден</Text>

  return (
    <V2TournamentContext.Provider
      value={{ tournament, entries, catches, miniTours, segments, draws, results, race, story }}
    >
      {children}
    </V2TournamentContext.Provider>
  )
}

export function V2TournamentOutlet() {
  return (
    <V2TournamentProvider>
      <Outlet />
    </V2TournamentProvider>
  )
}
