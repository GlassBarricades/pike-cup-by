import { useQuery } from '@tanstack/react-query'
import {
  fetchAthleteDraws,
  fetchCatches,
  fetchEntriesForStandings,
  fetchMiniTours,
  fetchTournaments,
} from './api'
import { isAthleteCatch, getFormat } from './formats'
import { computeResults } from './scoring'
import type { SeasonBundle } from './spectator'

export type SeasonDigestOptions = {
  enabled?: boolean
  /** Только этапы этой лиги. Фестивали (league_id null) в сезон не входят. */
  leagueId?: string | null
}

export function useSeasonDigest(options: SeasonDigestOptions | boolean = true) {
  const normalized: SeasonDigestOptions =
    typeof options === 'boolean' ? { enabled: options } : options
  const enabled = normalized.enabled ?? true
  const leagueId = normalized.leagueId

  return useQuery({
    queryKey: ['v2', 'season-digest', leagueId ?? 'all-leagues'] as const,
    enabled: enabled && leagueId !== null,
    staleTime: 15 * 60_000,
    queryFn: async (): Promise<SeasonBundle[]> => {
      const tournaments = (
        await fetchTournaments(leagueId ? { leagueId } : undefined)
      ).filter((tournament) => {
        if (tournament.status === 'draft') return false
        // Без явной лиги — только этапы лиг, фестивали в «сезон» не смешиваем
        if (!leagueId && tournament.league_id == null) return false
        return true
      })
      const bundles = await Promise.all(
        tournaments.map(async (tournament) => {
          const format = getFormat(tournament)
          const [entries, catches, miniTours, draws] = await Promise.all([
            fetchEntriesForStandings(tournament.id),
            fetchCatches(tournament.id),
            fetchMiniTours(tournament.id),
            isAthleteCatch(format) ? fetchAthleteDraws(tournament.id) : Promise.resolve([]),
          ])
          const results = computeResults({
            tournament,
            entries,
            catches,
            miniTours,
            draws,
          })
          // SeasonBundle historically expects PikeCup StandingRow[]; map common fields.
          const standings = results.teams.map((row) => ({
            entryId: row.entryId,
            teamId: 'teamId' in row ? row.teamId : null,
            teamName: row.teamName,
            rosterNames: 'rosterNames' in row ? row.rosterNames : ('athleteNames' in row ? row.athleteNames : []),
            startZone: 'startZone' in row ? row.startZone : null,
            zoneAWeight: 'zoneAWeight' in row ? row.zoneAWeight : 0,
            zoneBWeight: 'zoneBWeight' in row ? row.zoneBWeight : 0,
            totalWeight: row.totalWeight,
            zoneAPlace: 'zoneAPlace' in row ? row.zoneAPlace : 0,
            zoneBPlace: 'zoneBPlace' in row ? row.zoneBPlace : 0,
            placeSum: row.placeSum,
            finalPlace: row.finalPlace,
          }))
          return {
            tournament,
            entries,
            catches,
            miniTours,
            standings,
          }
        }),
      )
      return bundles.sort((a, b) => b.tournament.event_date.localeCompare(a.tournament.event_date))
    },
  })
}
