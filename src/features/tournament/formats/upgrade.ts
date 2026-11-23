import {
  tournamentFormatSchema,
  tournamentFormatV1Schema,
  type TournamentFormat,
  type TournamentFormatV1,
} from './types'

function scheduleDefaults(engine: 'pikecup' | 'individual') {
  if (engine === 'pikecup') {
    return {
      fishingMinutes: 50,
      moveMinutes: 10,
      dayStartTime: '07:00' as const,
      extras: [
        { key: 'briefing', title: 'Брифинг', afterTour: 0, afterMini: 0, minutes: 30 },
        { key: 'weighing', title: 'Взвешивание', afterTour: 2, afterMini: 5, minutes: 40 },
      ],
    }
  }
  return {
    fishingMinutes: 50,
    moveMinutes: 10,
    dayStartTime: '07:30' as const,
    extras: [
      { key: 'briefing', title: 'Брифинг', afterTour: 0, afterMini: 0, minutes: 30 },
      { key: 'weighing', title: 'Взвешивание', afterTour: 2, afterMini: 3, minutes: 40 },
    ],
  }
}

/** Convert a validated v1 format object to v2. */
export function upgradeV1ToV2(v1: TournamentFormatV1): TournamentFormat {
  const isPike = v1.engine === 'pikecup'
  const zones = v1.zones.map((code) => ({ code, label: `Зона ${code}` }))
  const tours = v1.tours.map((t) => ({ number: t.number, day: 1, minis: t.minis }))

  const tiebreakers: TournamentFormat['scoring']['tiebreakers'] = v1.tiebreakers.map((tb) => {
    if (tb === 'total_weight') return { kind: 'total_weight' as const }
    if (tb === 'best_tour_weight') return { kind: 'best_tour_weight' as const }
    return { kind: 'last_tour_weight' as const }
  })
  // PikeCup historically used zone B weight as final tiebreak (hardcoded).
  if (isPike && !tiebreakers.some((t) => t.kind === 'zone_weight')) {
    tiebreakers.push({ kind: 'zone_weight', zone: 'B' })
  }

  const drawMethod =
    v1.draw === 'none' ? 'none' : v1.draw === 'pikecup_slips' || v1.draw === 'per_athlete_sectors' ? 'slips' : 'none'
  const slipPackId =
    v1.draw === 'pikecup_slips' ? 'pikecup' : v1.draw === 'per_athlete_sectors' ? 'boor' : null

  const raw: TournamentFormat = {
    version: 2,
    structure: {
      tours,
      zones,
      zoneRotation: zones.length === 2 ? 'swap_pairs' : 'fixed',
    },
    participants: {
      mode: isPike ? 'teams' : 'teams_and_solo',
      catchUnit: isPike ? 'entry' : 'athlete',
      roster: { ...v1.roster },
      juniors: {
        mark: !isPike,
        separateStandings: Boolean(v1.ranking.separateJuniors),
      },
    },
    catch: {
      measure: 'weight',
      species: { enabled: false, list: [], counted: [] },
      bagLimit: null,
      minFishWeightG: null,
    },
    scoring: {
      group: v1.ranking.group,
      zeroPlace: v1.ranking.zeroPlace,
      tieAverage: v1.ranking.tieAverage,
      teamScore: isPike ? 'own_places' : 'sum_athlete_places',
      tiebreakers,
    },
    standings: {
      team: v1.standings.includes('team'),
      individual: v1.standings.includes('individual'),
      juniors: Boolean(v1.ranking.separateJuniors),
    },
    draw: {
      level: isPike ? 'entry' : 'athlete',
      method: drawMethod,
      zonesOnly: false,
      slipPackId,
    },
    setup: {
      scheduleTemplate: scheduleDefaults(v1.engine),
      mapMode: isPike ? 'schematic' : 'geo',
      rulesTemplate: null,
      spectatorRulesHint: isPike,
    },
  }

  return tournamentFormatSchema.parse(raw)
}

/**
 * Accept unknown JSON (v1 or v2) and return a validated v2 format.
 * Throws ZodError on invalid input (callers should catch for UI).
 */
export function upgradeFormat(raw: unknown): TournamentFormat {
  if (raw && typeof raw === 'object' && (raw as { version?: number }).version === 2) {
    return tournamentFormatSchema.parse(raw)
  }
  const v1 = tournamentFormatV1Schema.parse(raw)
  return upgradeV1ToV2(v1)
}

export function tryUpgradeFormat(raw: unknown): { ok: true; format: TournamentFormat } | { ok: false; error: string } {
  try {
    return { ok: true, format: upgradeFormat(raw) }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
