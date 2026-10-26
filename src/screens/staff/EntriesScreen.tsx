import { useState } from 'react'
import { Button, Group, MultiSelect, Select, Stack, Text, TextInput } from '@mantine/core'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createEntryFromTeam, deleteEntry, lockAllRosters } from '../../features/tournament/api'
import { tournamentKeys, useEntries, useTeamsCatalog } from '../../features/tournament/hooks'
import { useStaffTournament } from '../../features/tournament/StaffTournamentContext'
import { useTournamentDayClosed } from '../../features/tournament/useTournamentDayClosed'
import { entryTeamName, type TeamQuota } from '../../features/tournament/types'
import { ClosedDayNotice, EmptyState, PageHero, Panel, SectionTitle } from '../../ui'

export function EntriesScreen() {
  const { selected: tournament } = useStaffTournament()
  const closed = useTournamentDayClosed()
  const { data: teams = [] } = useTeamsCatalog()
  const { data: entries = [] } = useEntries(tournament?.id)
  const queryClient = useQueryClient()
  const [teamIds, setTeamIds] = useState<string[]>([])
  const [quota, setQuota] = useState<TeamQuota>('open')
  const [phone, setPhone] = useState('')
  const [batchMessage, setBatchMessage] = useState<string | null>(null)

  const enteredIds = new Set(
    entries.map((e) => e.team_id).filter((id): id is string => Boolean(id)),
  )
  const available = teams.filter((t) => !enteredIds.has(t.id))

  const addMutation = useMutation({
    mutationFn: async () => {
      const errors: string[] = []
      let ok = 0

      for (const teamId of teamIds) {
        const teamName = teams.find((t) => t.id === teamId)?.name ?? teamId
        try {
          await createEntryFromTeam({
            tournamentId: tournament!.id,
            teamId,
            quota,
            contactPhone: phone || undefined,
          })
          ok += 1
        } catch (e) {
          errors.push(`${teamName}: ${(e as Error).message}`)
        }
      }

      if (ok === 0 && errors.length > 0) {
        throw new Error(errors.join('\n'))
      }

      return { ok, errors }
    },
    onSuccess: async (result) => {
      setTeamIds([])
      setPhone('')
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament!.id) })
      if (result.errors.length > 0) {
        setBatchMessage(`Добавлено: ${result.ok}. Не удалось:\n${result.errors.join('\n')}`)
      } else {
        setBatchMessage(`Добавлено команд: ${result.ok}`)
      }
    },
    onError: () => setBatchMessage(null),
  })

  const lockMutation = useMutation({
    mutationFn: () => lockAllRosters(tournament!.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament!.id) })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (entryId: string) => deleteEntry(entryId),
    onSuccess: async () => {
      if (tournament) {
        await queryClient.invalidateQueries({ queryKey: tournamentKeys.entries(tournament.id) })
      }
    },
  })

  if (!tournament) {
    return (
      <EmptyState
        title="Нет турнира"
        description="Выберите турнир сверху, чтобы управлять заявками."
      />
    )
  }

  return (
    <Stack gap="lg">
      <PageHero
        title="Заявки на турнир"
        subtitle="Можно выбрать несколько команд сразу. У каждой должен быть текущий состав из 2 рыбаков — он копируется в снимок турнира."
      />

      {closed && <ClosedDayNotice />}

      <Panel>
        <Stack gap="md">
          <MultiSelect
            label="Команды"
            data={available.map((t) => ({ value: t.id, label: t.name }))}
            value={teamIds}
            onChange={setTeamIds}
            searchable
            clearable
            placeholder="Выберите одну или несколько команд"
            nothingFoundMessage="Нет доступных команд"
            disabled={closed}
          />
          <Select
            label="Квота (для всех выбранных)"
            data={[
              { value: 'open', label: 'Open (50)' },
              { value: 'prize', label: 'Призёры (10)' },
              { value: 'org', label: 'Оргкомитет (10)' },
            ]}
            value={quota}
            onChange={(v) => setQuota((v as TeamQuota) ?? 'open')}
            disabled={closed}
          />
          <TextInput
            label="Телефон на заявке (опционально, для всех)"
            value={phone}
            onChange={(e) => setPhone(e.currentTarget.value)}
            disabled={closed}
          />
          <Button
            color="signal"
            disabled={closed || teamIds.length === 0}
            loading={addMutation.isPending}
            onClick={() => {
              setBatchMessage(null)
              addMutation.mutate()
            }}
          >
            Добавить {teamIds.length > 0 ? `(${teamIds.length})` : ''} на турнир
          </Button>
          {addMutation.isError && (
            <Text c="red" size="sm" style={{ whiteSpace: 'pre-wrap' }}>
              {(addMutation.error as Error).message}
            </Text>
          )}
          {batchMessage && (
            <Text
              c={batchMessage.includes('Не удалось') ? 'orange' : 'teal'}
              size="sm"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {batchMessage}
            </Text>
          )}

          <Button
            variant="outline"
            color="orange"
            disabled={closed}
            loading={lockMutation.isPending}
            onClick={() => lockMutation.mutate()}
          >
            Зафиксировать все составы
          </Button>
        </Stack>
      </Panel>

      <div>
        <SectionTitle>Заявки ({entries.length})</SectionTitle>
        {deleteMutation.isError && (
          <Text c="red" size="sm" mb="sm">
            {(deleteMutation.error as Error).message}
          </Text>
        )}
        <Panel p={0}>
          {entries.map((e, i) => (
            <Group
              key={e.id}
              justify="space-between"
              align="flex-start"
              wrap="nowrap"
              px="sm"
              py={8}
              style={{
                borderBottom: i < entries.length - 1 ? '1px solid var(--pc-line)' : undefined,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <Text fw={800} size="sm">
                  {entryTeamName(e)}
                </Text>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {(e.roster ?? [])
                    .slice()
                    .sort((a, b) => a.slot - b.slot)
                    .map((r) => r.full_name_snapshot)
                    .join(' · ') || 'Состав пуст'}
                </Text>
                <Text size="xs" c="dimmed" className="pc-tabular">
                  {e.quota} · {e.status}
                  {e.roster_locked_at ? ' · зафиксирован' : ''}
                </Text>
              </div>
              <Button
                size="compact-xs"
                color="red"
                variant="subtle"
                disabled={closed}
                loading={deleteMutation.isPending && deleteMutation.variables === e.id}
                onClick={() => {
                  const name = entryTeamName(e)
                  if (
                    !window.confirm(
                      `Удалить заявку «${name}»? Состав и связанные уловы этой команды на турнире тоже будут удалены.`,
                    )
                  ) {
                    return
                  }
                  deleteMutation.mutate(e.id)
                }}
              >
                Удалить
              </Button>
            </Group>
          ))}
          {entries.length === 0 && (
            <Text c="dimmed" size="sm" p="sm">
              Заявок пока нет
            </Text>
          )}
        </Panel>
      </div>
    </Stack>
  )
}
