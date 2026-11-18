import { useQuery } from '@tanstack/react-query'
import { fetchCatches, fetchEntriesForStandings, fetchMiniTours, fetchTournaments } from './api'
import { computeStandings } from './scoring'
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
          const [entries, catches, miniTours] = await Promise.all([
            fetchEntriesForStandings(tournament.id),
            fetchCatches(tournament.id),
            fetchMiniTours(tournament.id),
          ])
          return {
            tournament,
            entries,
            catches,
            miniTours,
            standings: computeStandings(entries, catches, miniTours, {
              zeroPlaceIsGroupSizePlusOne:
                tournament.format?.ranking?.zeroPlace !== 'group_size' &&
                tournament.zero_place_is_group_size_plus_one !== false,
            }),
          }
        }),
      )
      return bundles.sort((a, b) => b.tournament.event_date.localeCompare(a.tournament.event_date))
    },
  })
}
