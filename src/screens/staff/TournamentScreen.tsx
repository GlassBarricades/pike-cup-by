import { useEffect, useState } from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTournament, updateTournamentMeta } from '../../features/tournament/api'
import { formatTournamentDate, statusLabel } from '../../features/tournament/date'
import { tournamentKeys } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import type { TournamentStatus } from '../../features/tournament/types'
import { EmptyState, PageHero, Panel, SectionTitle } from '../../ui'

export function TournamentScreen() {
  const { selected, setSelectedId, tournaments } = useStaffTournament()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [status, setStatus] = useState<TournamentStatus>('published')
  const [organizers, setOrganizers] = useState('')
  const [zeroPlacePlusOne, setZeroPlacePlusOne] = useState(true)

  const [newName, setNewName] = useState('Pike Cup in Belarus')
  const [newLocation, setNewLocation] = useState('озеро Повстынь')
  const [newDate, setNewDate] = useState('')
  const [newStatus, setNewStatus] = useState<TournamentStatus>('finished')
  const [newOrganizers, setNewOrganizers] = useState('Артемчик Евгений, Зубко Сергей')
  const [withSchedule, setWithSchedule] = useState(true)
  const [copyRules, setCopyRules] = useState(true)
  const [newZeroPlacePlusOne, setNewZeroPlacePlusOne] = useState(true)

  const queryClient = useQueryClient()

  useEffect(() => {
    if (!selected) return
    setName(selected.name)
    setLocation(selected.location)
    setEventDate(selected.event_date)
    setStatus(selected.status)
    setOrganizers(selected.organizers.join(', '))
    setZeroPlacePlusOne(selected.zero_place_is_group_size_plus_one !== false)
  }, [selected])

  const saveMutation = useMutation({
    mutationFn: () =>
      updateTournamentMeta(selected!.id, {
        name,
        location,
        event_date: eventDate,
        status,
        organizers: organizers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        zero_place_is_group_size_plus_one: zeroPlacePlusOne,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      if (selected) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(selected.id) })
      }
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const rulesSource = copyRules
        ? tournaments.find((t) => t.rules_content?.length > 40)?.rules_content
        : undefined
      return createTournament({
        name: newName,
        eventDate: newDate,
        location: newLocation,
        status: newStatus,
        organizers: newOrganizers
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        rulesContent: rulesSource,
        withDefaultSchedule: withSchedule,
        zeroPlaceIsGroupSizePlusOne: newZeroPlacePlusOne,
      })
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.list })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.active })
      setSelectedId(created.id)
      setNewDate('')
    },
  })

  return (
    <Stack gap="lg">
      <PageHero
        title="Турниры"
        subtitle="Создайте архивный или актуальный турнир, затем отредактируйте выбранный."
      />

      <Panel>
        <Stack gap="md">
          <SectionTitle>Создать турнир</SectionTitle>
          <Text size="sm" c="dimmed">
            Для прошедших протоколов выберите статус «Завершён», затем добавьте заявки, зоны и веса в
            разделах штаба.
          </Text>
          <TextInput
            label="Название"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
          />
          <TextInput
            label="Дата"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.currentTarget.value)}
          />
          <TextInput
            label="Место"
            value={newLocation}
            onChange={(e) => setNewLocation(e.currentTarget.value)}
          />
          <TextInput
            label="Оргкомитет (через запятую)"
            value={newOrganizers}
            onChange={(e) => setNewOrganizers(e.currentTarget.value)}
          />
          <Select
            label="Статус"
            data={[
              { value: 'finished', label: 'Завершён (архив)' },
              { value: 'published', label: 'Опубликован (актуальный)' },
              { value: 'live', label: 'Идёт' },
              { value: 'draft', label: 'Черновик' },
            ]}
            value={newStatus}
            onChange={(v) => setNewStatus((v as TournamentStatus) ?? 'finished')}
          />
          <Checkbox
            label="Создать типовое расписание и мини-туры"
            checked={withSchedule}
            onChange={(e) => setWithSchedule(e.currentTarget.checked)}
          />
          <Checkbox
            label="Скопировать регламент с существующего турнира"
            checked={copyRules}
            onChange={(e) => setCopyRules(e.currentTarget.checked)}
          />
          <Checkbox
            label="Ноль улова = размер группы + 1"
            description="Если выключено — ноль даёт место равное размеру группы (как в части архивных протоколов)"
            checked={newZeroPlacePlusOne}
            onChange={(e) => setNewZeroPlacePlusOne(e.currentTarget.checked)}
          />
          <Button
            color="signal"
            disabled={!newName || !newDate || !newLocation}
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Создать турнир
          </Button>
          {createMutation.isError && (
            <Text c="red" size="sm">
              {(createMutation.error as Error).message}
            </Text>
          )}
        </Stack>
      </Panel>

      <Divider label="Редактировать выбранный" labelPosition="center" />

      {selected ? (
        <Panel>
          <Stack gap="md">
            <SectionTitle>Выбранный турнир</SectionTitle>
            <Text size="sm" c="dimmed">
              {formatTournamentDate(selected.event_date)} · {statusLabel[selected.status]}
            </Text>
            <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} />
            <TextInput
              label="Дата"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.currentTarget.value)}
            />
            <TextInput
              label="Место"
              value={location}
              onChange={(e) => setLocation(e.currentTarget.value)}
            />
            <TextInput
              label="Оргкомитет (через запятую)"
              value={organizers}
              onChange={(e) => setOrganizers(e.currentTarget.value)}
            />
            <Select
              label="Статус"
              data={[
                { value: 'draft', label: 'Черновик' },
                { value: 'published', label: 'Опубликован' },
                { value: 'live', label: 'Идёт' },
                { value: 'finished', label: 'Завершён (архив)' },
              ]}
              value={status}
              onChange={(v) => setStatus((v as TournamentStatus) ?? 'published')}
            />
            <Checkbox
              label="Ноль улова = размер группы + 1"
              description="Если выключено — ноль даёт место равное размеру группы (как в части архивных протоколов)"
              checked={zeroPlacePlusOne}
              onChange={(e) => setZeroPlacePlusOne(e.currentTarget.checked)}
            />
            <Button color="signal" loading={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              Сохранить
            </Button>
          </Stack>
        </Panel>
      ) : (
        <EmptyState title="Нет выбранного турнира" description="Выберите турнир сверху или создайте новый." />
      )}
    </Stack>
  )
}
