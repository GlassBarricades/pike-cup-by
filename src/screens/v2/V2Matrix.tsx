import { useMemo, useState, type CSSProperties } from 'react'
import { Button, Group, SegmentedControl, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import {
  getFormat,
  hasIndividualStandings,
  hasJuniorStandings,
  hasTeamStandings,
} from '../../features/tournament/formats'
import { formatPlace } from '../../features/tournament/scoring'
import { slotTitle } from '../../features/tournament/schedule'
import { gramsLabel, type MatrixCell, type MatrixRow } from '../../features/tournament/spectator'
import type { ZoneCode } from '../../features/tournament/types'
import { useV2Tournament } from './context'

type Scope = 'personal' | 'team'
type JuniorFilter = 'open' | 'juniors' | 'all'
type ZoneFilter = 'all' | ZoneCode

function rowMatchesZone(
  row: MatrixRow,
  zone: ZoneCode,
  slots: { tour: number; mini: number }[],
  clock: { tour: number; mini: number } | null,
): boolean {
  if (clock) {
    const index = slots.findIndex((s) => s.tour === clock.tour && s.mini === clock.mini)
    if (index >= 0) return row.cells[index]?.zone === zone
  }
  return row.cells.some((cell) => cell.zone === zone)
}

export function V2Matrix() {
  const { tournament, story } = useV2Tournament()
  const format = getFormat(tournament)
  const personalBoard = hasIndividualStandings(format)
  const teamBoard = hasTeamStandings(format)
  const juniorsBoard = hasJuniorStandings(format)
  const [mode, setMode] = useState<'weight' | 'place'>('weight')
  const [scope, setScope] = useState<Scope>(personalBoard ? 'personal' : 'team')
  const hasJuniors = juniorsBoard || story.matrix.some((row) => row.junior)
  const [juniorFilter, setJuniorFilter] = useState<JuniorFilter>('all')
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all')
  const clock = story.clock

  const rows = useMemo(() => {
    let source: MatrixRow[] =
      personalBoard && scope === 'team' ? story.matrixTeams : story.matrix
    if (personalBoard && scope === 'personal' && hasJuniors && juniorFilter !== 'all') {
      source =
        juniorFilter === 'juniors'
          ? source.filter((row) => row.junior)
          : source.filter((row) => !row.junior)
    }
    if (zoneFilter === 'all') return source
    return source.filter((row) => rowMatchesZone(row, zoneFilter, story.slots, clock))
  }, [
    personalBoard,
    scope,
    story.matrix,
    story.matrixTeams,
    story.slots,
    hasJuniors,
    juniorFilter,
    zoneFilter,
    clock,
  ])

  const maxWeight = Math.max(1, ...rows.flatMap((row) => row.cells.map((cell) => cell.grams ?? 0)))
  const worstPlace = Math.max(1, ...rows.flatMap((row) => row.cells.map((cell) => cell.place ?? 0)))
  const nameHeader = !personalBoard || scope === 'team' ? 'Команда' : 'Спортсмен'

  return (
    <div style={{ overflowX: 'auto' }}>
      <Group gap={6} mb="sm" wrap="wrap">
        {personalBoard && teamBoard && (
          <SegmentedControl
            size="xs"
            value={scope}
            onChange={(v) => setScope(v as Scope)}
            data={[
              { value: 'personal', label: 'Личный' },
              { value: 'team', label: 'Командный' },
            ]}
          />
        )}
        {personalBoard && scope === 'personal' && hasJuniors && (
          <SegmentedControl
            size="xs"
            value={juniorFilter}
            onChange={(v) => setJuniorFilter(v as JuniorFilter)}
            data={[
              { value: 'all', label: 'Все' },
              { value: 'open', label: 'Open' },
              { value: 'juniors', label: 'Юниоры' },
            ]}
          />
        )}
        {(
          [
            ['all', 'Все'],
            ['A', 'A'],
            ['B', 'B'],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            size="xs"
            variant={zoneFilter === value ? 'filled' : 'default'}
            color={value === 'A' ? 'zoneA' : value === 'B' ? 'zoneB' : undefined}
            onClick={() => setZoneFilter(value)}
          >
            {label === 'Все' ? 'Все' : `Зона ${label}`}
          </Button>
        ))}
        <Button size="xs" variant={mode === 'weight' ? 'filled' : 'default'} onClick={() => setMode('weight')}>
          Цвет по весу
        </Button>
        <Button size="xs" variant={mode === 'place' ? 'filled' : 'default'} onClick={() => setMode('place')}>
          Цвет по месту
        </Button>
        {personalBoard && (
          <Button component={Link} to={`/live/t/${tournament.id}/compare`} size="xs" variant="light">
            Сравнить
          </Button>
        )}
      </Group>
      <table style={{ borderCollapse: 'collapse', minWidth: 720, width: '100%' }}>
        <thead>
          <tr>
            <th style={stickyHead}>{nameHeader}</th>
            {story.slots.map((slot) => (
              <th key={`${slot.tour}-${slot.mini}`} style={headCell}>
                {slotTitle(slot).replace(' тур · ', ' · ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={1 + story.slots.length} style={{ ...bodyCell, textAlign: 'left' }}>
                <Text size="sm" c="dimmed">
                  {zoneFilter === 'all' ? 'Нет строк' : 'В этой зоне никого'}
                </Text>
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const label =
                personalBoard && scope === 'personal'
                  ? row.athleteName ?? row.rosterNames[0] ?? row.teamName
                  : row.teamName
              const key = row.rosterMemberId ?? row.entryId
              return (
                <tr key={key}>
                  <td style={stickyCell}>
                    <Link
                      to={`/live/t/${tournament.id}/team/${row.entryId}`}
                      style={{ color: 'inherit', fontWeight: 700, textDecoration: 'none' }}
                    >
                      {label}
                      {row.junior ? (
                        <Text span size="xs" c="teal" ml={6} fw={700}>
                          Юн.
                        </Text>
                      ) : null}
                    </Link>
                    {personalBoard && scope === 'personal' && row.teamName ? (
                      <Text size="xs" c="dimmed">
                        {row.teamName}
                      </Text>
                    ) : null}
                  </td>
                  {row.cells.map((cell, index) => (
                    <td
                      key={index}
                      style={{
                        ...bodyCell,
                        background: cellColor(cell, mode, maxWeight, worstPlace),
                      }}
                    >
                      {cell.grams == null ? '—' : gramsLabel(cell.grams)}
                      {cell.place != null ? (
                        <Text size="xs" c="dimmed" style={{ display: 'block' }}>
                          {formatPlace(cell.place)}
                        </Text>
                      ) : null}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

function cellColor(cell: MatrixCell, mode: 'weight' | 'place', maxWeight: number, worstPlace: number): string {
  if (cell.grams == null) return 'transparent'
  if (mode === 'weight') {
    const mix = Math.round(16 + (cell.grams / maxWeight) * 74)
    return `color-mix(in srgb, var(--pc-signal) ${mix}%, var(--pc-panel))`
  }
  if (cell.place == null) return 'transparent'
  const mix = Math.round(16 + (1 - (cell.place - 1) / Math.max(1, worstPlace - 1)) * 70)
  return `color-mix(in srgb, var(--pc-zone-a) ${mix}%, var(--pc-panel))`
}

const stickyHead: CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 2,
  background: 'var(--pc-bg)',
  textAlign: 'left',
  padding: '6px 8px',
  fontWeight: 600,
  fontSize: 12,
}

const stickyCell: CSSProperties = {
  position: 'sticky',
  left: 0,
  zIndex: 1,
  background: 'var(--pc-panel)',
  padding: '6px 8px',
  borderBottom: '1px solid var(--pc-line)',
  minWidth: 140,
}

const headCell: CSSProperties = {
  padding: '6px 8px',
  fontSize: 12,
  fontWeight: 600,
  textAlign: 'right',
  whiteSpace: 'nowrap',
}

const bodyCell: CSSProperties = {
  padding: '6px 8px',
  textAlign: 'right',
  borderBottom: '1px solid var(--pc-line)',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
}
