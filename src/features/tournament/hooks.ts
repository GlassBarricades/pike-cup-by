import { useMemo } from 'react'
import { useQuery, type QueryClient } from '@tanstack/react-query'
import {
  fetchActiveTournament,
  fetchActiveMemberships,
  fetchAthleteDraws,
  fetchAthleteById,
  fetchAthleteMembershipHistory,
  fetchAthleteTournamentAppearances,
  fetchAthletesWithTeams,
  fetchCatchRevisions,
  fetchCatches,
  fetchDrawSlips,
  fetchEntries,
  fetchJudgeCandidates,
  fetchLeagueById,
  fetchLeagueBySlug,
  fetchLeagues,
  fetchMiniTours,
  fetchProfilesByIds,
  fetchSegments,
  fetchSegmentsForTournaments,
  fetchTeamById,
  fetchTeamMembershipHistory,
  fetchTeamNameHistory,
  fetchTeamTournamentAppearances,
  fetchTeams,
  fetchEntriesForStandings,
  fetchTournamentById,
  fetchTournamentRulesContent,
  fetchTournaments,
  fetchMyZoneAssignments,
  fetchZoneJudges,
} from './api'
import { pickCurrentTournament } from './date'
import { getCompetitionStage } from './schedule'
import { useNow } from './useNow'
import { computeStandings, type StandingRow } from './scoring'
import type {
  ActiveTournamentScope,
  Tournament,
  TournamentEntry,
  TournamentListFilter,
} from './types'

export const DEFAULT_LEAGUE_SLUG = 'pikecup'

export const tournamentKeys = {
  list: (filter?: TournamentListFilter) =>
    ['tournaments', filter?.leagueId ?? (filter?.festivalsOnly ? 'festivals' : 'all')] as const,
  leagues: ['leagues'] as const,
  leagueSlug: (slug: string) => ['league', 'slug', slug] as const,
  leagueId: (id: string) => ['league', id] as const,
  active: (scope?: ActiveTournamentScope) =>
    [
      'tournament',
      'active',
      scope?.kind === 'league' ? scope.leagueId : scope?.kind === 'festivals' ? 'festivals' : 'any',
    ] as const,
  byId: (id: string) => ['tournament', id] as const,
  rules: (id: string) => ['tournament', id, 'rules'] as const,
  segments: (id: string) => ['tournament', id, 'segments'] as const,
  miniTours: (id: string) => ['tournament', id, 'miniTours'] as const,
  entries: (id: string) => ['tournament', id, 'entries'] as const,
  catches: (id: string) => ['tournament', id, 'catches'] as const,
  cheerCounts: (id: string) => ['tournament', id, 'cheerCounts'] as const,
  revisions: (id: string) => ['tournament', id, 'revisions'] as const,
  zoneJudges: (id: string) => ['tournament', id, 'zoneJudges'] as const,
  myZoneAssignments: (userId: string) => ['zoneJudges', 'mine', userId] as const,
  athleteDraws: (id: string) => ['tournament', id, 'athleteDraws'] as const,
  drawSlips: (tournamentId: string) => ['tournament', tournamentId, 'drawSlips'] as const,
  judgeCandidates: ['judgeCandidates'] as const,
  teams: ['teams'] as const,
  athletes: ['athletes'] as const,
}

/**
 * Почти статичные данные: не протухают по времени.
 * Invalidate только из staff/judge мутаций (или F5).
 */
const STALE_UNTIL_MUTATION = Number.POSITIVE_INFINITY

/** byId = ['tournament', id] — без exact матчит ещё catches/entries/segments/... */
export function invalidateTournamentCard(queryClient: QueryClient, tournamentId: string) {
  return queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournamentId), exact: true })
}

/** Списки и active с любым scope (префиксный invalidate). */
export function invalidateTournamentLists(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
    queryClient.invalidateQueries({ queryKey: ['tournament', 'active'] }),
    queryClient.invalidateQueries({ queryKey: tournamentKeys.leagues }),
  ])
}

export function useLeagues(activeOnly = true) {
  return useQuery({
    queryKey: [...tournamentKeys.leagues, activeOnly ? 'active' : 'all'] as const,
    queryFn: () => fetchLeagues(activeOnly),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useLeagueBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.leagueSlug(slug ?? ''),
    queryFn: () => fetchLeagueBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useLeague(leagueId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.leagueId(leagueId ?? ''),
    queryFn: () => fetchLeagueById(leagueId!),
    enabled: Boolean(leagueId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

/** Лига PikeCup (seed) — для сезона / home по умолчанию. */
export function useDefaultLeague() {
  return useLeagueBySlug(DEFAULT_LEAGUE_SLUG)
}

export function useTournaments(filter?: TournamentListFilter, enabled = true) {
  return useQuery({
    queryKey: tournamentKeys.list(filter),
    queryFn: () => fetchTournaments(filter),
    enabled,
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useTournament(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.byId(tournamentId ?? ''),
    queryFn: () => fetchTournamentById(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useTournamentRules(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.rules(tournamentId ?? ''),
    queryFn: () => fetchTournamentRulesContent(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useActiveTournament(scope: ActiveTournamentScope = { kind: 'any' }) {
  return useQuery({
    queryKey: tournamentKeys.active(scope),
    queryFn: () => fetchActiveTournament(scope),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useCurrentAndArchive(filter?: TournamentListFilter) {
  const query = useTournaments(filter)
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
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useSegmentsForTournaments(tournamentIds: string[]) {
  const ids = useMemo(() => [...tournamentIds].sort(), [tournamentIds])
  return useQuery({
    queryKey: [...tournamentKeys.list(), 'segments', ids] as const,
    queryFn: () => fetchSegmentsForTournaments(ids),
    enabled: ids.length > 0,
    staleTime: STALE_UNTIL_MUTATION,
  })
}

function useActiveStage() {
  const { data: tournament, isSuccess: tournamentReady } = useActiveTournament()
  const { data: segments, isSuccess: segmentsReady } = useSegments(tournament?.id)
  const now = useNow(5_000)
  if (!tournamentReady || !tournament || !segmentsReady) return null
  return { id: tournament.id, stage: getCompetitionStage(tournament, segments, now) }
}

/** Пункт LIVE только пока по расписанию идёт соревнование, а не пока в базе висит status=live. */
export function useShowLiveNav() {
  return useActiveStage()?.stage === 'live'
}

/** Пункт «Разбор» для активного турнира, когда день уже закончился. */
export function useReviewNavTo() {
  const active = useActiveStage()
  if (!active || active.stage !== 'completed') return null
  return `/live/t/${active.id}/review`
}

export function useMiniTours(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.miniTours(tournamentId ?? ''),
    queryFn: () => fetchMiniTours(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useEntries(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.entries(tournamentId ?? ''),
    queryFn: () => fetchEntries(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useCatches(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.catches(tournamentId ?? ''),
    queryFn: () => fetchCatches(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: 0,
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
            fetchEntriesForStandings(tournament.id),
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

export function useDrawSlips(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.drawSlips(tournamentId ?? ''),
    queryFn: () => fetchDrawSlips(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useZoneJudges(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.zoneJudges(tournamentId ?? ''),
    queryFn: () => fetchZoneJudges(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useMyZoneAssignments(userId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.myZoneAssignments(userId ?? ''),
    queryFn: () => fetchMyZoneAssignments(userId!),
    enabled: Boolean(userId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useAthleteDraws(tournamentId: string | undefined) {
  return useQuery({
    queryKey: tournamentKeys.athleteDraws(tournamentId ?? ''),
    queryFn: () => fetchAthleteDraws(tournamentId!),
    enabled: Boolean(tournamentId),
    staleTime: STALE_UNTIL_MUTATION,
  })
}

export function useJudgeCandidates() {
  return useQuery({
    queryKey: tournamentKeys.judgeCandidates,
    queryFn: fetchJudgeCandidates,
  })
}

export function useCatchRevisions(tournamentId: string | undefined, entryIds: string[]) {
  const ids = entryIds.slice().sort().join(',')
  return useQuery({
    queryKey: [...tournamentKeys.revisions(tournamentId ?? ''), ids],
    queryFn: () => fetchCatchRevisions(ids ? ids.split(',') : []),
    enabled: Boolean(tournamentId) && entryIds.length > 0,
  })
}

export function useCatchAuthors(catches: { created_by: string | null }[]) {
  const ids = useMemo(
    () => [...new Set(catches.map((c) => c.created_by).filter((id): id is string => Boolean(id)))],
    [catches],
  )

  return useQuery({
    queryKey: ['catchAuthors', ids.slice().sort().join(',')],
    queryFn: () => fetchProfilesByIds(ids),
    enabled: ids.length > 0,
  })
}

/** Ручное обновление зрителей/пульта: уловы + карточка; дельта новых уловов с прошлого refresh. */
export { useCatchRefresh as useRefreshTournament } from './catchRefresh'
