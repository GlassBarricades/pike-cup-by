import { describe, expect, it } from 'vitest'
import { BOOR_INDIVIDUAL_TEAM_FORMAT } from '../presets'
import { computeIndividualResults } from './scoring'
import type { AthleteDraw, CatchRow, MiniTour, TournamentEntry } from '../../types'

function entry(
  id: string,
  teamName: string,
  athletes: { id: string; name: string; junior?: boolean }[],
): TournamentEntry {
  return {
    id,
    tournament_id: 't1',
    team_id: id,
    team_name_snapshot: teamName,
    quota: 'open',
    status: 'confirmed',
    contact_phone: null,
    start_zone: null,
    draw_slip_id: null,
    roster_locked_at: null,
    roster: athletes.map((a, index) => ({
      id: a.id,
      entry_id: id,
      athlete_id: a.id,
      full_name_snapshot: a.name,
      slot: index + 1,
      role: 'athlete' as const,
      is_junior: Boolean(a.junior),
    })),
  }
}

const minis: MiniTour[] = [
  { id: 'm11', tournament_id: 't1', segment_id: 's11', tour_number: 1, mini_number: 1 },
  { id: 'm12', tournament_id: 't1', segment_id: 's12', tour_number: 1, mini_number: 2 },
  { id: 'm13', tournament_id: 't1', segment_id: 's13', tour_number: 1, mini_number: 3 },
  { id: 'm21', tournament_id: 't1', segment_id: 's21', tour_number: 2, mini_number: 1 },
  { id: 'm22', tournament_id: 't1', segment_id: 's22', tour_number: 2, mini_number: 2 },
  { id: 'm23', tournament_id: 't1', segment_id: 's23', tour_number: 2, mini_number: 3 },
]

function draw(memberId: string, tour: number, zone: string): AthleteDraw[] {
  return [1, 2, 3].map((mini) => ({
    id: `${memberId}-${tour}-${mini}`,
    tournament_id: 't1',
    roster_member_id: memberId,
    tour_number: tour,
    mini_number: mini,
    zone,
    sector: mini,
    created_at: '',
  }))
}

describe('computeIndividualResults', () => {
  it('ranks athletes in zone by tour weight and averages ties', () => {
    const entries = [
      entry('e1', 'Alpha', [
        { id: 'a1', name: 'A1' },
        { id: 'a2', name: 'A2' },
      ]),
      entry('e2', 'Beta', [{ id: 'b1', name: 'B1' }]),
    ]
    const draws = [
      ...draw('a1', 1, 'A'),
      ...draw('a1', 2, 'B'),
      ...draw('a2', 1, 'A'),
      ...draw('a2', 2, 'B'),
      ...draw('b1', 1, 'A'),
      ...draw('b1', 2, 'B'),
    ]
    const catches: CatchRow[] = [
      { id: 'c1', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm11', weight_grams: 1000, created_by: null, created_at: '' },
      { id: 'c2', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a2', mini_tour_id: 'm11', weight_grams: 1000, created_by: null, created_at: '' },
      { id: 'c3', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'b1', mini_tour_id: 'm11', weight_grams: 500, created_by: null, created_at: '' },
    ]
    const { athletes } = computeIndividualResults(BOOR_INDIVIDUAL_TEAM_FORMAT, entries, catches, minis, draws)
    const a1 = athletes.find((r) => r.rosterMemberId === 'a1')!
    const a2 = athletes.find((r) => r.rosterMemberId === 'a2')!
    const b1 = athletes.find((r) => r.rosterMemberId === 'b1')!
    expect(a1.tours[0].place).toBe(1.5)
    expect(a2.tours[0].place).toBe(1.5)
    expect(b1.tours[0].place).toBe(3)
  })

  it('applies zero place as group_size_plus_one and no-show still ranks', () => {
    const entries = [
      entry('e1', 'Solo', [{ id: 'a1', name: 'A1' }]),
      entry('e2', 'Other', [{ id: 'b1', name: 'B1' }]),
    ]
    const draws = [...draw('a1', 1, 'A'), ...draw('a1', 2, 'B'), ...draw('b1', 1, 'A'), ...draw('b1', 2, 'B')]
    const catches: CatchRow[] = [
      { id: 'c1', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm11', weight_grams: 800, created_by: null, created_at: '' },
    ]
    const { athletes } = computeIndividualResults(BOOR_INDIVIDUAL_TEAM_FORMAT, entries, catches, minis, draws)
    const b1 = athletes.find((r) => r.rosterMemberId === 'b1')!
    expect(b1.tours[0].weight).toBe(0)
    expect(b1.tours[0].place).toBe(3) // n+1 for group of 2
  })

  it('includes solo athletes in personal ranking but excludes them from team standings', () => {
    const solo: TournamentEntry = {
      id: 'solo1',
      tournament_id: 't1',
      team_id: null,
      team_name_snapshot: 'Solo Athlete',
      quota: 'open',
      status: 'confirmed',
      contact_phone: null,
      start_zone: null,
      draw_slip_id: null,
      roster_locked_at: null,
      roster: [
        {
          id: 's1',
          entry_id: 'solo1',
          athlete_id: null,
          full_name_snapshot: 'Solo Athlete',
          slot: 1,
          role: 'athlete',
          is_junior: false,
        },
      ],
    }
    const entries = [
      entry('e1', 'Alpha', [{ id: 'a1', name: 'A1' }]),
      solo,
    ]
    const draws = [...draw('a1', 1, 'A'), ...draw('a1', 2, 'B'), ...draw('s1', 1, 'A'), ...draw('s1', 2, 'B')]
    const catches: CatchRow[] = [
      { id: 'c1', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm11', weight_grams: 500, created_by: null, created_at: '' },
      { id: 'c2', tournament_id: 't1', entry_id: 'solo1', roster_member_id: 's1', mini_tour_id: 'm11', weight_grams: 900, created_by: null, created_at: '' },
    ]
    const { athletes, teams } = computeIndividualResults(
      BOOR_INDIVIDUAL_TEAM_FORMAT,
      entries,
      catches,
      minis,
      draws,
    )
    expect(athletes.map((a) => a.rosterMemberId)).toEqual(['s1', 'a1'])
    expect(athletes[0].solo).toBe(true)
    expect(athletes[0].teamName).toBe('личный')
    expect(teams.map((t) => t.entryId)).toEqual(['e1'])
    expect(teams.every((t) => t.entryId !== 'solo1')).toBe(true)
  })

  it('splits personal tables when separateJuniors is on but keeps juniors in team standings', () => {
    const format = {
      ...BOOR_INDIVIDUAL_TEAM_FORMAT,
      ranking: { ...BOOR_INDIVIDUAL_TEAM_FORMAT.ranking, separateJuniors: true },
    }
    const entries = [
      entry('e1', 'Alpha', [
        { id: 'a1', name: 'Adult' },
        { id: 'j1', name: 'Junior', junior: true },
      ]),
      entry('e2', 'Beta', [{ id: 'a2', name: 'Adult2' }]),
    ]
    const draws = [
      ...draw('a1', 1, 'A'),
      ...draw('a1', 2, 'B'),
      ...draw('j1', 1, 'A'),
      ...draw('j1', 2, 'B'),
      ...draw('a2', 1, 'A'),
      ...draw('a2', 2, 'B'),
    ]
    const catches: CatchRow[] = [
      { id: 'c1', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm11', weight_grams: 800, created_by: null, created_at: '' },
      { id: 'c2', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'j1', mini_tour_id: 'm11', weight_grams: 900, created_by: null, created_at: '' },
      { id: 'c3', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'a2', mini_tour_id: 'm11', weight_grams: 700, created_by: null, created_at: '' },
    ]
    const { athletes, juniors, teams } = computeIndividualResults(format, entries, catches, minis, draws)
    expect(athletes.every((a) => !a.junior)).toBe(true)
    expect(athletes.map((a) => a.rosterMemberId)).toEqual(['a1', 'a2'])
    expect(juniors).toHaveLength(1)
    expect(juniors[0]?.rosterMemberId).toBe('j1')
    expect(juniors[0]?.finalPlace).toBe(1)
    // Junior still contributes to team place sum (tour places among everyone)
    expect(teams.find((t) => t.entryId === 'e1')?.athleteIds).toEqual(expect.arrayContaining(['a1', 'j1']))
  })

  it('uses total_weight then best_tour_weight tiebreakers and sums team places', () => {
    const entries = [
      entry('e1', 'Alpha', [{ id: 'a1', name: 'A1' }]),
      entry('e2', 'Beta', [{ id: 'b1', name: 'B1' }]),
    ]
    const draws = [...draw('a1', 1, 'A'), ...draw('a1', 2, 'B'), ...draw('b1', 1, 'A'), ...draw('b1', 2, 'B')]
    // same place sum: both get place 1 and 2 somehow via equal totals in tours but different best
    const catches: CatchRow[] = [
      { id: 'c1', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm11', weight_grams: 1000, created_by: null, created_at: '' },
      { id: 'c2', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm21', weight_grams: 400, created_by: null, created_at: '' },
      { id: 'c3', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'b1', mini_tour_id: 'm11', weight_grams: 700, created_by: null, created_at: '' },
      { id: 'c4', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'b1', mini_tour_id: 'm21', weight_grams: 700, created_by: null, created_at: '' },
    ]
    const { athletes, teams } = computeIndividualResults(
      BOOR_INDIVIDUAL_TEAM_FORMAT,
      entries,
      catches,
      minis,
      draws,
    )
    // a1: tour1 1000 place1, tour2 400 place2 → sum 3, total 1400, best 1000
    // b1: tour1 700 place2, tour2 700 place1 → sum 3, total 1400, best 700
    expect(athletes[0].rosterMemberId).toBe('a1')
    expect(athletes[0].bestTourWeight).toBe(1000)
    expect(teams[0].entryId).toBe('e1')
    expect(teams[0].placeSum).toBe(athletes[0].placeSum)
  })
})
