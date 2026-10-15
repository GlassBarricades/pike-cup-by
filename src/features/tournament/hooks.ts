import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import {
  fetchActiveTournament,
  fetchActiveMemberships,
  fetchAthleteById,
  fetchAthleteMembershipHistory,
  fetchAthleteTournamentAppearances,
  fetchAthletesWithTeams,
  fetchCatches,
  fetchEntries,
  fetchMiniTours,
  fetchSegments,
  fetchTeamById,
  fetchTeamMembershipHistory,
  fetchTeamNameHistory,
  fetchTeamTournamentAppearances,
  fetchTeams,
  fetchTournamentById,
  fetchTournaments,
} from './api'
import { pickCurrentTournament } from './date'
import { computeStandings, type StandingRow } from './scoring'
import type { Tournament, TournamentEntry } from './types'

export const tournamentKeys = {
  list: ['tournaments'] as const,
  active: ['tournament', 'active'] as const,
  byId: (id: string) => ['tournament', id] as const,
  segments: (id: string) => ['tournament', id, 'segments'] as const,
  miniTours: (id: string) => ['tournament', id, 'miniTours'] as const,
  entries: (id: string) => ['tournament', id, 'entries'] as const,
  catches: (id: string) => ['tournament', id, 'catches'] as const,
  teams: ['teams'] as const,
  athletes: ['athletes'] as const,
}

export function useTournaments() {
  return useQuery({
    queryKey: tournamentKeys.list,
    queryFn: fetchTournaments,
  })
}

export function useTournament(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.byId(tournamentId ?? ''),
    queryFn: () => fetchTournamentById(tournamentId!),
    enabled: Boolean(tournamentId),
  })
}

export function useActiveTournament() {
  return useQuery({
    queryKey: tournamentKeys.active,
    queryFn: fetchActiveTournament,
  })
}

export function useCurrentAndArchive() {
  const query = useTournaments()
  const current = useMemo(
    () => (query.data ? pickCurrentTournament(query.data) : null),
    [query.data],
  )
  const archive = useMemo(() => {
    if (!query.data) return []
    return query.data.filter((t) => t.id !== current?.id)
  }, [query.data, current?.id])
  return { ...query, current, archive }
}

export function useSegments(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.segments(tournamentId ?? ''),
    queryFn: () => fetchSegments(tournamentId!),
    enabled: Boolean(tournamentId),
  })
}

export function useMiniTours(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.miniTours(tournamentId ?? ''),
    queryFn: () => fetchMiniTours(tournamentId!),
    enabled: Boolean(tournamentId),
  })
}

export function useEntries(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.entries(tournamentId ?? ''),
    queryFn: () => fetchEntries(tournamentId!),
    enabled: Boolean(tournamentId),
  })
}

export function useCatches(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.catches(tournamentId ?? ''),
    queryFn: () => fetchCatches(tournamentId!),
    enabled: Boolean(tournamentId),
    refetchInterval: 10_000,
  })
}

export function useTeamsCatalog() {
  return useQuery({
    queryKey: tournamentKeys.teams,
    queryFn: fetchTeams,
  })
}

export function useAthletesCatalog() {
  return useQuery({
    queryKey: tournamentKeys.athletes,
    queryFn: fetchAthletesWithTeams,
  })
}

export function useAthlete(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['athlete', athleteId],
    queryFn: () => fetchAthleteById(athleteId!),
    enabled: Boolean(athleteId),
  })
}

export function useTeam(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => fetchTeamById(teamId!),
    enabled: Boolean(teamId),
  })
}

export function useAthleteHistory(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['athlete', athleteId, 'memberships'],
    queryFn: () => fetchAthleteMembershipHistory(athleteId!),
    enabled: Boolean(athleteId),
  })
}

export function useAthleteTournaments(athleteId: string | undefined) {
  return useQuery({
    queryKey: ['athlete', athleteId, 'tournaments'],
    queryFn: () => fetchAthleteTournamentAppearances(athleteId!),
    enabled: Boolean(athleteId),
  })
}

export function useTeamHistory(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId, 'memberships'],
    queryFn: () => fetchTeamMembershipHistory(teamId!),
    enabled: Boolean(teamId),
  })
}

export function useTeamNameHistory(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId, 'name-history'],
    queryFn: () => fetchTeamNameHistory(teamId!),
    enabled: Boolean(teamId),
  })
}

export function useTeamTournaments(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId, 'tournaments'],
    queryFn: () => fetchTeamTournamentAppearances(teamId!),
    enabled: Boolean(teamId),
  })
}

export type TeamCompetitionResult = {
  tournament: Tournament
  entry: TournamentEntry
  standing: StandingRow | null
}

export function useTeamCompetitionResults(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId, 'results'],
    queryFn: async (): Promise<TeamCompetitionResult[]> => {
      const appearances = await fetchTeamTournamentAppearances(teamId!)
      const byTournament = new Map<string, { tournament: Tournament; entry: TournamentEntry }>()
      for (const { entry, tournament } of appearances) {
        if (!tournament) continue
        byTournament.set(tournament.id, { tournament, entry })
      }

      const results = await Promise.all(
        [...byTournament.values()].map(async ({ tournament, entry }) => {
          const [entries, catches, miniTours] = await Promise.all([
            fetchEntries(tournament.id),
            fetchCatches(tournament.id),
            fetchMiniTours(tournament.id),
          ])
          const standings = computeStandings(entries, catches, miniTours, {
            zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one,
          })
          return {
            tournament,
            entry,
            standing: standings.find((s) => s.entryId === entry.id) ?? null,
          }
        }),
      )

      return results.sort((a, b) => b.tournament.event_date.localeCompare(a.tournament.event_date))
    },
    enabled: Boolean(teamId),
  })
}

export function useTeamMembers(teamId: string | undefined) {
  return useQuery({
    queryKey: ['team', teamId, 'members'],
    queryFn: () => fetchActiveMemberships(teamId!),
    enabled: Boolean(teamId),
  })
}

export function useTournamentRealtime(tournamentId: string | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tournamentId) return

    const channel = supabase
      .channel(`live-${tournamentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'catches' },
        () => {
          void queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(tournamentId) })
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tournaments', filter: `id=eq.${tournamentId}` },
        () => {
          void queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
          void queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournamentId) })
          void queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [tournamentId, queryClient])
}
