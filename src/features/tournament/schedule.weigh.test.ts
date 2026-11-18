import { describe, expect, it } from 'vitest'
import {
  clockWeighSlot,
  isFishingComplete,
  resolveMapWindow,
  resolveWeighTarget,
  type MapWindow,
} from './schedule'
import type { ScheduleSegment, Tournament } from './types'

function seg(
  partial: Partial<ScheduleSegment> & Pick<ScheduleSegment, 'key' | 'sort_order' | 'planned_starts_at' | 'planned_ends_at'>,
): ScheduleSegment {
  return {
    id: partial.key,
    tournament_id: 't1',
    title: partial.key,
    window_kind: null,
    move_tour: null,
    move_mini: null,
    ...partial,
  }
}

const tournament: Pick<Tournament, 'schedule_delay_minutes' | 'schedule_paused_at' | 'live_phase_override'> = {
  schedule_delay_minutes: 0,
  schedule_paused_at: null,
  live_phase_override: null,
}

/** I тур МТ1 → МТ2 → scoring → awards */
const segments: ScheduleSegment[] = [
  seg({
    key: 'tour1_mt1',
    sort_order: 10,
    planned_starts_at: '2026-11-21T09:00:00+03:00',
    planned_ends_at: '2026-11-21T10:00:00+03:00',
    window_kind: 'fishing',
  }),
  seg({
    key: 'tour1_mt2',
    sort_order: 20,
    planned_starts_at: '2026-11-21T10:10:00+03:00',
    planned_ends_at: '2026-11-21T11:10:00+03:00',
    window_kind: 'fishing',
  }),
  seg({
    key: 'scoring',
    sort_order: 30,
    planned_starts_at: '2026-11-21T11:30:00+03:00',
    planned_ends_at: '2026-11-21T12:30:00+03:00',
  }),
  seg({
    key: 'awards',
    sort_order: 40,
    planned_starts_at: '2026-11-21T12:30:00+03:00',
    planned_ends_at: '2026-11-21T13:30:00+03:00',
  }),
]

describe('post-fishing weigh slot', () => {
  it('during scoring segment targets last mini-tour', () => {
    const now = new Date('2026-11-21T12:00:00+03:00')
    const window = resolveMapWindow(tournament, segments, now)
    expect(window.state).toBe('off')
    const slot = clockWeighSlot(window, segments, 'active')
    expect(slot).toEqual({ tour: 1, mini: 2 })
    const target = resolveWeighTarget({
      window,
      segments,
      phaseKind: 'active',
      selectedTour: 1,
      stepBack: false,
    })
    expect(target.slot).toEqual({ tour: 1, mini: 2 })
  })

  it('isFishingComplete is true after last fishing ends', () => {
    expect(isFishingComplete(tournament, segments, new Date('2026-11-21T11:09:00+03:00'))).toBe(false)
    expect(isFishingComplete(tournament, segments, new Date('2026-11-21T11:10:00+03:00'))).toBe(true)
    expect(isFishingComplete(tournament, segments, new Date('2026-11-21T12:00:00+03:00'))).toBe(true)
  })

  it('before start has no weigh slot', () => {
    const window: MapWindow = { state: 'off', label: 'До выхода на воду' }
    expect(clockWeighSlot(window, segments, 'before')).toBeNull()
  })
})
