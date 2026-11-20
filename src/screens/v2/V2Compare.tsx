import { useMemo, useState } from 'react'
import { SegmentedControl, Select, Stack, Text } from '@mantine/core'
import { useSearchParams } from 'react-router-dom'
import { getFormat, isIndividual } from '../../features/tournament/formats'
import { slotTitle } from '../../features/tournament/schedule'
import { gramsLabel, type MatrixRow } from '../../features/tournament/spectator'
import { useV2Tournament } from './context'

type Scope = 'personal' | 'team'

export function V2Compare() {
  const { tournament, story } = useV2Tournament()
  const individual = isIndividual(getFormat(tournament))
  const [params, setParams] = useSearchParams()
  const [scope, setScope] = useState<Scope>(individual ? 'personal' : 'team')

  const matrix: MatrixRow[] =
    individual && scope === 'team' ? story.matrixTeams : story.matrix

  const options = matrix.map((row) => ({
    value: row.rosterMemberId ?? row.entryId,
    label:
      scope === 'personal' && row.athleteName
        ? `${row.athleteName} · ${row.teamName}`
        : row.teamName,
  }))

  const leftId = params.get('a') ?? options[0]?.value ?? null
  const rightId = params.get('b') ?? options[1]?.value ?? options[0]?.value ?? null
  const left = matrix.find((row) => (row.rosterMemberId ?? row.entryId) === leftId)
  const right = matrix.find((row) => (row.rosterMemberId ?? row.entryId) === rightId)
  const max = useMemo(() => {
    const values = [...(left?.cells ?? []), ...(right?.cells ?? [])].map((cell) => cell.grams ?? 0)
    return Math.max(1, ...values)
  }, [left, right])

  function setSide(key: 'a' | 'b', value: string | null) {
    setParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) next.set(key, value)
      else next.delete(key)
      return next
    })
  }

  return (
    <Stack gap="md">
      {individual && (
        <SegmentedControl
          value={scope}
          onChange={(v) => {
            setScope(v as Scope)
            setParams(new URLSearchParams())
          }}
          data={[
            { value: 'personal', label: 'Личный' },
            { value: 'team', label: 'Командный' },
          ]}
        />
      )}
      <Select
        label={scope === 'personal' ? 'Первый спортсмен' : 'Первая команда'}
        data={options}
        value={leftId}
        onChange={(value) => setSide('a', value)}
        searchable
      />
      <Select
        label={scope === 'personal' ? 'Второй спортсмен' : 'Вторая команда'}
        data={options}
        value={rightId}
        onChange={(value) => setSide('b', value)}
        searchable
      />
      <Track
        rowName={left?.athleteName ?? left?.teamName ?? '—'}
        cells={left?.cells ?? []}
        max={max}
        color="var(--pc-signal)"
        slots={story.slots}
      />
      <Track
        rowName={right?.athleteName ?? right?.teamName ?? '—'}
        cells={right?.cells ?? []}
        max={max}
        color="var(--pc-zone-a)"
        slots={story.slots}
      />
    </Stack>
  )
}

function Track({
  rowName,
  cells,
  max,
  color,
  slots,
}: {
  rowName: string
  cells: { grams: number | null }[]
  max: number
  color: string
  slots: { tour: number; mini: number }[]
}) {
  return (
    <Stack gap={6}>
      <Text fw={700}>{rowName}</Text>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {slots.map((slot, index) => {
          const grams = cells[index]?.grams ?? 0
          return (
            <div key={`${slot.tour}-${slot.mini}`} style={{ flex: 1 }} title={slotTitle(slot)}>
              <div
                style={{
                  height: `${Math.max(4, (grams / max) * 100)}px`,
                  background: cells[index]?.grams == null ? 'var(--pc-line)' : color,
                }}
              />
              <Text size="xs" c="dimmed" ta="center">
                {cells[index]?.grams == null ? '—' : gramsLabel(grams)}
              </Text>
            </div>
          )
        })}
      </div>
    </Stack>
  )
}
