/**
 * Golden snapshots for PikeCup and BOOR scoring / LIVE builders.
 * These freeze current outputs so the unified engine can be verified against them.
 */
import { describe, expect, it } from 'vitest'
import { BOOR_INDIVIDUAL_TEAM_FORMAT, PIKECUP_FORMAT } from './presets'
import { computeResults } from './results'
import { computeStandings } from './pikecup/scoring'
import { computeIndividualResults } from './individual/scoring'
import { buildIndividualRace } from './individual/race'
import type { AthleteDraw, CatchRow, MiniTour, ScheduleSegment, TournamentEntry } from '../types'

function pikeEntry(
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
      {
        id: `${id}-1`,
        entry_id: id,
        athlete_id: null,
        full_name_snapshot: `${name}-1`,
        slot: 1,
        role: 'athlete',
        is_junior: false,
      },
      {
        id: `${id}-2`,
        entry_id: id,
        athlete_id: null,
        full_name_snapshot: `${name}-2`,
        slot: 2,
        role: 'athlete',
        is_junior: false,
      },
    ],
  }
}

function indEntry(
  id: string,
  teamName: string,
  athletes: { id: string; name: string; junior?: boolean }[],
  teamId: string | null = id,
): TournamentEntry {
  return {
    id,
    tournament_id: 't1',
    team_id: teamId,
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

const pikeMinis: MiniTour[] = [
  { id: 't1m1', tournament_id: 't1', segment_id: 's1', tour_number: 1, mini_number: 1 },
  { id: 't1m2', tournament_id: 't1', segment_id: 's2', tour_number: 1, mini_number: 2 },
  { id: 't2m1', tournament_id: 't1', segment_id: 's3', tour_number: 2, mini_number: 1 },
  { id: 't2m2', tournament_id: 't1', segment_id: 's4', tour_number: 2, mini_number: 2 },
]

const boorMinis: MiniTour[] = [
  { id: 'm11', tournament_id: 't1', segment_id: 's11', tour_number: 1, mini_number: 1 },
  { id: 'm12', tournament_id: 't1', segment_id: 's12', tour_number: 1, mini_number: 2 },
  { id: 'm13', tournament_id: 't1', segment_id: 's13', tour_number: 1, mini_number: 3 },
  { id: 'm21', tournament_id: 't1', segment_id: 's21', tour_number: 2, mini_number: 1 },
  { id: 'm22', tournament_id: 't1', segment_id: 's22', tour_number: 2, mini_number: 2 },
  { id: 'm23', tournament_id: 't1', segment_id: 's23', tour_number: 2, mini_number: 3 },
]

function draw(memberId: string, tour: number, zone: string, minis = 3): AthleteDraw[] {
  return Array.from({ length: minis }, (_, i) => ({
    id: `${memberId}-${tour}-${i + 1}`,
    tournament_id: 't1',
    roster_member_id: memberId,
    tour_number: tour,
    mini_number: i + 1,
    zone,
    sector: i + 1,
    created_at: '',
  }))
}

describe('golden: PikeCup standings', () => {
  const entries = [
    pikeEntry('e1', 'Alpha', 'A'),
    pikeEntry('e2', 'Beta', 'A'),
    pikeEntry('e3', 'Gamma', 'B'),
    pikeEntry('e4', 'Delta', 'B'),
  ]
  const catches: CatchRow[] = [
    { id: '1', tournament_id: 't1', entry_id: 'e1', roster_member_id: null, mini_tour_id: 't1m1', weight_grams: 1200, created_by: null, created_at: '' },
    { id: '2', tournament_id: 't1', entry_id: 'e1', roster_member_id: null, mini_tour_id: 't2m1', weight_grams: 400, created_by: null, created_at: '' },
    { id: '3', tournament_id: 't1', entry_id: 'e2', roster_member_id: null, mini_tour_id: 't1m1', weight_grams: 900, created_by: null, created_at: '' },
    { id: '4', tournament_id: 't1', entry_id: 'e2', roster_member_id: null, mini_tour_id: 't2m1', weight_grams: 800, created_by: null, created_at: '' },
    { id: '5', tournament_id: 't1', entry_id: 'e3', roster_member_id: null, mini_tour_id: 't1m1', weight_grams: 1100, created_by: null, created_at: '' },
    { id: '6', tournament_id: 't1', entry_id: 'e3', roster_member_id: null, mini_tour_id: 't2m1', weight_grams: 600, created_by: null, created_at: '' },
    { id: '7', tournament_id: 't1', entry_id: 'e4', roster_member_id: null, mini_tour_id: 't1m1', weight_grams: 700, created_by: null, created_at: '' },
    { id: '8', tournament_id: 't1', entry_id: 'e4', roster_member_id: null, mini_tour_id: 't2m1', weight_grams: 1000, created_by: null, created_at: '' },
  ]

  it('matches computeStandings snapshot', () => {
    const rows = computeStandings(entries, catches, pikeMinis)
    expect(
      rows.map((r) => ({
        entryId: r.entryId,
        finalPlace: r.finalPlace,
        placeSum: r.placeSum,
        zoneAPlace: r.zoneAPlace,
        zoneBPlace: r.zoneBPlace,
        zoneAWeight: r.zoneAWeight,
        zoneBWeight: r.zoneBWeight,
        totalWeight: r.totalWeight,
      })),
    ).toEqual([
      {
        entryId: 'e3',
        finalPlace: 1,
        placeSum: 3,
        zoneAPlace: 2,
        zoneBPlace: 1,
        zoneAWeight: 600,
        zoneBWeight: 1100,
        totalWeight: 1700,
      },
      {
        entryId: 'e2',
        finalPlace: 2,
        placeSum: 3,
        zoneAPlace: 2,
        zoneBPlace: 1,
        zoneAWeight: 900,
        zoneBWeight: 800,
        totalWeight: 1700,
      },
      {
        entryId: 'e4',
        finalPlace: 3,
        placeSum: 3,
        zoneAPlace: 1,
        zoneBPlace: 2,
        zoneAWeight: 1000,
        zoneBWeight: 700,
        totalWeight: 1700,
      },
      {
        entryId: 'e1',
        finalPlace: 4,
        placeSum: 3,
        zoneAPlace: 1,
        zoneBPlace: 2,
        zoneAWeight: 1200,
        zoneBWeight: 400,
        totalWeight: 1600,
      },
    ])
  })

  it('computeResults routes to pikecup engine', () => {
    const results = computeResults({
      tournament: PIKECUP_FORMAT,
      entries,
      catches,
      miniTours: pikeMinis,
    })
    expect(results.engine).toBe('pikecup')
    expect(results.teams).toHaveLength(4)
    expect(results.athletes).toEqual([])
    expect(results.juniors).toEqual([])
  })
})

describe('golden: BOOR individual results', () => {
  const entries = [
    indEntry('e1', 'Alpha', [
      { id: 'a1', name: 'A1' },
      { id: 'a2', name: 'A2' },
    ]),
    indEntry('e2', 'Beta', [
      { id: 'b1', name: 'B1' },
      { id: 'b2', name: 'B2', junior: true },
    ]),
    indEntry('solo1', 'Solo', [{ id: 's1', name: 'Solo' }], null),
  ]
  const draws = [
    ...draw('a1', 1, 'A'),
    ...draw('a1', 2, 'B'),
    ...draw('a2', 1, 'B'),
    ...draw('a2', 2, 'A'),
    ...draw('b1', 1, 'A'),
    ...draw('b1', 2, 'B'),
    ...draw('b2', 1, 'B'),
    ...draw('b2', 2, 'A'),
    ...draw('s1', 1, 'A'),
    ...draw('s1', 2, 'B'),
  ]
  const catches: CatchRow[] = [
    { id: 'c1', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm11', weight_grams: 1000, created_by: null, created_at: '' },
    { id: 'c2', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a2', mini_tour_id: 'm11', weight_grams: 600, created_by: null, created_at: '' },
    { id: 'c3', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'b1', mini_tour_id: 'm11', weight_grams: 800, created_by: null, created_at: '' },
    { id: 'c4', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'b2', mini_tour_id: 'm11', weight_grams: 500, created_by: null, created_at: '' },
    { id: 'c5', tournament_id: 't1', entry_id: 'solo1', roster_member_id: 's1', mini_tour_id: 'm11', weight_grams: 900, created_by: null, created_at: '' },
    { id: 'c6', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a1', mini_tour_id: 'm21', weight_grams: 700, created_by: null, created_at: '' },
    { id: 'c7', tournament_id: 't1', entry_id: 'e1', roster_member_id: 'a2', mini_tour_id: 'm21', weight_grams: 400, created_by: null, created_at: '' },
    { id: 'c8', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'b1', mini_tour_id: 'm21', weight_grams: 650, created_by: null, created_at: '' },
    { id: 'c9', tournament_id: 't1', entry_id: 'e2', roster_member_id: 'b2', mini_tour_id: 'm21', weight_grams: 550, created_by: null, created_at: '' },
    { id: 'c10', tournament_id: 't1', entry_id: 'solo1', roster_member_id: 's1', mini_tour_id: 'm21', weight_grams: 750, created_by: null, created_at: '' },
  ]

  const formatWithJuniors = {
    ...BOOR_INDIVIDUAL_TEAM_FORMAT,
    participants: {
      ...BOOR_INDIVIDUAL_TEAM_FORMAT.participants,
      juniors: { mark: true, separateStandings: true },
    },
    standings: { ...BOOR_INDIVIDUAL_TEAM_FORMAT.standings, juniors: true },
  }

  it('matches open / junior / team snapshot', () => {
    const { athletes, juniors, teams } = computeIndividualResults(
      formatWithJuniors,
      entries,
      catches,
      boorMinis,
      draws,
    )
    expect(athletes.map((a) => a.rosterMemberId)).toEqual(['a1', 's1', 'b2', 'a2', 'b1'])
    expect(athletes.map((a) => a.finalPlace)).toEqual([1, 2, 3, 4, 5])
    expect(athletes.find((a) => a.rosterMemberId === 's1')?.solo).toBe(true)
    expect(juniors.map((j) => j.rosterMemberId)).toEqual(['b2'])
    expect(teams.map((t) => t.entryId)).toEqual(['e1', 'e2'])
    expect(teams.every((t) => t.entryId !== 'solo1')).toBe(true)
  })

  it('computeResults routes to individual engine', () => {
    const results = computeResults({
      tournament: formatWithJuniors,
      entries,
      catches,
      miniTours: boorMinis,
      draws,
    })
    expect(results.engine).toBe('individual')
    expect(results.athletes).toHaveLength(5)
    expect(results.juniors).toHaveLength(1)
    expect(results.teams).toHaveLength(2)
  })

  it('buildIndividualRace golden shape', () => {
    const segments: ScheduleSegment[] = boorMinis.map((mini, index) => ({
      id: mini.segment_id,
      tournament_id: 't1',
      key: `tour${mini.tour_number}_mt${mini.mini_number}`,
      title: `T${mini.tour_number} M${mini.mini_number}`,
      sort_order: index + 1,
      planned_starts_at: `2026-01-01T0${index}:00:00.000Z`,
      planned_ends_at: `2026-01-01T0${index}:50:00.000Z`,
    }))
    const race = buildIndividualRace(
      formatWithJuniors,
      { zero_place_is_group_size_plus_one: true },
      entries,
      catches,
      boorMinis,
      segments,
      draws,
    )
    expect(race.engine).toBe('individual')
    expect(race.standings.length).toBeGreaterThan(0)
    expect(race.matrix.length).toBeGreaterThan(0)
  })
})
