import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { Text } from '@mantine/core'
import { Outlet, useParams } from 'react-router-dom'
import {
  useCatches,
  useEntries,
  useMiniTours,
  useSegments,
  useTournament,
  useTournamentRealtime,
} from '../../features/tournament/hooks'
import { buildRace, projectStory, type DayStory, type RaceData } from '../../features/tournament/spectator'
import type { CatchRow, MiniTour, ScheduleSegment, Tournament, TournamentEntry } from '../../features/tournament/types'
import { useNow } from '../../features/tournament/useNow'

export type V2TournamentValue = {
  tournament: Tournament
  entries: TournamentEntry[]
  catches: CatchRow[]
  miniTours: MiniTour[]
  segments: ScheduleSegment[]
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
  const entriesQuery = useEntries(id)
  const catchesQuery = useCatches(id)
  const miniQuery = useMiniTours(id)
  const segmentsQuery = useSegments(id)
  useTournamentRealtime(id)
  const now = useNow(5_000)
  const tournament = tournamentQuery.data
  const entries = entriesQuery.data ?? []
  const catches = catchesQuery.data ?? []
  const miniTours = miniQuery.data ?? []
  const segments = segmentsQuery.data ?? []

  const race = useMemo(
    () => (tournament ? buildRace(tournament, entries, catches, miniTours, segments) : null),
    [tournament, entries, catches, miniTours, segments],
  )
  const story = useMemo(
    () => (tournament && race ? projectStory(race, tournament, entries, catches, miniTours, segments, now) : null),
    [tournament, race, entries, catches, miniTours, segments, now],
  )

  if (tournamentQuery.isLoading || (id && (entriesQuery.isLoading || catchesQuery.isLoading || miniQuery.isLoading || segmentsQuery.isLoading))) {
    return <Text c="dimmed">Загрузка…</Text>
  }
  if (!tournament || !race || !story) return <Text>Турнир не найден</Text>

  return (
    <V2TournamentContext.Provider value={{ tournament, entries, catches, miniTours, segments, race, story }}>
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
