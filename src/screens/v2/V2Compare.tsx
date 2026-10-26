import { useMemo } from 'react'
import { Select, Stack, Text } from '@mantine/core'
import { useSearchParams } from 'react-router-dom'
import { slotTitle } from '../../features/tournament/schedule'
import { gramsLabel } from '../../features/tournament/spectator'
import { useV2Tournament } from './context'

export function V2Compare() {
  const { story } = useV2Tournament()
  const [params, setParams] = useSearchParams()
  const options = story.matrix.map((row) => ({ value: row.entryId, label: row.teamName }))
  const leftId = params.get('a') ?? story.matrix[0]?.entryId ?? null
  const rightId = params.get('b') ?? story.matrix[1]?.entryId ?? story.matrix[0]?.entryId ?? null
  const left = story.matrix.find((row) => row.entryId === leftId)
  const right = story.matrix.find((row) => row.entryId === rightId)
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
      <Select label="Первая команда" data={options} value={leftId} onChange={(value) => setSide('a', value)} searchable />
      <Select label="Вторая команда" data={options} value={rightId} onChange={(value) => setSide('b', value)} searchable />
      <Track rowName={left?.teamName ?? '—'} cells={left?.cells ?? []} max={max} color="var(--pc-signal)" slots={story.slots} />
      <Track rowName={right?.teamName ?? '—'} cells={right?.cells ?? []} max={max} color="var(--pc-zone-a)" slots={story.slots} />
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
  slots: { tour: 1 | 2; mini: number }[]
}) {
  return (
    <Stack gap={6}>
      <Text fw={700}>{rowName}</Text>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {slots.map((slot, index) => {
          const grams = cells[index]?.grams ?? 0
          return (
            <div key={`${slot.tour}-${slot.mini}`} style={{ flex: 1 }} title={slotTitle(slot)}>
              <div style={{ height: `${Math.max(4, (grams / max) * 100)}px`, background: cells[index]?.grams == null ? 'var(--pc-line)' : color }} />
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
