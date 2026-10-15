import { useEffect, useState } from 'react'
import { Button, Checkbox, Modal, Select, Stack, Text, TextInput } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTournamentMeta } from '../features/tournament/api'
import { tournamentKeys } from '../features/tournament/hooks'
import type { Tournament, TournamentStatus } from '../features/tournament/types'

export function EditTournamentModal({
  tournament,
  opened,
  onClose,
}: {
  tournament: Tournament | null
  opened: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [status, setStatus] = useState<TournamentStatus>('published')
  const [organizers, setOrganizers] = useState('')
  const [zeroPlacePlusOne, setZeroPlacePlusOne] = useState(true)

  useEffect(() => {
    if (!tournament || !opened) return
    setName(tournament.name)
    setLocation(tournament.location)
    setEventDate(tournament.event_date)
    setStatus(tournament.status)
    setOrganizers(tournament.organizers.join(', '))
    setZeroPlacePlusOne(tournament.zero_place_is_group_size_plus_one !== false)
  }, [tournament, opened])

  const mutation = useMutation({
    mutationFn: () =>
      updateTournamentMeta(tournament!.id, {
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
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.byId(tournament.id) })
      }
      onClose()
    },
  })

  return (
    <Modal opened={opened} onClose={onClose} title="Редактировать турнир" centered>
      <Stack gap="sm">
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
            { value: 'finished', label: 'Завершён (архив)' },
            { value: 'published', label: 'Опубликован (актуальный)' },
            { value: 'live', label: 'Идёт' },
            { value: 'draft', label: 'Черновик' },
          ]}
          value={status}
          onChange={(v) => setStatus((v as TournamentStatus) ?? 'published')}
        />
        <Checkbox
          label="Ноль улова = размер группы + 1"
          description="Если выключено — ноль даёт место равное размеру группы"
          checked={zeroPlacePlusOne}
          onChange={(e) => setZeroPlacePlusOne(e.currentTarget.checked)}
        />
        {mutation.isError && (
          <Text c="red" size="sm">
            {(mutation.error as Error).message}
          </Text>
        )}
        <Button
          color="depth"
          fullWidth
          disabled={!tournament || !name || !eventDate || !location}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Сохранить
        </Button>
      </Stack>
    </Modal>
  )
}
