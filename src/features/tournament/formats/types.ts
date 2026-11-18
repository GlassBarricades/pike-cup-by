import { z } from 'zod'

export const tournamentFormatSchema = z.object({
  engine: z.enum(['pikecup', 'individual']),
  tours: z
    .array(
      z.object({
        number: z.number().int().min(1).max(9),
        minis: z.number().int().min(1).max(20),
      }),
    )
    .min(1),
  zones: z.array(z.string().min(1)).min(1),
  roster: z.object({
    minAthletes: z.number().int().min(1).max(10),
    maxAthletes: z.number().int().min(1).max(10),
    captain: z.boolean(),
    representative: z.boolean(),
  }),
  ranking: z.object({
    group: z.enum(['zone_tour', 'tour']),
    zeroPlace: z.enum(['group_size', 'group_size_plus_one']),
    tieAverage: z.boolean(),
    /** Две личные таблицы: общий (без юниоров) и юниоры; командный общий */
    separateJuniors: z.boolean().default(false),
  }),
  tiebreakers: z.array(z.enum(['total_weight', 'best_tour_weight', 'last_tour_weight'])),
  standings: z.array(z.enum(['team', 'individual'])).min(1),
  draw: z.enum(['pikecup_slips', 'per_athlete_sectors', 'none']),
})

export type TournamentFormat = z.infer<typeof tournamentFormatSchema>
export type FormatEngine = TournamentFormat['engine']
export type RosterRole = 'athlete' | 'captain' | 'representative'
export type Tiebreaker = TournamentFormat['tiebreakers'][number]
