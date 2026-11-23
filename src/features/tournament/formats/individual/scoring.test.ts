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

  it('puts all juniors in open table and junior table; team uses open places', () => {
    const format = {
      ...BOOR_INDIVIDUAL_TEAM_FORMAT,
      participants: {
        ...BOOR_INDIVIDUAL_TEAM_FORMAT.participants,
        juniors: { mark: true, separateStandings: true },
      },
      standings: { ...BOOR_INDIVIDUAL_TEAM_FORMAT.standings, juniors: true },
    }
    const entries = [
      entry('e1', 'Alpha', [
        { id: 'a1', name: 'Adult' },
        { id: 'j1', name: 'Junior', junior: true },
      ]),
      entry('e2', 'Beta', [{ id: 'a2', name: 'Adult2' }]),
      entry('e3', 'Juniors', [
        { id: 'j2', name: 'Junior2', junior: true },
        { id: 'j3', name: 'Junior3', junior: true },
      ]),
    ]
    const draws = [
      ...draw('a1', 1, 'A'),
      ...draw('a1', 2, 'B'),
      ...draw('j1', 1, 'A'),
      ...draw('j1', 2, 'B'),
      ...draw('a2', 1, 'A'),
      ...draw('a2', 2, 'B'),
      ...draw('j2', 1, 'A'),
      ...draw('j2', 2, 'B'),
      ...draw('j3', 1, 'B'),
      ...draw('j3', 2, 'A'),
    ]
    const catches: CatchRow[] = [
      { id: 'c1', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm11', weight_grams: 800, created_by: null, created_at: '' },
      { id: 'c2', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'j1', mini_tour_id: 'm11', weight_grams: 900, created_by: null, created_at: '' },
      { id: 'c3', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'a2', mini_tour_id: 'm11', weight_grams: 700, created_by: null, created_at: '' },
      // j2 heavier than j1 in zone A → open place of j1 is 2; junior-only place of j1 is also 2
      { id: 'c4', tournament_id: 't1', entry_id: 'e3', roster_member_id: 'j2', mini_tour_id: 'm11', weight_grams: 950, created_by: null, created_at: '' },
      { id: 'c5', tournament_id: 't1', entry_id: 'e3', roster_member_id: 'j3', mini_tour_id: 'm11', weight_grams: 400, created_by: null, created_at: '' },
    ]
    const { athletes, juniors, teams } = computeIndividualResults(format, entries, catches, minis, draws)

    // Open: everyone including junior+junior pair
    expect(athletes.map((a) => a.rosterMemberId).sort()).toEqual(['a1', 'a2', 'j1', 'j2', 'j3'])
    expect(athletes.find((a) => a.rosterMemberId === 'j1')?.junior).toBe(true)

    // Junior table: all juniors with separate places
    expect(juniors.map((j) => j.rosterMemberId).sort()).toEqual(['j1', 'j2', 'j3'])

    const openJ1 = athletes.find((a) => a.rosterMemberId === 'j1')!
    const juniorJ1 = juniors.find((j) => j.rosterMemberId === 'j1')!
    // Open zone A: j2 950 → 1, j1 900 → 2, a1 800 → 3, a2 700 → 4
    expect(openJ1.tours[0].place).toBe(2)
    // Junior zone A: j2 950 → 1, j1 900 → 2
    expect(juniorJ1.tours[0].place).toBe(2)

    const alpha = teams.find((t) => t.entryId === 'e1')!
    const openA1 = athletes.find((a) => a.rosterMemberId === 'a1')!
    expect(alpha.tours[0].place).toBe(openA1.tours[0].place + openJ1.tours[0].place)
    expect(teams.map((t) => t.entryId).sort()).toEqual(['e1', 'e2', 'e3'])
  })

  it('includes junior+junior and solo junior in open table when separateJuniors is on', () => {
    const format = {
      ...BOOR_INDIVIDUAL_TEAM_FORMAT,
      participants: {
        ...BOOR_INDIVIDUAL_TEAM_FORMAT.participants,
        juniors: { mark: true, separateStandings: true },
      },
      standings: { ...BOOR_INDIVIDUAL_TEAM_FORMAT.standings, juniors: true },
    }
    const soloJunior: TournamentEntry = {
      id: 'soloJ',
      tournament_id: 't1',
      team_id: null,
      team_name_snapshot: 'Solo Junior',
      quota: 'open',
      status: 'confirmed',
      contact_phone: null,
      start_zone: null,
      draw_slip_id: null,
      roster_locked_at: null,
      roster: [
        {
          id: 'sj1',
          entry_id: 'soloJ',
          athlete_id: null,
          full_name_snapshot: 'Solo Junior',
          slot: 1,
          role: 'athlete',
          is_junior: true,
        },
      ],
    }
    const entries = [
      entry('e1', 'Adults', [
        { id: 'a1', name: 'Adult' },
        { id: 'a2', name: 'Adult2' },
      ]),
      entry('e2', 'Juniors', [
        { id: 'j1', name: 'J1', junior: true },
        { id: 'j2', name: 'J2', junior: true },
      ]),
      soloJunior,
    ]
    const draws = [
      ...draw('a1', 1, 'A'),
      ...draw('a1', 2, 'B'),
      ...draw('a2', 1, 'B'),
      ...draw('a2', 2, 'A'),
      ...draw('j1', 1, 'A'),
      ...draw('j1', 2, 'B'),
      ...draw('j2', 1, 'B'),
      ...draw('j2', 2, 'A'),
      ...draw('sj1', 1, 'A'),
      ...draw('sj1', 2, 'B'),
    ]
    const catches: CatchRow[] = [
      { id: 'c1', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm11', weight_grams: 800, created_by: null, created_at: '' },
    ]
    const { athletes, juniors, teams } = computeIndividualResults(format, entries, catches, minis, draws)
    expect(athletes.map((a) => a.rosterMemberId).sort()).toEqual(['a1', 'a2', 'j1', 'j2', 'sj1'])
    expect(juniors.map((j) => j.rosterMemberId).sort()).toEqual(['j1', 'j2', 'sj1'])
    // Solo still excluded from team standings; junior+junior team is included
    expect(teams.map((t) => t.entryId).sort()).toEqual(['e1', 'e2'])
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
