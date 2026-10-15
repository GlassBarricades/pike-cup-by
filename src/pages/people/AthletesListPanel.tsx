import { useMemo, useState } from 'react'
import {
  Badge,
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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ScoreSurface } from '../../components/ui'
import { useAuth } from '../../features/auth/AuthProvider'
import { canManageTournament } from '../../features/auth/permissions'
import { createAthlete } from '../../features/tournament/api'
import { tournamentKeys, useAthletesCatalog } from '../../features/tournament/hooks'

export function AthletesListPanel({ compact }: { compact?: boolean }) {
  const { athleteId } = useParams()
  const { data: athletes = [], isLoading } = useAthletesCatalog()
  const { role } = useAuth()
  const canEdit = canManageTournament(role)
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return athletes
    return athletes.filter(
      (a) =>
        a.full_name.toLowerCase().includes(needle) ||
        (a.phone ?? '').includes(needle) ||
        (a.current_team_name ?? '').toLowerCase().includes(needle),
    )
  }, [athletes, q])

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')

  const createMutation = useMutation({
    mutationFn: () => createAthlete({ fullName, phone }),
    onSuccess: async (created) => {
      setFullName('')
      setPhone('')
      setCreateOpen(false)
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
      navigate(`/athletes/${created.id}`)
    },
  })

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="flex-start">
        <div>
          <Title order={compact ? 3 : 2}>Рыбаки</Title>
          {!compact && (
            <Text size="sm" c="dimmed" mt={4}>
              {athletes.length} в справочнике
            </Text>
          )}
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
        placeholder="Поиск по имени, телефону, команде"
        leftSection={<IconSearch size={16} />}
        value={q}
        onChange={(e) => setQ(e.currentTarget.value)}
      />

      {isLoading && <Text c="dimmed">Загрузка…</Text>}

      <ScoreSurface p={0} style={{ overflow: compact ? 'auto' : undefined, maxHeight: compact ? 280 : undefined }}>
        {filtered.map((a, i) => {
          const active = a.id === athleteId
          return (
            <UnstyledButton
              key={a.id}
              component={Link}
              to={`/athletes/${a.id}`}
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
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <div style={{ minWidth: 0 }}>
                  <Text fw={700} size="sm" truncate>
                    {a.full_name}
                  </Text>
                  <Text size="xs" c="dimmed" truncate>
                    {a.current_team_name ?? 'Без команды'}
                  </Text>
                </div>
                {!a.current_team_name && (
                  <Badge size="xs" color="gray" variant="light">
                    free
                  </Badge>
                )}
              </Group>
            </UnstyledButton>
          )
        })}
        {!isLoading && filtered.length === 0 && (
          <Text c="dimmed" size="sm" p="sm">
            Никого не найдено
          </Text>
        )}
      </ScoreSurface>

      <Modal opened={createOpen} onClose={() => setCreateOpen(false)} title="Новый рыбак" centered>
        <Stack gap="sm">
          <TextInput
            label="ФИО"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
          />
          <TextInput
            label="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
          />
          {createMutation.isError && (
            <Text c="red" size="sm">
              {(createMutation.error as Error).message}
            </Text>
          )}
          <Button
            color="depth"
            disabled={!fullName.trim()}
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
