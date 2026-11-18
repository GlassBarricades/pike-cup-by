import { describe, expect, it } from 'vitest'
import { computeStandings } from './scoring'
import type { CatchRow, MiniTour, TournamentEntry } from '../../types'

function team(
  id: string,
  name: string,
  zone: 'A' | 'B',
): TournamentEntry {
  return {
    id,
    tournament_id: 't1',
    team_id: id,
    team_name_snapshot: name,
    quota: 'open',
    status: 'confirmed',
    contact_phone: null,
    start_zone: zone,
    draw_slip_id: null,
    roster_locked_at: null,
    roster: [
      { id: `${id}-1`, entry_id: id, athlete_id: null, full_name_snapshot: 'X', slot: 1, role: 'athlete', is_junior: false },
      { id: `${id}-2`, entry_id: id, athlete_id: null, full_name_snapshot: 'Y', slot: 2, role: 'athlete', is_junior: false },
    ],
  }
}

describe('PikeCup computeStandings regression', () => {
  it('sums zone places and uses total weight then zone B weight as tiebreak', () => {
    const entries = [team('e1', 'One', 'A'), team('e2', 'Two', 'A')]
    const minis: MiniTour[] = [
      { id: 't1m1', tournament_id: 't1', segment_id: 's1', tour_number: 1, mini_number: 1 },
      { id: 't2m1', tournament_id: 't1', segment_id: 's2', tour_number: 2, mini_number: 1 },
    ]
    const catches: CatchRow[] = [
      { id: '1', tournament_id: 't1', entry_id: 'e1', roster_member_id: null, mini_tour_id: 't1m1', weight_grams: 1000, created_by: null, created_at: '' },
      { id: '2', tournament_id: 't1', entry_id: 'e1', roster_member_id: null, mini_tour_id: 't2m1', weight_grams: 500, created_by: null, created_at: '' },
      { id: '3', tournament_id: 't1', entry_id: 'e2', roster_member_id: null, mini_tour_id: 't1m1', weight_grams: 800, created_by: null, created_at: '' },
      { id: '4', tournament_id: 't1', entry_id: 'e2', roster_member_id: null, mini_tour_id: 't2m1', weight_grams: 700, created_by: null, created_at: '' },
    ]
    const rows = computeStandings(entries, catches, minis)
    // placeSum одинаков (3); тай-брейк по zoneBWeight → e2 (700 > 500)
    expect(rows[0].entryId).toBe('e2')
    expect(rows[0].zoneBWeight).toBe(700)
    expect(rows[0].placeSum).toBe(rows[0].zoneAPlace + rows[0].zoneBPlace)
    expect(rows[1].entryId).toBe('e1')
    expect(rows[1].zoneAWeight).toBe(1000)
  })
})
