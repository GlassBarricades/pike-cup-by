import { describe, expect, it } from 'vitest'
import {
  buildAthleteExportTable,
  buildExportMeta,
  buildTeamExportTable,
} from './exportStandings'
import type { AthleteStandingRow, TeamStandingRow } from './formats/individual/scoring'

const metaBase = {
  name: 'Западный Кордон',
  event_date: '2026-11-21',
  location: 'Брест',
}

describe('exportStandings builders', () => {
  it('builds team rows ordered by finalPlace with tour cells', () => {
    const teams: TeamStandingRow[] = [
      {
        entryId: 'e2',
        teamId: 'e2',
        teamName: 'Beta',
        athleteIds: ['b1'],
        athleteNames: ['B1'],
        tours: [
          { tour: 1, zone: null, weight: 100, place: 2 },
          { tour: 2, zone: null, weight: 50, place: 1 },
        ],
        placeSum: 3,
        totalWeight: 150,
        bestTourWeight: 100,
        lastTourWeight: 50,
        finalPlace: 2,
      },
      {
        entryId: 'e1',
        teamId: 'e1',
        teamName: 'Alpha',
        athleteIds: ['a1', 'a2'],
        athleteNames: ['A1', 'A2'],
        tours: [
          { tour: 1, zone: null, weight: 200, place: 1 },
          { tour: 2, zone: null, weight: 80, place: 2 },
        ],
        placeSum: 3,
        totalWeight: 280,
        bestTourWeight: 200,
        lastTourWeight: 80,
        finalPlace: 1,
      },
    ]
    const table = buildTeamExportTable(teams, buildExportMeta(metaBase, 'team'))
    expect(table.meta.standingTitle).toBe('Командный зачёт')
    expect(table.meta.fileSlug).toContain('komandnyy')
    expect(table.headers[0]).toBe('#')
    expect(table.rows).toHaveLength(2)
    expect(table.rows[0]).toEqual(['1', 'Alpha', 'A1, A2', '1', '200', '2', '80', '3', '280'])
    expect(table.rows[1][1]).toBe('Beta')
  })

  it('builds athlete rows with zones for individual/juniors', () => {
    const athletes: AthleteStandingRow[] = [
      {
        rosterMemberId: 'j1',
        entryId: 'e1',
        teamId: 'e1',
        teamName: 'Alpha',
        athleteName: 'Junior One',
        solo: false,
        junior: true,
        tours: [
          { tour: 1, zone: 'A', weight: 405, place: 1 },
          { tour: 2, zone: 'B', weight: 0, place: 7 },
        ],
        placeSum: 8,
        totalWeight: 405,
        bestTourWeight: 405,
        lastTourWeight: 0,
        finalPlace: 3,
      },
    ]
    const table = buildAthleteExportTable(athletes, buildExportMeta(metaBase, 'juniors'))
    expect(table.meta.standingTitle).toBe('Юниорский зачёт')
    expect(table.meta.fileSlug).toContain('yuniori')
    expect(table.rows[0]).toEqual([
      '3',
      'Junior One',
      'Alpha',
      '1',
      'A',
      '405',
      '7',
      'B',
      '0',
      '8',
      '405',
    ])
  })
})
