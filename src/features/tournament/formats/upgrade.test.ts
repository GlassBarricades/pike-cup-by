import { describe, expect, it } from 'vitest'
import { BOOR_INDIVIDUAL_TEAM_FORMAT, PIKECUP_FORMAT } from './presets'
import { upgradeFormat, upgradeV1ToV2 } from './upgrade'

describe('upgradeFormat', () => {
  it('upgrades PikeCup v1 to entry catch + slips + schematic', () => {
    const v2 = upgradeV1ToV2({
      engine: 'pikecup',
      tours: [
        { number: 1, minis: 5 },
        { number: 2, minis: 5 },
      ],
      zones: ['A', 'B'],
      roster: { minAthletes: 2, maxAthletes: 2, captain: false, representative: false },
      ranking: {
        group: 'zone_tour',
        zeroPlace: 'group_size_plus_one',
        tieAverage: true,
        separateJuniors: false,
      },
      tiebreakers: ['total_weight', 'last_tour_weight'],
      standings: ['team'],
      draw: 'pikecup_slips',
    })
    expect(v2.version).toBe(2)
    expect(v2.participants.catchUnit).toBe('entry')
    expect(v2.draw.method).toBe('slips')
    expect(v2.draw.slipPackId).toBe('pikecup')
    expect(v2.setup.mapMode).toBe('schematic')
    expect(v2.scoring.tiebreakers.some((t) => t.kind === 'zone_weight' && t.zone === 'B')).toBe(true)
    expect(v2.structure.zoneRotation).toBe('swap_pairs')
  })

  it('upgrades BOOR v1 to athlete catch + sectors', () => {
    const v2 = upgradeV1ToV2({
      engine: 'individual',
      tours: [
        { number: 1, minis: 3 },
        { number: 2, minis: 3 },
      ],
      zones: ['A', 'B'],
      roster: { minAthletes: 2, maxAthletes: 2, captain: true, representative: true },
      ranking: {
        group: 'zone_tour',
        zeroPlace: 'group_size_plus_one',
        tieAverage: true,
        separateJuniors: true,
      },
      tiebreakers: ['total_weight', 'best_tour_weight'],
      standings: ['team', 'individual'],
      draw: 'per_athlete_sectors',
    })
    expect(v2.participants.catchUnit).toBe('athlete')
    expect(v2.participants.mode).toBe('teams_and_solo')
    expect(v2.draw.level).toBe('athlete')
    expect(v2.draw.slipPackId).toBe('boor')
    expect(v2.standings.individual).toBe(true)
    expect(v2.standings.juniors).toBe(true)
    expect(v2.participants.juniors.separateStandings).toBe(true)
    expect(v2.setup.mapMode).toBe('geo')
  })

  it('passes through already-v2 presets', () => {
    expect(upgradeFormat(PIKECUP_FORMAT)).toEqual(PIKECUP_FORMAT)
    expect(upgradeFormat(BOOR_INDIVIDUAL_TEAM_FORMAT)).toEqual(BOOR_INDIVIDUAL_TEAM_FORMAT)
  })
})
