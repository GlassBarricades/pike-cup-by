import { useState } from 'react'
import { Button, Group, Stack, Text, TextInput, Title, Badge } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { createAthlete, updateAthlete } from '../../features/tournament/api'
import { tournamentKeys, useAthletesCatalog } from '../../features/tournament/hooks'
import type { AthleteWithTeam } from '../../features/tournament/api'

export function StaffAthletesPage() {
  const { data: athletes = [], isLoading } = useAthletesCatalog()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [editing, setEditing] = useState<AthleteWithTeam | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const createMutation = useMutation({
    mutationFn: () => createAthlete({ fullName, phone }),
    onSuccess: async () => {
      setFullName('')
      setPhone('')
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
    },
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateAthlete(editing!.id, { fullName: editName, phone: editPhone }),
    onSuccess: async () => {
      setEditing(null)
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.athletes })
    },
  })

  return (
    <Stack gap="lg" maw={560} mx="auto">
      <div>
        <Title order={2}>Рыбаки</Title>
        <Text size="sm" c="dimmed" mt={4}>
          Сначала создайте рыбаков, затем соберите из них команду на странице{' '}
          <Text span component={Link} to="/staff/teams" c="depth" inherit>
            Команды
          </Text>
          .
        </Text>
      </div>

      <Stack gap="sm">
        <Text fw={600}>Новый рыбак</Text>
        <TextInput
          label="ФИО"
          placeholder="Иванов Иван Иванович"
          value={fullName}
          onChange={(e) => setFullName(e.currentTarget.value)}
        />
        <TextInput
          label="Телефон"
          placeholder="+375..."
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
        />
        <Button
          color="depth"
          disabled={!fullName.trim()}
          loading={createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          Создать рыбака
        </Button>
        {createMutation.isError && (
          <Text c="red" size="sm">
            {(createMutation.error as Error).message}
          </Text>
        )}
      </Stack>

      <Stack gap="xs">
        <Text fw={600}>Все рыбаки ({athletes.length})</Text>
        {isLoading && <Text c="dimmed">Загрузка…</Text>}
        {athletes.map((a) => (
          <Stack
            key={a.id}
            gap={4}
            p="sm"
            style={{
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: 8,
            }}
          >
            {editing?.id === a.id ? (
              <>
                <TextInput
                  label="ФИО"
                  value={editName}
                  onChange={(e) => setEditName(e.currentTarget.value)}
                />
                <TextInput
                  label="Телефон"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.currentTarget.value)}
                />
                <Group>
                  <Button
                    color="depth"
                    size="compact-sm"
                    loading={updateMutation.isPending}
                    disabled={!editName.trim()}
                    onClick={() => updateMutation.mutate()}
                  >
                    Сохранить
                  </Button>
                  <Button size="compact-sm" variant="subtle" onClick={() => setEditing(null)}>
                    Отмена
                  </Button>
                </Group>
              </>
            ) : (
              <>
                <Group justify="space-between" align="flex-start">
                  <div>
                    <Text fw={600}>{a.full_name}</Text>
                    {a.phone && (
                      <Text size="sm" c="dimmed">
                        {a.phone}
                      </Text>
                    )}
                  </div>
                  <Badge color={a.current_team_name ? 'depth' : 'gray'} variant="light">
                    {a.current_team_name ?? 'Без команды'}
                  </Badge>
                </Group>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="depth"
                  onClick={() => {
                    setEditing(a)
                    setEditName(a.full_name)
                    setEditPhone(a.phone ?? '')
                  }}
                >
                  Изменить
                </Button>
              </>
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
