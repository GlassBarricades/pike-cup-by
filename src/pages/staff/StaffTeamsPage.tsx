import { useEffect, useMemo, useState } from 'react'
import { Button, Group, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  clearTeamMembers,
  createTeam,
  deleteTeam,
  fetchActiveMemberships,
  renameTeam,
  setTeamMembers,
} from '../../features/tournament/api'
import {
  tournamentKeys,
  useAthletesCatalog,
  useTeamsCatalog,
} from '../../features/tournament/hooks'

export function StaffTeamsPage() {
  const { data: teams = [], refetch } = useTeamsCatalog()
  const { data: athletes = [] } = useAthletesCatalog()
  const queryClient = useQueryClient()

  const [name, setName] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rename, setRename] = useState('')
  const [slot1, setSlot1] = useState<string | null>(null)
  const [slot2, setSlot2] = useState<string | null>(null)

  const membershipsQuery = useQuery({
    queryKey: ['team-memberships', selectedId],
    queryFn: () => fetchActiveMemberships(selectedId!),
    enabled: Boolean(selectedId),
  })

  useEffect(() => {
    const members = membershipsQuery.data ?? []
    setSlot1(members[0]?.athlete_id ?? null)
    setSlot2(members[1]?.athlete_id ?? null)
    const team = teams.find((t) => t.id === selectedId)
    setRename(team?.name ?? '')
  }, [membershipsQuery.data, selectedId, teams])

  const athleteOptions = useMemo(() => {
    return athletes.map((a) => {
      const onOtherTeam = a.current_team_id && a.current_team_id !== selectedId
      const label = onOtherTeam
        ? `${a.full_name} (сейчас: ${a.current_team_name})`
        : a.full_name
      return { value: a.id, label }
    })
  }, [athletes, selectedId])

  const createMutation = useMutation({
    mutationFn: () => createTeam(name),
    onSuccess: async (team) => {
      setName('')
      setSelectedId(team.id)
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.teams })
      await refetch()
    },
  })

  const renameMutation = useMutation({
    mutationFn: () => renameTeam(selectedId!, rename),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.teams })
      if (selectedId) {
        await queryClient.invalidateQueries({ queryKey: ['team', selectedId, 'name-history'] })
        await queryClient.invalidateQueries({ queryKey: ['team', selectedId] })
      }
    },
  })

  const assignMutation = useMutation({
    mutationFn: () => setTeamMembers(selectedId!, [slot1!, slot2!]),
    onSuccess: async () => {
      await membershipsQuery.refetch()
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
    },
  })

  const clearMutation = useMutation({
    mutationFn: () => clearTeamMembers(selectedId!),
    onSuccess: async () => {
      setSlot1(null)
      setSlot2(null)
      await membershipsQuery.refetch()
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTeam(selectedId!),
    onSuccess: async () => {
      setSelectedId(null)
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.teams })
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
      await refetch()
    },
  })

  return (
    <Stack gap="lg" maw={560} mx="auto">
      <div>
        <Title order={2}>Команды</Title>
        <Text size="sm" c="dimmed" mt={4}>
          1) Создайте рыбаков в{' '}
          <Text span component={Link} to="/staff/athletes" c="depth" inherit>
            Рыбаки
          </Text>
          . 2) Создайте команду. 3) Назначьте двух рыбаков в состав. При заявке на турнир
          сохранится именно этот состав.
        </Text>
      </div>

      <Stack gap="sm">
        <Text fw={600}>Новая команда</Text>
        <TextInput
          label="Название"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Button
          color="depth"
          disabled={!name.trim()}
          loading={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          Создать команду
        </Button>
        {createMutation.isError && (
          <Text c="red" size="sm">
            {(createMutation.error as Error).message}
          </Text>
        )}
      </Stack>

      <Stack gap="xs">
        <Text fw={600}>Команды ({teams.length})</Text>
        {teams.map((team) => (
          <Button
            key={team.id}
            variant={selectedId === team.id ? 'filled' : 'light'}
            color="depth"
            onClick={() => setSelectedId(team.id)}
          >
            {team.name}
          </Button>
        ))}
      </Stack>

      {selectedId && (
        <Stack gap="sm">
          <Text fw={600}>Состав и настройки</Text>
          <TextInput
            label="Название команды"
            value={rename}
            onChange={(e) => setRename(e.currentTarget.value)}
          />
          <Group>
            <Button
              variant="light"
              color="depth"
              disabled={!rename.trim()}
              loading={renameMutation.isPending}
              onClick={() => renameMutation.mutate()}
            >
              Переименовать
            </Button>
            <Button
              variant="light"
              color="red"
              loading={deleteMutation.isPending}
              onClick={() => {
                const team = teams.find((t) => t.id === selectedId)
                if (
                  !window.confirm(
                    `Удалить команду «${team?.name ?? ''}»? Состав будет снят, снимки в протоколах турниров сохранятся.`,
                  )
                ) {
                  return
                }
                deleteMutation.mutate()
              }}
            >
              Удалить команду
            </Button>
          </Group>
          {deleteMutation.isError && (
            <Text c="red" size="sm">
              {(deleteMutation.error as Error).message}
            </Text>
          )}

          <Select
            label="Рыбак 1"
            data={athleteOptions.filter((o) => o.value !== slot2)}
            value={slot1}
            onChange={setSlot1}
            searchable
            clearable
            nothingFoundMessage="Сначала создайте рыбаков"
          />
          <Select
            label="Рыбак 2"
            data={athleteOptions.filter((o) => o.value !== slot1)}
            value={slot2}
            onChange={setSlot2}
            searchable
            clearable
            nothingFoundMessage="Сначала создайте рыбаков"
          />
          <Text size="xs" c="dimmed">
            Если рыбак уже в другой команде, при сохранении он будет переведён в эту.
            Снимки прошлых турниров не меняются.
          </Text>
          <Group>
            <Button
              color="depth"
              disabled={!slot1 || !slot2 || slot1 === slot2}
              loading={assignMutation.isPending}
              onClick={() => assignMutation.mutate()}
            >
              Сохранить состав
            </Button>
            <Button
              variant="subtle"
              color="red"
              loading={clearMutation.isPending}
              onClick={() => clearMutation.mutate()}
            >
              Очистить состав
            </Button>
          </Group>
          {assignMutation.isError && (
            <Text c="red" size="sm">
              {(assignMutation.error as Error).message}
            </Text>
          )}
        </Stack>
      )}
    </Stack>
  )
}
