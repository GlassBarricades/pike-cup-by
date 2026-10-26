import { useState, type CSSProperties } from 'react'
import { Button, Group, Text } from '@mantine/core'
import { Link } from 'react-router-dom'
import { formatPlace } from '../../features/tournament/scoring'
import { slotTitle } from '../../features/tournament/schedule'
import { gramsLabel, type MatrixCell } from '../../features/tournament/spectator'
import { useV2Tournament } from './context'

export function V2Matrix() {
  const { tournament, story } = useV2Tournament()
  const [mode, setMode] = useState<'weight' | 'place'>('weight')
  const maxWeight = Math.max(1, ...story.matrix.flatMap((row) => row.cells.map((cell) => cell.grams ?? 0)))
  const worstPlace = Math.max(1, ...story.matrix.flatMap((row) => row.cells.map((cell) => cell.place ?? 0)))

  return (
    <div style={{ overflowX: 'auto' }}>
      <Group gap={6} mb="sm">
        <Button size="xs" variant={mode === 'weight' ? 'filled' : 'default'} onClick={() => setMode('weight')}>
          Цвет по весу
        </Button>
        <Button size="xs" variant={mode === 'place' ? 'filled' : 'default'} onClick={() => setMode('place')}>
          Цвет по месту
        </Button>
      </Group>
      <table style={{ borderCollapse: 'collapse', minWidth: 720, width: '100%' }}>
        <thead>
          <tr>
            <th style={stickyHead}>Команда</th>
            {story.slots.map((slot) => (
              <th key={`${slot.tour}-${slot.mini}`} style={headCell}>
                {slotTitle(slot).replace(' тур · ', ' · ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {story.matrix.map((row) => (
            <tr key={row.entryId}>
              <td style={stickyCell}>
                <Link to={`/live/t/${tournament.id}/team/${row.entryId}`} style={{ color: 'inherit', fontWeight: 700, textDecoration: 'none' }}>
                  {row.teamName}
                </Link>
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
          ))}
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
