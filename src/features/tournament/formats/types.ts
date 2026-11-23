import { z } from 'zod'

/** v1 schema — kept for upgrade path only. */
export const tournamentFormatV1Schema = z.object({
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
    separateJuniors: z.boolean().default(false),
  }),
  tiebreakers: z.array(z.enum(['total_weight', 'best_tour_weight', 'last_tour_weight'])),
  standings: z.array(z.enum(['team', 'individual'])).min(1),
  draw: z.enum(['pikecup_slips', 'per_athlete_sectors', 'none']),
})

export type TournamentFormatV1 = z.infer<typeof tournamentFormatV1Schema>

const tourSchema = z.object({
  number: z.number().int().min(1).max(9),
  /** Calendar day index within the event (1 = first day). Enables multi-day. */
  day: z.number().int().min(1).max(14).default(1),
  minis: z.number().int().min(1).max(20),
})

const zoneSchema = z.object({
  code: z.string().min(1).max(8),
  label: z.string().min(1).max(40).optional(),
})

const tiebreakerSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('total_weight') }),
  z.object({ kind: z.literal('best_tour_weight') }),
  z.object({ kind: z.literal('last_tour_weight') }),
  z.object({ kind: z.literal('zone_weight'), zone: z.string().min(1) }),
])

const scheduleTemplateSchema = z.object({
  /** Minutes per fishing mini-tour window */
  fishingMinutes: z.number().int().min(5).max(240).default(50),
  /** Minutes between fishing windows (move / rest) */
  moveMinutes: z.number().int().min(0).max(120).default(10),
  /** Optional fixed clock times override (HH:MM) for first fishing of day */
  dayStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  /** Extra named non-fishing segments (weighing, lunch, briefing) */
  extras: z
    .array(
      z.object({
        key: z.string().min(1),
        title: z.string().min(1),
        afterTour: z.number().int().min(0).max(9).optional(),
        afterMini: z.number().int().min(0).max(20).optional(),
        minutes: z.number().int().min(1).max(240),
      }),
    )
    .default([]),
})

export const tournamentFormatSchema = z
  .object({
    version: z.literal(2),
    structure: z.object({
      tours: z.array(tourSchema).min(1),
      zones: z.array(zoneSchema).min(1),
      zoneRotation: z.enum(['swap_pairs', 'cycle', 'fixed', 'redraw_each_tour']),
    }),
    participants: z.object({
      mode: z.enum(['teams', 'teams_and_solo', 'individual']),
      /** Who catches are attributed to */
      catchUnit: z.enum(['entry', 'athlete']),
      roster: z.object({
        minAthletes: z.number().int().min(1).max(10),
        maxAthletes: z.number().int().min(1).max(10),
        captain: z.boolean(),
        representative: z.boolean(),
      }),
      juniors: z.object({
        mark: z.boolean(),
        separateStandings: z.boolean(),
      }),
    }),
    catch: z.object({
      measure: z.enum(['weight', 'count', 'length']).default('weight'),
      species: z.object({
        enabled: z.boolean().default(false),
        list: z.array(z.string().min(1)).default([]),
        /** Species that count toward the score; empty = all */
        counted: z.array(z.string().min(1)).default([]),
      }),
      bagLimit: z.number().int().min(0).max(100).nullable().default(null),
      minFishWeightG: z.number().int().min(0).max(50000).nullable().default(null),
    }),
    scoring: z.object({
      group: z.enum(['zone_tour', 'tour']),
      zeroPlace: z.enum(['group_size', 'group_size_plus_one']),
      tieAverage: z.boolean(),
      teamScore: z.enum(['own_places', 'sum_athlete_places']),
      tiebreakers: z.array(tiebreakerSchema).min(1),
    }),
    standings: z.object({
      team: z.boolean(),
      individual: z.boolean(),
      juniors: z.boolean(),
    }),
    draw: z.object({
      level: z.enum(['entry', 'athlete']),
      method: z.enum(['slips', 'random', 'manual', 'none']),
      zonesOnly: z.boolean().default(false),
      slipPackId: z.string().min(1).nullable().default(null),
    }),
    setup: z.object({
      scheduleTemplate: scheduleTemplateSchema,
      mapMode: z.enum(['schematic', 'geo']),
      rulesTemplate: z.string().nullable().default(null),
      spectatorRulesHint: z.boolean().default(false),
    }),
  })
  .superRefine((format, ctx) => {
    if (format.participants.mode === 'individual' && format.standings.team) {
      ctx.addIssue({
        code: 'custom',
        path: ['standings', 'team'],
        message: 'Режим «только личный» не допускает командный зачёт',
      })
    }
    if (format.structure.zoneRotation === 'swap_pairs' && format.structure.zones.length !== 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['structure', 'zoneRotation'],
        message: 'Ротация swap_pairs требует ровно две зоны',
      })
    }
    if (format.participants.catchUnit === 'entry' && format.draw.level === 'athlete') {
      ctx.addIssue({
        code: 'custom',
        path: ['draw', 'level'],
        message: 'Улов на команду несовместим с жеребьёвкой по спортсменам',
      })
    }
    if (format.standings.juniors && !format.participants.juniors.separateStandings) {
      ctx.addIssue({
        code: 'custom',
        path: ['standings', 'juniors'],
        message: 'Юниорский зачёт требует participants.juniors.separateStandings',
      })
    }
    if (format.participants.roster.minAthletes > format.participants.roster.maxAthletes) {
      ctx.addIssue({
        code: 'custom',
        path: ['participants', 'roster', 'minAthletes'],
        message: 'minAthletes не может быть больше maxAthletes',
      })
    }
  })

export type TournamentFormat = z.infer<typeof tournamentFormatSchema>
export type FormatTiebreaker = TournamentFormat['scoring']['tiebreakers'][number]
export type FormatZone = TournamentFormat['structure']['zones'][number]
export type FormatTour = TournamentFormat['structure']['tours'][number]
export type CatchUnit = TournamentFormat['participants']['catchUnit']
export type ParticipantsMode = TournamentFormat['participants']['mode']
export type ZoneRotation = TournamentFormat['structure']['zoneRotation']

/** @deprecated Use catchUnit / participants.mode via capabilities */
export type FormatEngine = 'pikecup' | 'individual'
/** @deprecated */
export type RosterRole = 'athlete' | 'captain' | 'representative'
/** @deprecated Prefer FormatTiebreaker */
export type Tiebreaker = 'total_weight' | 'best_tour_weight' | 'last_tour_weight'
