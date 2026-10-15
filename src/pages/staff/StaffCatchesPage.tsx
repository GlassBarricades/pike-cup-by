import { useMemo, useState } from 'react'
import {
  Button,
  Group,
  NumberInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addCatch, deleteCatch, updateCatchWeight } from '../../features/tournament/api'
import { useAuth } from '../../features/auth/AuthProvider'
import { tournamentKeys, useCatches, useEntries, useMiniTours } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { oppositeZone } from '../../features/tournament/schedule'
import { ScoreSurface } from '../../components/ui'
import { entryTeamName, type CatchRow, type MiniTour, type TournamentEntry } from '../../features/tournament/types'

function miniTourLabel(entry: TournamentEntry | undefined, mini: MiniTour): string {
  const tourLabel = mini.tour_number === 1 ? 'I' : 'II'
  const zone =
    mini.tour_number === 1
      ? (entry?.start_zone ?? null)
      : oppositeZone(entry?.start_zone)
  const zonePart = zone ? ` · зона ${zone}` : ''
  return `${tourLabel} тур · МТ ${mini.mini_number}${zonePart}`
}

function formatLogTime(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function StaffCatchesPage() {
  const { user } = useAuth()
  const { selected: tournament } = useStaffTournament()
  const { data: entries = [] } = useEntries(tournament?.id)
  const { data: miniTours = [] } = useMiniTours(tournament?.id)
  const { data: catches = [] } = useCatches(tournament?.id)
  const queryClient = useQueryClient()

  const [entryId, setEntryId] = useState<string | null>(null)
  const [miniTourId, setMiniTourId] = useState<string | null>(null)
  const [weight, setWeight] = useState<number | string>(1000)
  const [logFilter, setLogFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState<number | string>('')

  const entryById = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries])
  const miniById = useMemo(() => new Map(miniTours.map((m) => [m.id, m])), [miniTours])

  const invalidateCatches = async () => {
    if (tournament) {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.catches(tournament.id) })
    }
  }

  const addMutation = useMutation({
    mutationFn: () =>
      addCatch({
        entryId: entryId!,
        miniTourId: miniTourId!,
        weightGrams: Number(weight),
        userId: user!.id,
      }),
    onSuccess: invalidateCatches,
  })

  const delMutation = useMutation({
    mutationFn: (id: string) => deleteCatch(id),
    onSuccess: async () => {
      setEditingId(null)
      await invalidateCatches()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, grams }: { id: string; grams: number }) => updateCatchWeight(id, grams),
    onSuccess: async () => {
      setEditingId(null)
      await invalidateCatches()
    },
  })

  const selectedEntry = entries.find((e) => e.id === entryId)

  const miniTourOptions = useMemo(
    () =>
      miniTours.map((m) => ({
        value: m.id,
        label: miniTourLabel(selectedEntry, m),
      })),
    [miniTours, selectedEntry],
  )

  const logRows = useMemo(() => {
    const needle = logFilter.trim().toLocaleLowerCase('ru')
    return catches
      .map((c) => ({
        catch: c,
        entry: entryById.get(c.entry_id),
        mini: miniById.get(c.mini_tour_id),
      }))
      .filter(({ entry }) => {
        if (!needle) return true
        const name = entry ? entryTeamName(entry) : ''
        return name.toLocaleLowerCase('ru').includes(needle)
      })
      .sort((a, b) => {
        const na = a.entry ? entryTeamName(a.entry) : ''
        const nb = b.entry ? entryTeamName(b.entry) : ''
        const byName = na.localeCompare(nb, 'ru')
        if (byName !== 0) return byName
        const ta = a.mini?.tour_number ?? 0
        const tb = b.mini?.tour_number ?? 0
        if (ta !== tb) return ta - tb
        const ma = a.mini?.mini_number ?? 0
        const mb = b.mini?.mini_number ?? 0
        if (ma !== mb) return ma - mb
        return a.catch.created_at.localeCompare(b.catch.created_at)
      })
  }, [catches, entryById, miniById, logFilter])

  const startEdit = (row: CatchRow) => {
    setEditingId(row.id)
    setEditWeight(row.weight_grams)
  }

  return (
    <Stack gap="lg" maw={960} mx="auto" w="100%">
      <Title order={2}>Взвешивание</Title>
      <Text size="sm" c="dimmed">
        Для архива достаточно внести суммарный вес в любой мини-тур I и II тура (например МТ1).
        Веса по всем мини-турам одного тура суммируются в протоколе.
      </Text>
      <Select
        label="Команда"
        data={entries
          .slice()
          .sort((a, b) => entryTeamName(a).localeCompare(entryTeamName(b), 'ru'))
          .map((e) => ({ value: e.id, label: entryTeamName(e) }))}
        value={entryId}
        onChange={setEntryId}
        searchable
      />
      <Select
        label="Мини-тур"
        data={miniTourOptions}
        value={miniTourId}
        onChange={setMiniTourId}
        description={
          selectedEntry
            ? `Для этой команды: I тур — зона ${selectedEntry.start_zone ?? '—'}, II тур — зона ${oppositeZone(selectedEntry.start_zone) ?? '—'}`
            : 'Выберите команду — в списке появится её зона'
        }
      />
      <NumberInput
        label="Вес, граммы (= баллы)"
        min={1}
        value={weight}
        onChange={setWeight}
      />
      <Button
        color="depth"
        size="lg"
        disabled={!entryId || !miniTourId || !user || Number(weight) <= 0}
        loading={addMutation.isPending}
        onClick={() => addMutation.mutate()}
      >
        Записать улов
      </Button>

      <Stack gap="sm">
        <Group justify="space-between" align="flex-end" wrap="wrap">
          <Text fw={600}>Журнал уловов ({catches.length})</Text>
          <TextInput
            placeholder="Фильтр по команде"
            leftSection={<IconSearch size={16} />}
            value={logFilter}
            onChange={(e) => setLogFilter(e.currentTarget.value)}
            maw={280}
            style={{ flex: 1 }}
          />
        </Group>
        {logFilter && (
          <Text size="xs" c="dimmed">
            Показано {logRows.length} из {catches.length}
          </Text>
        )}
        {(updateMutation.isError || delMutation.isError) && (
          <Text c="red" size="sm">
            {((updateMutation.error ?? delMutation.error) as Error).message}
          </Text>
        )}
        {catches.length === 0 ? (
          <Text c="dimmed" size="sm">
            Записей пока нет
          </Text>
        ) : (
          <ScoreSurface p={0}>
          <Table.ScrollContainer minWidth={720}>
            <Table withColumnBorders className="pc-scoreboard-table">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Команда</Table.Th>
                  <Table.Th>Тур / мини-тур</Table.Th>
                  <Table.Th ta="right">Вес, г</Table.Th>
                  <Table.Th>Когда</Table.Th>
                  <Table.Th w={160} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {logRows.map(({ catch: c, entry, mini }) => {
                  const isEditing = editingId === c.id
                  return (
                    <Table.Tr key={c.id}>
                      <Table.Td>{entry ? entryTeamName(entry) : c.entry_id.slice(0, 8)}</Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {mini ? miniTourLabel(entry, mini) : `МТ ${c.mini_tour_id.slice(0, 8)}…`}
                        </Text>
                      </Table.Td>
                      <Table.Td ta="right" className="pc-num">
                        {isEditing ? (
                          <NumberInput
                            min={1}
                            size="xs"
                            value={editWeight}
                            onChange={setEditWeight}
                            w={100}
                            ml="auto"
                          />
                        ) : (
                          c.weight_grams
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs" c="dimmed">
                          {formatLogTime(c.created_at)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                          {isEditing ? (
                            <>
                              <Button
                                size="compact-xs"
                                color="depth"
                                loading={updateMutation.isPending}
                                disabled={Number(editWeight) <= 0}
                                onClick={() =>
                                  updateMutation.mutate({ id: c.id, grams: Number(editWeight) })
                                }
                              >
                                OK
                              </Button>
                              <Button
                                size="compact-xs"
                                variant="subtle"
                                onClick={() => setEditingId(null)}
                              >
                                Отмена
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="compact-xs"
                                variant="subtle"
                                color="depth"
                                onClick={() => startEdit(c)}
                              >
                                Изменить
                              </Button>
                              <Button
                                size="compact-xs"
                                color="red"
                                variant="subtle"
                                loading={delMutation.isPending && delMutation.variables === c.id}
                                onClick={() => {
                                  const team = entry ? entryTeamName(entry) : 'запись'
                                  if (!window.confirm(`Удалить улов «${team}» (${c.weight_grams} г)?`)) {
                                    return
                                  }
                                  delMutation.mutate(c.id)
                                }}
                              >
                                Удалить
                              </Button>
                            </>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  )
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          </ScoreSurface>
        )}
      </Stack>
    </Stack>
  )
}
