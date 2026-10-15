import { useMemo, useState } from 'react'
import { Badge, Group, Select, Stack, Table, Text, TextInput } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchAllProfiles, updateProfileRole } from '../../features/auth/api'
import { useAuth } from '../../features/auth/AuthProvider'
import { roleLabel } from '../../features/auth/permissions'
import type { AppRole } from '../../features/auth/types'
import { EmptyState, PageHeader, Panel } from '../../ui'

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: 'participant', label: roleLabel.participant },
  { value: 'judge', label: roleLabel.judge },
  { value: 'organizer', label: roleLabel.organizer },
  { value: 'admin', label: roleLabel.admin },
]

const roleColor: Record<AppRole, string> = {
  participant: 'gray',
  judge: 'zoneB',
  organizer: 'signal',
  admin: 'orange',
}

const profilesKey = ['profiles', 'all'] as const

export function RolesScreen() {
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: profilesKey,
    queryFn: fetchAllProfiles,
  })

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('ru')
    if (!needle) return profiles
    return profiles.filter((p) => {
      const name = (p.full_name ?? '').toLocaleLowerCase('ru')
      const id = p.id.toLocaleLowerCase()
      return (
        name.includes(needle) ||
        id.includes(needle) ||
        roleLabel[p.role].toLocaleLowerCase('ru').includes(needle)
      )
    })
  }, [profiles, search])

  const mutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) =>
      updateProfileRole(userId, role),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: profilesKey })
      await queryClient.invalidateQueries({ queryKey: ['judgeCandidates'] })
      if (vars.userId === user?.id) {
        await refreshProfile()
      }
    },
  })

  const changeRole = (userId: string, current: AppRole, next: AppRole | null) => {
    if (!next || next === current) return

    if (userId === user?.id && current === 'admin' && next !== 'admin') {
      if (
        !window.confirm(
          'Вы снимаете с себя роль админа. После этого вы не сможете назначать роли. Продолжить?',
        )
      ) {
        return
      }
    } else {
      const name =
        profiles.find((p) => p.id === userId)?.full_name?.trim() || userId.slice(0, 8)
      if (
        !window.confirm(
          `Назначить «${name}» роль «${roleLabel[next]}» (сейчас «${roleLabel[current]}»)?`,
        )
      ) {
        return
      }
    }

    mutation.mutate({ userId, role: next })
  }

  const counts = useMemo(() => {
    const c: Record<AppRole, number> = {
      participant: 0,
      judge: 0,
      organizer: 0,
      admin: 0,
    }
    for (const p of profiles) c[p.role] += 1
    return c
  }, [profiles])

  return (
    <Stack gap="lg" w="100%">
      <div>
        <PageHeader title="Роли пользователей" />
        <Text size="sm" c="dimmed" mt={4}>
          Только админ может менять роли. Судьи с ролью judge появятся в назначении на зоны.
        </Text>
      </div>

      <Group gap="xs" wrap="wrap">
          {(Object.keys(roleLabel) as AppRole[]).map((r) => (
            <Badge key={r} color={roleColor[r]} variant="light" className="pc-tabular">
              {roleLabel[r]}: {counts[r]}
            </Badge>
          ))}
        </Group>

        <TextInput
          placeholder="Поиск по имени или роли"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          maw={360}
        />

        {mutation.isError && (
          <Text c="red" size="sm">
            {(mutation.error as Error).message}
          </Text>
        )}

        {isLoading ? (
          <Text c="dimmed" size="sm">
            Загрузка…
          </Text>
        ) : filtered.length === 0 ? (
          <EmptyState title="Пользователи не найдены" />
        ) : (
          <Panel p={0}>
            <Table.ScrollContainer minWidth={560}>
              <Table withColumnBorders className="pc-scoreboard-table">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Имя</Table.Th>
                    <Table.Th>Роль</Table.Th>
                    <Table.Th w={200}>Назначить</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {filtered.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {p.full_name?.trim() || 'Без имени'}
                          {p.id === user?.id ? (
                            <Text span c="dimmed" size="xs" ml={6}>
                              (вы)
                            </Text>
                          ) : null}
                        </Text>
                        <Text size="xs" c="dimmed" className="pc-tabular">
                          {p.id.slice(0, 8)}…
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={roleColor[p.role]} variant="filled" size="sm">
                          {roleLabel[p.role]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Select
                          size="xs"
                          data={ROLE_OPTIONS}
                          value={p.role}
                          disabled={mutation.isPending}
                          onChange={(v) => changeRole(p.id, p.role, v as AppRole | null)}
                          allowDeselect={false}
                        />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Panel>
      )}
    </Stack>
  )
}
