import { describe, expect, it } from 'vitest'
import { cloneFormat, BOOR_INDIVIDUAL_TEAM_FORMAT } from './presets'
import { generateScheduleFromFormat } from './scheduleFromFormat'

describe('generateScheduleFromFormat', () => {
  it('builds BOOR fishing slots for both tours × 3 minis', () => {
    const rows = generateScheduleFromFormat(BOOR_INDIVIDUAL_TEAM_FORMAT)
    const fishing = rows.filter((r) => r.windowKind === 'fishing')
    expect(fishing).toHaveLength(6)
    expect(fishing.map((r) => `${r.tour}-${r.mini}`)).toEqual([
      '1-1',
      '1-2',
      '1-3',
      '2-1',
      '2-2',
      '2-3',
    ])
    expect(rows[0]?.key).toBe('briefing')
    expect(rows.some((r) => r.key === 'awards')).toBe(true)
    expect(new Set(rows.map((r) => r.day))).toEqual(new Set([1]))
  })

  it('splits a 2-day custom format into day-scoped rows', () => {
    const format = cloneFormat(BOOR_INDIVIDUAL_TEAM_FORMAT)
    format.structure.tours = [
      { number: 1, day: 1, minis: 2 },
      { number: 2, day: 2, minis: 2 },
    ]
    const rows = generateScheduleFromFormat(format)
    const day1 = rows.filter((r) => r.day === 1)
    const day2 = rows.filter((r) => r.day === 2)
    expect(day1.some((r) => r.key === 'briefing')).toBe(true)
    expect(day2.some((r) => r.key === 'day2_open')).toBe(true)
    expect(day1.filter((r) => r.windowKind === 'fishing').map((r) => `${r.tour}-${r.mini}`)).toEqual([
      '1-1',
      '1-2',
    ])
    expect(day2.filter((r) => r.windowKind === 'fishing').map((r) => `${r.tour}-${r.mini}`)).toEqual([
      '2-1',
      '2-2',
    ])
    expect(day2.some((r) => r.key === 'awards')).toBe(true)
    expect(day1.some((r) => r.key === 'awards')).toBe(false)
  })
})
