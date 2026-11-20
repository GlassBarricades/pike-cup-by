import { describe, expect, it } from 'vitest'
import { BOOR_INDIVIDUAL_TEAM_FORMAT } from '../presets'
import { buildIndividualRace } from './race'
import type { AthleteDraw, CatchRow, MiniTour, ScheduleSegment, TournamentEntry } from '../../types'

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

const segments: ScheduleSegment[] = minis.map((mini, index) => ({
  id: mini.segment_id,
  tournament_id: 't1',
  key: `tour${mini.tour_number}_mt${mini.mini_number}`,
  title: `Т${mini.tour_number} М${mini.mini_number}`,
  sort_order: index + 1,
  planned_starts_at: `2026-01-01T0${index}:00:00.000Z`,
  planned_ends_at: `2026-01-01T0${index}:50:00.000Z`,
}))

describe('buildIndividualRace', () => {
  it('builds athlete and team matrices with moments', () => {
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
      {
        id: 'c1',
        tournament_id: 't1',
        entry_id: 'e1',
        roster_member_id: 'a1',
        mini_tour_id: 'm11',
        weight_grams: 1000,
        created_by: null,
        created_at: '2026-01-01T01:00:00.000Z',
      },
      {
        id: 'c2',
        tournament_id: 't1',
        entry_id: 'e2',
        roster_member_id: 'b1',
        mini_tour_id: 'm11',
        weight_grams: 500,
        created_by: null,
        created_at: '2026-01-01T01:01:00.000Z',
      },
    ]
    const race = buildIndividualRace(
      BOOR_INDIVIDUAL_TEAM_FORMAT,
      { zero_place_is_group_size_plus_one: true },
      entries,
      catches,
      minis,
      segments,
      draws,
    )
    expect(race.engine).toBe('individual')
    expect(race.matrix.length).toBe(3)
    expect(race.matrixTeams.length).toBe(2)
    expect(race.matrix.some((row) => row.rosterMemberId === 'a1')).toBe(true)
    expect(race.moments.length).toBe(2)
    expect(race.moments[0]?.athleteName).toBeTruthy()
    const a1Cell = race.matrix.find((row) => row.rosterMemberId === 'a1')?.cells[0]
    expect(a1Cell?.grams).toBe(1000)
    expect(a1Cell?.zone).toBe('A')
  })
})
