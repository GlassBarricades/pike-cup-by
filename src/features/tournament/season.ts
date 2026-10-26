import { useQuery } from '@tanstack/react-query'
import { fetchCatches, fetchEntries, fetchMiniTours, fetchTournaments } from './api'
import { computeStandings } from './scoring'
import type { SeasonBundle } from './spectator'

export function useSeasonDigest() {
  return useQuery({
    queryKey: ['v2', 'season-digest'],
    staleTime: 60_000,
    queryFn: async (): Promise<SeasonBundle[]> => {
      const tournaments = (await fetchTournaments()).filter((tournament) => tournament.status !== 'draft')
      const bundles = await Promise.all(
        tournaments.map(async (tournament) => {
          const [entries, catches, miniTours] = await Promise.all([
            fetchEntries(tournament.id),
            fetchCatches(tournament.id),
            fetchMiniTours(tournament.id),
          ])
          return {
            tournament,
            entries,
            catches,
            miniTours,
            standings: computeStandings(entries, catches, miniTours, {
              zeroPlaceIsGroupSizePlusOne: tournament.zero_place_is_group_size_plus_one,
            }),
          }
        }),
      )
      return bundles.sort((a, b) => b.tournament.event_date.localeCompare(a.tournament.event_date))
    },
  })
}
