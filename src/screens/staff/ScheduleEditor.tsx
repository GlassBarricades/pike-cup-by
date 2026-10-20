import { Button, Group, NumberInput, Stack, Text, TextInput } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { saveScheduleDraft } from '../../features/tournament/api'
import { tournamentKeys } from '../../features/tournament/hooks'
import { formatTime } from '../../features/tournament/schedule'
import {
  draftFromSegments,
  fromMinskInput,
  insertStage,
  removeRow,
  rowBounds,
  setAnchor,
  setRowMinutes,
  setRowTitle,
  toMinskInput,
  toWriteRows,
  type ScheduleDraft,
} from '../../features/tournament/scheduleEdit'
import type { ScheduleSegment } from '../../features/tournament/types'
import { Panel, SectionTitle } from '../../ui'

function segmentSignature(segments: ScheduleSegment[]): string {
  return segments
    .map(
      (segment) =>
        `${segment.id}:${segment.sort_order}:${segment.key}:${segment.title}:${segment.window_kind ?? ''}:${segment.planned_starts_at}:${segment.planned_ends_at}`,
    )
    .join('|')
}

function kindLabel(kind: ScheduleDraft['rows'][number]['kind']): string {
  if (kind === 'fishing') return 'Ловля'
  if (kind === 'move') return 'Переход'
  return 'Этап'
}

export function ScheduleEditor({
  tournamentId,
  segments,
}: {
  tournamentId: string
  segments: ScheduleSegment[]
}) {
  const queryClient = useQueryClient()
  const signature = segmentSignature(segments)
  const [seen, setSeen] = useState(signature)
  const [draft, setDraft] = useState<ScheduleDraft>(() => draftFromSegments(segments))
  if (seen !== signature) {
    setSeen(signature)
    setDraft(draftFromSegments(segments))
  }

  const bounds = rowBounds(draft)
  const mutation = useMutation({
    mutationFn: () => saveScheduleDraft(tournamentId, toWriteRows(draft)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.segments(tournamentId) })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournamentId) })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
    },
  })

  return (
    <Panel>
      <Stack gap="md">
        <SectionTitle>Расписание дня</SectionTitle>
        <Text size="sm" c="dimmed">
          Уловы останутся. Сдвиг и пауза сбросятся.
        </Text>
        <Group align="flex-end" wrap="wrap">
          <TextInput
            type="datetime-local"
            label="Старт дня"
            value={toMinskInput(draft.anchor)}
            onChange={(event) => {
              const next = fromMinskInput(event.currentTarget.value)
              if (next) setDraft((current) => setAnchor(current, next))
            }}
            style={{ flex: '1 1 220px' }}
          />
          <Button
            variant="default"
            onClick={() => setDraft((current) => setAnchor(current, fromMinskInput(toMinskInput(new Date())) ?? new Date()))}
          >
            Поставить на сейчас
          </Button>
          <Button variant="default" onClick={() => setDraft((current) => insertStage(current, -1))}>
            Этап в начало
          </Button>
        </Group>
        <Stack gap="sm">
          {draft.rows.map((row, index) => (
            <Stack key={row.key} gap={4}>
              <Text size="xs" c="dimmed" className="pc-tabular">
                {formatTime(bounds[index].startsAt.toISOString())}–{formatTime(bounds[index].endsAt.toISOString())} ·{' '}
                {kindLabel(row.kind)}
              </Text>
              <Group align="flex-end" wrap="wrap" gap="xs">
                <TextInput
                  aria-label="Название окна"
                  value={row.title}
                  onChange={(event) => {
                    const title = event.currentTarget.value
                    setDraft((current) => setRowTitle(current, index, title))
                  }}
                  style={{ flex: '1 1 180px' }}
                />
                <NumberInput
                  aria-label="Длительность, минуты"
                  min={1}
                  value={row.minutes}
                  onChange={(value) => setDraft((current) => setRowMinutes(current, index, Number(value) || 1))}
                  w={100}
                  suffix=" мин"
                />
                {row.lockedFishing ? null : (
                  <Button size="xs" variant="subtle" color="gray" onClick={() => setDraft((current) => removeRow(current, index))}>
                    Убрать
                  </Button>
                )}
                <Button size="xs" variant="default" onClick={() => setDraft((current) => insertStage(current, index))}>
                  Этап ниже
                </Button>
              </Group>
            </Stack>
          ))}
        </Stack>
        <Button color="signal" loading={mutation.isPending} onClick={() => mutation.mutate()}>
          Записать расписание
        </Button>
        {mutation.isError ? (
          <Text c="red" size="sm">
            {(mutation.error as Error).message}
          </Text>
        ) : null}
      </Stack>
    </Panel>
  )
}
