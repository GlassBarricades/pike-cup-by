import { describe, expect, it } from 'vitest'
import {
  daysCount,
  scoringCatches,
  zoneFor,
  zoneCodes,
} from './capabilities'
import { BOOR_INDIVIDUAL_TEAM_FORMAT, PIKECUP_FORMAT, cloneFormat } from './presets'

describe('capabilities', () => {
  it('zoneFor swap_pairs flips on second tour', () => {
    expect(zoneFor(PIKECUP_FORMAT, 'A', 1)).toBe('A')
    expect(zoneFor(PIKECUP_FORMAT, 'A', 2)).toBe('B')
    expect(zoneFor(PIKECUP_FORMAT, 'B', 2)).toBe('A')
  })

  it('zoneCodes reads structure.zones', () => {
    expect(zoneCodes(BOOR_INDIVIDUAL_TEAM_FORMAT)).toEqual(['A', 'B'])
  })

  it('scoringCatches drops uncounted and undersized', () => {
    const format = cloneFormat(BOOR_INDIVIDUAL_TEAM_FORMAT)
    format.catch.minFishWeightG = 500
    format.catch.species = { enabled: true, list: ['pike', 'perch'], counted: ['pike'] }
    const kept = scoringCatches(format, [
      { weight_grams: 600, species: 'pike', counted: true },
      { weight_grams: 400, species: 'pike', counted: true },
      { weight_grams: 700, species: 'perch', counted: true },
      { weight_grams: 800, species: 'pike', counted: false },
    ])
    expect(kept).toHaveLength(1)
    expect(kept[0]?.weight_grams).toBe(600)
  })

  it('daysCount respects tour.day', () => {
    const format = cloneFormat(PIKECUP_FORMAT)
    format.structure.tours[1]!.day = 2
    expect(daysCount(format)).toBe(2)
  })
})
