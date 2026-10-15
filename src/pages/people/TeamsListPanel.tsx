import { useMemo, useState } from 'react'
import {
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconPlus, IconSearch } from '@tabler/icons-react'
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ScoreSurface } from '../../components/ui'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { createTeam, fetchActiveMemberships } from '../../features/tournament/api'
import { tournamentKeys, useTeamsCatalog } from '../../features/tournament/hooks'

export function TeamsListPanel() {
  const { teamId } = useParams()
  const { data: teams = [], isLoading } = useTeamsCatalog()
  const { role } = useAuth()
  const canEdit = canManageTournament(role)
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const memberQueries = useQueries({
    queries: teams.map((t) => ({
      queryKey: ['team', t.id, 'members'] as const,
      queryFn: () => fetchActiveMemberships(t.id),
      staleTime: 30_000,
    })),
  })

  const rows = useMemo(() => {
    return teams.map((team, index) => {
      const members = memberQueries[index]?.data ?? []
      const roster =
        members.length === 0
          ? 'Состав не назначен'
          : members
              .map((m) => m.athlete?.full_name)
              .filter(Boolean)
              .join(' · ')
      return { team, roster }
    })
  }, [teams, memberQueries])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter(
      ({ team, roster }) =>
        team.name.toLowerCase().includes(needle) || roster.toLowerCase().includes(needle),
    )
  }, [rows, q])

  const createMutation = useMutation({
    mutationFn: () => createTeam(name),
    onSuccess: async (created) => {
      setName('')
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.teams })
      navigate(`/teams/${created.id}`)
    },
  })

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={2}>Команды</Title>
          <Text size="sm" c="dimmed" mt={4}>
            {teams.length} в справочнике
          </Text>
        </div>
        {canEdit && (
          <Button
            color="depth"
            size="compact-md"
            leftSection={<IconPlus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Добавить
          </Button>
        )}
      </Group>

      <TextInput
        placeholder="Поиск по названию или рыбакам"
        leftSection={<IconSearch size={16} />}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
      />

      {isLoading && <Text c="dimmed">Загрузка…</Text>}

      <ScoreSurface p={0}>
        {filtered.map(({ team, roster }, i) => {
          const active = team.id === teamId
          return (
            <UnstyledButton
              key={team.id}
              component={Link}
              to={`/teams/${team.id}`}
              px="sm"
              py={10}
              style={{
                display: 'block',
                width: '100%',
                borderBottom:
                  i < filtered.length - 1 ? '1px solid var(--pc-hairline)' : undefined,
                borderLeft: active
                  ? '3px solid var(--mantine-color-depth-5)'
                  : '3px solid transparent',
                background: active
                  ? 'color-mix(in srgb, var(--mantine-color-depth-5) 10%, transparent)'
                  : 'transparent',
              }}
            >
              <Text fw={700} size="sm" truncate>
                {team.name}
              </Text>
              <Text size="xs" c="dimmed" lineClamp={2}>
                {roster}
              </Text>
            </UnstyledButton>
          )
        })}
        {!isLoading && filtered.length === 0 && (
          <Text c="dimmed" size="sm" p="sm">
            Ничего не найдено
          </Text>
        )}
      </ScoreSurface>

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Новая команда" centered>
        <Stack gap="sm">
          <TextInput label="Название" value={name} onChange={(e) => setName(e.currentTarget.value)} />
          {createMutation.isError && (
            <Text c="red" size="sm">
              {(createMutation.error as Error).message}
            </Text>
          )}
          <Button
            color="depth"
            disabled={!name.trim()}
            loading={createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            Создать
          </Button>
        </Stack>
      </Modal>
    </Stack>
  )
}
